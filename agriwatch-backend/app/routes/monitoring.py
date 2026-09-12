from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    get_jwt
)
import traceback

from app.extensions import db
from app.models.user import User
from app.models.crop import Crop
from app.models.monitoring import MonitoringRecord
from app.models.alert import Alert

from app.services.email_service import send_email


monitoring_bp = Blueprint(
    "monitoring",
    __name__
)


# =========================================================
# AGRIWATCH MONITORING THRESHOLDS
# =========================================================

SOIL_MOISTURE_THRESHOLD = 30
HIGH_TEMP_THRESHOLD = 35


# =========================================================
# AUTHENTICATION HELPERS
# =========================================================

def get_current_user_id():

    return int(
        get_jwt_identity()
    )


def get_current_role():

    claims = get_jwt()

    return claims.get(
        "role"
    )


# =========================================================
# ACCESS CONTROL
# =========================================================

def user_can_access_crop(
    crop
):

    user_id = get_current_user_id()
    role = get_current_role()

    if role == "admin":
        return True

    if not crop or not crop.farm:
        return False

    if crop.farm.owner_id == user_id:
        return True

    return False


# =========================================================
# DETERMINE CROP STATUS
# =========================================================

def determine_crop_status(
    record
):
    """
    Determines the crop status from the current
    monitoring record.

    Priority:

    Critical
        - Plant condition is Critical
        - Disease detected
        - Crop temperature > 35°C

    Needs Attention
        - Plant condition is Needs Attention
        - Soil moisture < 30%
        - Pest detected
        - Discoloration detected

    Healthy
        - No critical or warning condition
    """

    # -----------------------------------------------------
    # HARVESTED SHOULD REMAIN HARVESTED
    # -----------------------------------------------------

    if (
        record.crop
        and record.crop.status == "Harvested"
    ):
        return "Harvested"

    # -----------------------------------------------------
    # CRITICAL CONDITIONS
    # -----------------------------------------------------

    if record.plant_condition == "Critical":
        return "Critical"

    if record.disease_detected:
        return "Critical"

    if (
        record.crop_temperature is not None
        and record.crop_temperature > HIGH_TEMP_THRESHOLD
    ):
        return "Critical"

    # -----------------------------------------------------
    # WARNING CONDITIONS
    # -----------------------------------------------------

    if record.plant_condition == "Needs Attention":
        return "Needs Attention"

    if (
        record.soil_moisture is not None
        and record.soil_moisture < SOIL_MOISTURE_THRESHOLD
    ):
        return "Needs Attention"

    if record.pest_detected:
        return "Needs Attention"

    if record.discoloration_detected:
        return "Needs Attention"

    # -----------------------------------------------------
    # HEALTHY
    # -----------------------------------------------------

    return "Healthy"


# =========================================================
# UPDATE CROP STATUS
# =========================================================

def update_crop_status(
    crop,
    record
):

    crop.status = determine_crop_status(
        record
    )


# =========================================================
# RECALCULATE CROP STATUS
# =========================================================

def recalculate_crop_status(
    crop
):
    """
    Recalculates the crop status using the latest
    remaining monitoring record.
    """

    latest_record = (
        MonitoringRecord.query
        .filter_by(
            crop_id=crop.id
        )
        .order_by(
            MonitoringRecord.recorded_at.desc(),
            MonitoringRecord.id.desc()
        )
        .first()
    )

    if latest_record:

        crop.status = determine_crop_status(
            latest_record
        )

    else:

        if crop.status != "Harvested":
            crop.status = "Healthy"


# =========================================================
# BUILD CURRENT ALERT CONDITIONS
# =========================================================

def get_alert_conditions(
    record
):
    """
    Builds the possible alert conditions for a
    monitoring record.
    """

    return [

        {
            "alert_type": "Low Soil Moisture",

            "severity": "Warning",

            "message": (
                f"Soil moisture is "
                f"{record.soil_moisture}%. "
                f"Immediate monitoring may be needed."
            ),

            "active": (
                record.soil_moisture is not None
                and record.soil_moisture < SOIL_MOISTURE_THRESHOLD
            )
        },

        {
            "alert_type": "High Crop Temperature",

            "severity": "Critical",

            "message": (
                f"Crop temperature is "
                f"{record.crop_temperature}°C, "
                f"which exceeds the "
                f"{HIGH_TEMP_THRESHOLD}°C threshold."
            ),

            "active": (
                record.crop_temperature is not None
                and record.crop_temperature > HIGH_TEMP_THRESHOLD
            )
        },

        {
            "alert_type": "Pest Detection",

            "severity": "Warning",

            "message": (
                "Possible pest infestation detected."
            ),

            "active": bool(
                record.pest_detected
            )
        },

        {
            "alert_type": "Disease Detection",

            "severity": "Critical",

            "message": (
                "Possible crop disease detected."
            ),

            "active": bool(
                record.disease_detected
            )
        },

        {
            "alert_type": "Crop Discoloration",

            "severity": "Warning",

            "message": (
                "Possible crop discoloration detected."
            ),

            "active": bool(
                record.discoloration_detected
            )
        }

    ]


# =========================================================
# GET PREVIOUS MONITORING RECORD
# =========================================================

def get_previous_monitoring_record(
    record
):
    """
    Gets the previous monitoring record for
    the same crop.
    """

    return (
        MonitoringRecord.query
        .filter(
            MonitoringRecord.crop_id == record.crop_id,
            MonitoringRecord.id != record.id
        )
        .order_by(
            MonitoringRecord.recorded_at.desc(),
            MonitoringRecord.id.desc()
        )
        .first()
    )


# =========================================================
# SYNCHRONIZE ALERT STATE
# =========================================================

def synchronize_alerts(
    record
):
    """
    Synchronizes database alert state with the
    latest monitoring record.

    Returns:

        newly_created_alerts
        resolved_alerts
        notification_alerts

    Alert records:
        - Do not duplicate while a condition remains active.
        - Resolve when a condition becomes normal.
        - Remain in history after resolution.

    Notification behavior:
        - Every new abnormal monitoring reading can
          generate an email notification.
        - Continuing alerts do not create duplicate
          Alert records.
    """

    current_conditions = (
        get_alert_conditions(
            record
        )
    )

    newly_created_alerts = []
    resolved_alerts = []
    notification_alerts = []

    print(
        f"[ALERT SYNC] Monitoring ID={record.id} "
        f"Crop ID={record.crop_id}"
    )

    for condition in current_conditions:

        alert_type = condition["alert_type"]
        severity = condition["severity"]
        message = condition["message"]
        is_active = condition["active"]

        # -------------------------------------------------
        # FIND ACTIVE ALERTS
        # -------------------------------------------------

        active_alerts = (
            Alert.query
            .filter(
                Alert.crop_id == record.crop_id,
                Alert.alert_type == alert_type,
                Alert.is_resolved == False
            )
            .order_by(
                Alert.created_at.desc(),
                Alert.id.desc()
            )
            .all()
        )

        print(
            f"[ALERT SYNC] {alert_type} | "
            f"current_active={is_active} | "
            f"existing_active_alerts={len(active_alerts)}"
        )

        # =================================================
        # CONDITION IS ACTIVE
        # =================================================

        if is_active:

            # ---------------------------------------------
            # ACTIVE ALERT ALREADY EXISTS
            # ---------------------------------------------

            if active_alerts:

                current_alert = active_alerts[0]

                print(
                    f"[ALERT SYNC] Keeping existing active "
                    f"alert ID={current_alert.id} "
                    f"for {alert_type}."
                )

                # -------------------------------------------------
                # IMPORTANT:
                # The existing alert is reused for EMAIL.
                # This means a new monitoring event can still
                # trigger an email without creating a duplicate
                # alert record.
                # -------------------------------------------------

                notification_alert = Alert(

                    crop_id=record.crop_id,

                    monitoring_id=record.id,

                    alert_type=alert_type,

                    severity=severity,

                    message=message,

                    is_read=False,

                    is_resolved=False

                )

                notification_alerts.append(
                    notification_alert
                )

                # ---------------------------------------------
                # RESOLVE DUPLICATE ACTIVE ALERT RECORDS
                # ---------------------------------------------

                if len(active_alerts) > 1:

                    for duplicate in active_alerts[1:]:

                        duplicate.is_resolved = True

                        duplicate.is_read = True

                        duplicate.resolved_at = (
                            record.recorded_at
                        )

                        resolved_alerts.append(
                            duplicate
                        )

                        print(
                            f"[ALERT SYNC] Resolved duplicate "
                            f"alert ID={duplicate.id}"
                        )

            # ---------------------------------------------
            # NO ACTIVE ALERT EXISTS
            # ---------------------------------------------

            else:

                print(
                    f"[ALERT SYNC] Creating NEW alert "
                    f"for {alert_type}."
                )

                new_alert = Alert(

                    crop_id=record.crop_id,

                    monitoring_id=record.id,

                    alert_type=alert_type,

                    severity=severity,

                    message=message,

                    is_read=False,

                    is_resolved=False

                )

                db.session.add(
                    new_alert
                )

                newly_created_alerts.append(
                    new_alert
                )

                # Use the actual new alert for the email.
                notification_alerts.append(
                    new_alert
                )

        # =================================================
        # CONDITION IS NORMAL
        # =================================================

        else:

            if active_alerts:

                print(
                    f"[ALERT SYNC] Resolving "
                    f"{len(active_alerts)} active "
                    f"alert(s) for {alert_type}."
                )

            for active_alert in active_alerts:

                active_alert.is_resolved = True

                active_alert.is_read = True

                active_alert.resolved_at = (
                    record.recorded_at
                )

                resolved_alerts.append(
                    active_alert
                )

                print(
                    f"[ALERT SYNC] Resolved alert "
                    f"ID={active_alert.id}"
                )

    print(
        f"[ALERT SYNC] Created="
        f"{len(newly_created_alerts)} | "
        f"Resolved="
        f"{len(resolved_alerts)} | "
        f"Notifications="
        f"{len(notification_alerts)}"
    )

    return (
        newly_created_alerts,
        resolved_alerts,
        notification_alerts
    )


# =========================================================
# CONSOLIDATED ALERT EMAIL
# =========================================================

def send_consolidated_alert_email(
    recipient,
    crop,
    alerts
):

    critical_alerts = [

        alert

        for alert in alerts

        if alert.severity.lower() == "critical"

    ]

    if critical_alerts:

        subject = (
            f"AgriWatch Critical Alert - "
            f"{crop.crop_name}"
        )

    else:

        subject = (
            f"AgriWatch Crop Alert - "
            f"{crop.crop_name}"
        )

    # =====================================================
    # PLAIN TEXT EMAIL
    # =====================================================

    body_lines = [

        "AgriWatch Crop Monitoring Alert",

        "",

        f"Crop: {crop.crop_name}",

        f"Farm: {crop.farm.farm_name}",

        f"Current Status: {crop.status}",

        "",

        "Detected Conditions:",

    ]

    for alert in alerts:

        body_lines.append(

            f"- {alert.alert_type} "
            f"({alert.severity}): "
            f"{alert.message}"

        )

    body_lines.extend([

        "",

        "Please review the monitoring information "
        "in the AgriWatch dashboard.",

        "",

        "AgriWatch Smart Tomato Crop Monitoring "
        "and Web-Based Alert System",

    ])

    body = "\n".join(
        body_lines
    )

    # =====================================================
    # HTML EMAIL
    # =====================================================

    alert_rows = ""

    for alert in alerts:

        severity_class = (

            "critical"

            if alert.severity.lower() == "critical"

            else "warning"

        )

        alert_rows += f"""
        <tr>

            <td style="
                padding:12px;
                border-bottom:1px solid #e5e7eb;
                font-weight:600;
                color:#243b2a;
            ">
                {alert.alert_type}
            </td>

            <td style="
                padding:12px;
                border-bottom:1px solid #e5e7eb;
            ">

                <span style="
                    display:inline-block;
                    padding:4px 9px;
                    border-radius:20px;
                    font-size:12px;
                    font-weight:700;
                    background:{
                        '#fde8e5'
                        if severity_class == 'critical'
                        else '#fff3d6'
                    };
                    color:{
                        '#b42318'
                        if severity_class == 'critical'
                        else '#9a6700'
                    };
                ">
                    {alert.severity}
                </span>

            </td>

            <td style="
                padding:12px;
                border-bottom:1px solid #e5e7eb;
                color:#5f6f63;
            ">
                {alert.message}
            </td>

        </tr>
        """

    html_body = f"""
    <!DOCTYPE html>

    <html>

    <body style="
        margin:0;
        padding:0;
        background:#f4f7f4;
        font-family:Arial,Helvetica,sans-serif;
    ">

        <div style="
            max-width:650px;
            margin:30px auto;
            background:#ffffff;
            border-radius:12px;
            overflow:hidden;
            border:1px solid #dfe7e1;
        ">

            <div style="
                padding:24px;
                background:#1f5a32;
                color:#ffffff;
            ">

                <h1 style="
                    margin:0;
                    font-size:22px;
                ">
                    AgriWatch
                </h1>

                <p style="
                    margin:6px 0 0;
                    opacity:.9;
                    font-size:13px;
                ">
                    Smart Tomato Crop Monitoring
                </p>

            </div>

            <div style="
                padding:25px;
            ">

                <h2 style="
                    margin:0 0 8px;
                    color:#243b2a;
                    font-size:20px;
                ">
                    Crop Monitoring Alert
                </h2>

                <p style="
                    color:#66736a;
                    font-size:14px;
                    line-height:1.6;
                ">
                    AgriWatch detected one or more
                    conditions that require your attention.
                </p>

                <div style="
                    margin:20px 0;
                    padding:16px;
                    background:#f3f7f3;
                    border-radius:9px;
                ">

                    <p style="
                        margin:0 0 7px;
                        color:#536158;
                        font-size:13px;
                    ">
                        <strong>Crop:</strong>
                        {crop.crop_name}
                    </p>

                    <p style="
                        margin:0 0 7px;
                        color:#536158;
                        font-size:13px;
                    ">
                        <strong>Farm:</strong>
                        {crop.farm.farm_name}
                    </p>

                    <p style="
                        margin:0;
                        color:#536158;
                        font-size:13px;
                    ">
                        <strong>Current Status:</strong>
                        {crop.status}
                    </p>

                </div>

                <table
                    style="
                        width:100%;
                        border-collapse:collapse;
                        font-size:13px;
                    "
                >

                    <thead>

                        <tr style="
                            background:#f5f7f5;
                            text-align:left;
                        ">

                            <th style="
                                padding:12px;
                                color:#526056;
                            ">
                                Condition
                            </th>

                            <th style="
                                padding:12px;
                                color:#526056;
                            ">
                                Severity
                            </th>

                            <th style="
                                padding:12px;
                                color:#526056;
                            ">
                                Details
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {alert_rows}

                    </tbody>

                </table>

                <p style="
                    margin-top:25px;
                    color:#66736a;
                    font-size:13px;
                    line-height:1.6;
                ">
                    Please log in to the AgriWatch dashboard
                    to review the latest monitoring data
                    and take appropriate action.
                </p>

            </div>

            <div style="
                padding:18px 25px;
                background:#f7f9f7;
                border-top:1px solid #e5ebe6;
                color:#87928a;
                font-size:11px;
            ">

                AgriWatch Smart Tomato Crop Monitoring
                and Web-Based Alert System

            </div>

        </div>

    </body>

    </html>
    """

    return send_email(
        recipient=recipient,
        subject=subject,
        body=body,
        html_body=html_body
    )


# =========================================================
# GET ALL MONITORING RECORDS
# =========================================================

@monitoring_bp.route(
    "",
    methods=["GET"],
    strict_slashes=False
)
@jwt_required()
def get_monitoring_records():

    user_id = get_current_user_id()

    role = get_current_role()

    query = MonitoringRecord.query

    if role == "admin":

        records = (
            query
            .order_by(
                MonitoringRecord.recorded_at.desc(),
                MonitoringRecord.id.desc()
            )
            .all()
        )

    else:

        records = (
            query
            .join(Crop)
            .filter(
                Crop.farm.has(
                    owner_id=user_id
                )
            )
            .order_by(
                MonitoringRecord.recorded_at.desc(),
                MonitoringRecord.id.desc()
            )
            .all()
        )

    return jsonify({

        "status": "success",

        "monitoring": [
            record.to_dict()
            for record in records
        ]

    }), 200


# =========================================================
# CREATE MONITORING RECORD
# =========================================================

@monitoring_bp.route(
    "",
    methods=["POST"],
    strict_slashes=False
)
@jwt_required()
def create_monitoring_record():

    data = request.get_json(
        silent=True
    ) or {}

    crop_id = data.get(
        "crop_id"
    )

    if not crop_id:

        return jsonify({
            "status": "error",
            "message": "crop_id is required."
        }), 400

    crop = db.session.get(
        Crop,
        crop_id
    )

    if not crop:

        return jsonify({
            "status": "error",
            "message": "Crop not found."
        }), 404

    # -----------------------------------------------------
    # ACCESS CHECK
    # -----------------------------------------------------

    if not user_can_access_crop(
        crop
    ):

        return jsonify({
            "status": "error",
            "message": "You do not have access to this crop."
        }), 403

    # -----------------------------------------------------
    # GET VALUES
    # -----------------------------------------------------

    soil_moisture = data.get(
        "soil_moisture"
    )

    crop_temperature = data.get(
        "crop_temperature"
    )

    pest_detected = data.get(
        "pest_detected",
        False
    )

    disease_detected = data.get(
        "disease_detected",
        False
    )

    discoloration_detected = data.get(
        "discoloration_detected",
        False
    )

    plant_condition = data.get(
        "plant_condition",
        "Healthy"
    )

    # -----------------------------------------------------
    # VALIDATE NUMERIC VALUES
    # -----------------------------------------------------

    try:

        if soil_moisture is not None:

            soil_moisture = float(
                soil_moisture
            )

        if crop_temperature is not None:

            crop_temperature = float(
                crop_temperature
            )

    except (
        TypeError,
        ValueError
    ):

        return jsonify({
            "status": "error",
            "message": (
                "Soil moisture and crop temperature "
                "must be valid numbers."
            )
        }), 400

    # -----------------------------------------------------
    # CREATE MONITORING RECORD
    # -----------------------------------------------------

    record = MonitoringRecord(

        crop_id=crop.id,

        soil_moisture=soil_moisture,

        crop_temperature=crop_temperature,

        pest_detected=bool(
            pest_detected
        ),

        disease_detected=bool(
            disease_detected
        ),

        discoloration_detected=bool(
            discoloration_detected
        ),

        plant_condition=plant_condition,

    )

    db.session.add(
        record
    )

    # -----------------------------------------------------
    # FLUSH
    # -----------------------------------------------------

    try:

        db.session.flush()

    except Exception as error:

        db.session.rollback()

        print(
            "[MONITORING] Flush error:",
            error
        )

        traceback.print_exc()

        return jsonify({
            "status": "error",
            "message": (
                "Unable to create monitoring record."
            )
        }), 500

    print(
        f"[MONITORING] Creating monitoring record "
        f"ID={record.id} for crop ID={crop.id}"
    )

    # -----------------------------------------------------
    # UPDATE CROP STATUS
    # -----------------------------------------------------

    update_crop_status(
        crop,
        record
    )

    print(
        f"[MONITORING] Crop status updated to "
        f"'{crop.status}'"
    )

    # -----------------------------------------------------
    # SYNCHRONIZE ALERTS
    # -----------------------------------------------------

    (
        alerts,
        resolved_alerts,
        notification_alerts
    ) = synchronize_alerts(
        record
    )

    # -----------------------------------------------------
    # SAVE EVERYTHING
    # -----------------------------------------------------

    try:

        db.session.commit()

    except Exception as error:

        db.session.rollback()

        print(
            "[MONITORING] Database commit error:",
            error
        )

        traceback.print_exc()

        return jsonify({
            "status": "error",
            "message": (
                "Unable to save monitoring record."
            )
        }), 500

    print(
        f"[MONITORING] Database commit successful "
        f"for monitoring ID={record.id}"
    )

    print(
        f"[MONITORING] alerts_created="
        f"{len(alerts)}, "
        f"alerts_resolved="
        f"{len(resolved_alerts)}, "
        f"notifications="
        f"{len(notification_alerts)}"
    )

    # -----------------------------------------------------
    # SEND EMAIL FOR EVERY ABNORMAL MONITORING EVENT
    # -----------------------------------------------------

    email_sent = False
    email_error = None

    if notification_alerts:

        print(
            "[EMAIL] Abnormal monitoring event detected."
        )

        try:

            owner_id = crop.farm.owner_id

            print(
                f"[EMAIL] Looking up farm owner "
                f"ID={owner_id}"
            )

            owner = db.session.get(
                User,
                owner_id
            )

            if not owner:

                print(
                    f"[EMAIL] ERROR: No user found "
                    f"for owner ID={owner_id}"
                )

                email_error = (
                    "Farm owner account was not found."
                )

            elif not owner.email:

                print(
                    f"[EMAIL] ERROR: Farm owner ID="
                    f"{owner_id} has no email address."
                )

                email_error = (
                    "Farm owner does not have an email address."
                )

            else:

                print(
                    f"[EMAIL] Sending consolidated alert "
                    f"email to {owner.email} "
                    f"with {len(notification_alerts)} condition(s)."
                )

                send_consolidated_alert_email(

                    recipient=owner.email,

                    crop=crop,

                    alerts=notification_alerts

                )

                email_sent = True

                print(
                    f"[EMAIL] Alert email sent successfully "
                    f"to {owner.email}"
                )

        except Exception as error:

            email_error = str(
                error
            )

            print(
                "[EMAIL] ERROR:",
                error
            )

            traceback.print_exc()

    else:

        print(
            "[EMAIL] Monitoring record is normal. "
            "No email was sent."
        )

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return jsonify({

        "status": "success",

        "message": (
            "Monitoring record created successfully."
        ),

        "monitoring": record.to_dict(),

        "crop_status": crop.status,

        "alerts_created": len(
            alerts
        ),

        "alerts_resolved": len(
            resolved_alerts
        ),

        "email_sent": email_sent,

        "email_error": email_error

    }), 201


# =========================================================
# GET MONITORING RECORDS FOR ONE CROP
# =========================================================

@monitoring_bp.route(
    "/crop/<int:crop_id>",
    methods=["GET"]
)
@jwt_required()
def get_crop_monitoring(
    crop_id
):

    crop = db.session.get(
        Crop,
        crop_id
    )

    if not crop:

        return jsonify({
            "status": "error",
            "message": "Crop not found."
        }), 404

    if not user_can_access_crop(
        crop
    ):

        return jsonify({
            "status": "error",
            "message": "You do not have access to this crop."
        }), 403

    records = (
        MonitoringRecord.query
        .filter_by(
            crop_id=crop_id
        )
        .order_by(
            MonitoringRecord.recorded_at.desc(),
            MonitoringRecord.id.desc()
        )
        .all()
    )

    return jsonify({

        "status": "success",

        "monitoring": [
            record.to_dict()
            for record in records
        ]

    }), 200


# =========================================================
# GET SINGLE MONITORING RECORD
# =========================================================

@monitoring_bp.route(
    "/<int:monitoring_id>",
    methods=["GET"]
)
@jwt_required()
def get_monitoring_record(
    monitoring_id
):

    record = db.session.get(
        MonitoringRecord,
        monitoring_id
    )

    if not record:

        return jsonify({
            "status": "error",
            "message": "Monitoring record not found."
        }), 404

    if not user_can_access_crop(
        record.crop
    ):

        return jsonify({
            "status": "error",
            "message": (
                "You do not have access to this monitoring record."
            )
        }), 403

    return jsonify({

        "status": "success",

        "monitoring": record.to_dict()

    }), 200


# =========================================================
# DELETE MONITORING RECORD
# =========================================================

@monitoring_bp.route(
    "/<int:monitoring_id>",
    methods=["DELETE"]
)
@jwt_required()
def delete_monitoring_record(
    monitoring_id
):

    record = db.session.get(
        MonitoringRecord,
        monitoring_id
    )

    if not record:

        return jsonify({
            "status": "error",
            "message": "Monitoring record not found."
        }), 404

    crop = record.crop

    if not user_can_access_crop(
        crop
    ):

        return jsonify({
            "status": "error",
            "message": (
                "You do not have access to this monitoring record."
            )
        }), 403

    # -----------------------------------------------------
    # DELETE RECORD
    # -----------------------------------------------------

    db.session.delete(
        record
    )

    db.session.flush()

    # -----------------------------------------------------
    # RECALCULATE CROP STATUS
    # -----------------------------------------------------

    recalculate_crop_status(
        crop
    )

    try:

        db.session.commit()

    except Exception as error:

        db.session.rollback()

        print(
            "Monitoring deletion error:",
            error
        )

        traceback.print_exc()

        return jsonify({
            "status": "error",
            "message": (
                "Unable to delete monitoring record."
            )
        }), 500

    return jsonify({

        "status": "success",

        "message": (
            "Monitoring record deleted successfully."
        ),

        "crop_status": crop.status

    }), 200