from flask import Blueprint, jsonify, request

from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    get_jwt
)

from app.extensions import db

from app.models.crop import Crop
from app.models.farm import Farm
from app.models.monitoring import MonitoringRecord
from app.models.alert import Alert
from app.models.user import User

from app.services.email_service import send_email


monitoring_bp = Blueprint(
    "monitoring",
    __name__
)


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def get_current_user_id():
    return int(
        get_jwt_identity()
    )


def get_current_role():
    return get_jwt().get(
        "role"
    )


def user_can_access_crop(
    crop,
    user_id,
    role
):

    if role == "admin":
        return True

    return crop.farm.owner_id == user_id


# =========================================================
# ALERT THRESHOLDS
# =========================================================

SOIL_MOISTURE_THRESHOLD = 30
HIGH_TEMP_THRESHOLD = 35


# =========================================================
# ALERT GENERATION
# =========================================================

def generate_alerts(record):
    """
    Generate alerts based on a monitoring record.

    Alert thresholds are based on the
    AgriWatch research specification.
    """

    alerts = []

    # -----------------------------------------------------
    # LOW SOIL MOISTURE
    # -----------------------------------------------------

    if (
        record.soil_moisture is not None
        and record.soil_moisture
        < SOIL_MOISTURE_THRESHOLD
    ):

        alerts.append(
            Alert(
                crop_id=record.crop_id,
                monitoring_id=record.id,
                alert_type="Low Soil Moisture",
                severity="Warning",
                message=(
                    f"Soil moisture is "
                    f"{record.soil_moisture:.1f}%, "
                    "which is below the 30% threshold."
                )
            )
        )

    # -----------------------------------------------------
    # HIGH CROP TEMPERATURE
    # -----------------------------------------------------

    if (
        record.crop_temperature is not None
        and record.crop_temperature
        > HIGH_TEMP_THRESHOLD
    ):

        alerts.append(
            Alert(
                crop_id=record.crop_id,
                monitoring_id=record.id,
                alert_type="High Crop Temperature",
                severity="Critical",
                message=(
                    f"Crop temperature is "
                    f"{record.crop_temperature:.1f}°C, "
                    "which is above the 35°C threshold."
                )
            )
        )

    # -----------------------------------------------------
    # PEST DETECTED
    # -----------------------------------------------------

    if record.pest_detected:

        alerts.append(
            Alert(
                crop_id=record.crop_id,
                monitoring_id=record.id,
                alert_type="Pest Detection",
                severity="Warning",
                message=(
                    "Possible pest infestation detected."
                )
            )
        )

    # -----------------------------------------------------
    # DISEASE DETECTED
    # -----------------------------------------------------

    if record.disease_detected:

        alerts.append(
            Alert(
                crop_id=record.crop_id,
                monitoring_id=record.id,
                alert_type="Disease Detection",
                severity="Critical",
                message=(
                    "Possible crop disease detected."
                )
            )
        )

    # -----------------------------------------------------
    # DISCOLORATION DETECTED
    # -----------------------------------------------------

    if record.discoloration_detected:

        alerts.append(
            Alert(
                crop_id=record.crop_id,
                monitoring_id=record.id,
                alert_type="Crop Discoloration",
                severity="Warning",
                message=(
                    "Possible crop discoloration detected."
                )
            )
        )

    return alerts


# =========================================================
# CONSOLIDATED ALERT EMAIL
# =========================================================

def send_consolidated_alert_email(
    recipient,
    crop,
    alerts
):
    """
    Send one email containing all alerts generated
    from a single monitoring record.
    """

    if not alerts:
        return

    critical_count = sum(
        1
        for alert in alerts
        if alert.severity.lower()
        == "critical"
    )

    warning_count = sum(
        1
        for alert in alerts
        if alert.severity.lower()
        == "warning"
    )

    # -----------------------------------------------------
    # Subject
    # -----------------------------------------------------

    if critical_count > 0:

        subject = (
            "AgriWatch - Critical Crop "
            "Monitoring Alert"
        )

    else:

        subject = (
            "AgriWatch - Crop Monitoring Alert"
        )

    # -----------------------------------------------------
    # Plain-text alert list
    # -----------------------------------------------------

    text_alerts = []

    for alert in alerts:

        text_alerts.append(
            f"- {alert.alert_type} "
            f"({alert.severity}): "
            f"{alert.message}"
        )

    alert_text = "\n".join(
        text_alerts
    )

    crop_name = (
        crop.crop_name
        if crop.crop_name
        else f"Crop #{crop.id}"
    )

    body = f"""
AgriWatch Crop Monitoring Alert

Hello,

AgriWatch detected conditions that may require
your attention.

Crop:
{crop_name}

Number of alerts:
{len(alerts)}

Critical:
{critical_count}

Warning:
{warning_count}

Detected Conditions:

{alert_text}

Please log in to the AgriWatch monitoring system
to review the latest monitoring information and
take appropriate action.

Regards,

AgriWatch
Smart Tomato Crop Monitoring
and Web-Based Alert System
"""

    # -----------------------------------------------------
    # HTML alert list
    # -----------------------------------------------------

    alert_items = ""

    for alert in alerts:

        severity = (
            alert.severity.lower()
        )

        if severity == "critical":

            badge_background = "#fff0ed"
            badge_color = "#b33b29"

        else:

            badge_background = "#fff6df"
            badge_color = "#9a6a05"

        alert_items += f"""
        <div style="
            margin-bottom: 12px;
            padding: 15px;
            border: 1px solid #e2e8e3;
            border-radius: 9px;
            background-color: #ffffff;
        ">

            <div style="
                margin-bottom: 7px;
            ">

                <span style="
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 20px;
                    background-color:
                        {badge_background};
                    color: {badge_color};
                    font-size: 10px;
                    font-weight: bold;
                    text-transform: uppercase;
                ">
                    {alert.severity}
                </span>

            </div>

            <div style="
                margin-bottom: 6px;
                color: #203c28;
                font-size: 14px;
                font-weight: bold;
            ">
                {alert.alert_type}
            </div>

            <div style="
                color: #68736b;
                font-size: 13px;
                line-height: 1.5;
            ">
                {alert.message}
            </div>

        </div>
        """

    # -----------------------------------------------------
    # HTML email
    # -----------------------------------------------------

    html_body = f"""
<!DOCTYPE html>

<html>

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width,
                 initial-scale=1.0"
    >

</head>


<body style="
    margin: 0;
    padding: 0;
    background-color: #f4f7f4;
    font-family: Arial, Helvetica, sans-serif;
">


<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        background-color: #f4f7f4;
        padding: 35px 15px;
    "
>

<tr>

<td align="center">


<table
    width="600"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        max-width: 600px;
        width: 100%;
        background-color: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #e1e8e3;
    "
>


<!-- =====================================================
     HEADER
===================================================== -->

<tr>

<td style="
    background-color: #2f7543;
    padding: 24px 30px;
">

    <div style="
        color: #ffffff;
        font-size: 24px;
        font-weight: bold;
    ">
        AgriWatch
    </div>

    <div style="
        margin-top: 5px;
        color: #dcebdd;
        font-size: 12px;
    ">
        Smart Tomato Crop Monitoring
        and Web-Based Alert System
    </div>

</td>

</tr>


<!-- =====================================================
     CONTENT
===================================================== -->

<tr>

<td style="
    padding: 30px;
">


<h1 style="
    margin: 0 0 8px 0;
    color: #183b24;
    font-size: 22px;
">

    Crop Monitoring Alert

</h1>


<p style="
    margin: 0 0 22px 0;
    color: #66726a;
    font-size: 13px;
    line-height: 1.6;
">

    AgriWatch detected conditions that may
    require your attention.

</p>


<!-- Crop information -->

<div style="
    margin-bottom: 22px;
    padding: 16px;
    background-color: #f7f9f7;
    border: 1px solid #e3e9e4;
    border-radius: 9px;
">

    <div style="
        margin-bottom: 5px;
        color: #7b857e;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.7px;
    ">
        Crop
    </div>

    <div style="
        color: #203c28;
        font-size: 15px;
        font-weight: bold;
    ">
        {crop_name}
    </div>

</div>


<!-- Summary -->

<div style="
    margin-bottom: 22px;
">

    <div style="
        margin-bottom: 10px;
        color: #7b857e;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.7px;
    ">
        Alert Summary
    </div>


    <div style="
        color: #4f5d53;
        font-size: 13px;
        line-height: 1.6;
    ">

        <strong>{len(alerts)}</strong>
        condition(s) detected

        &nbsp;&nbsp;|&nbsp;&nbsp;

        <strong>{critical_count}</strong>
        Critical

        &nbsp;&nbsp;|&nbsp;&nbsp;

        <strong>{warning_count}</strong>
        Warning

    </div>

</div>


<!-- Alert list -->

<div style="
    margin-bottom: 22px;
">

    {alert_items}

</div>


<p style="
    margin: 0;
    color: #68736b;
    font-size: 13px;
    line-height: 1.6;
">

    Please log in to the
    <strong>AgriWatch monitoring system</strong>
    to review the latest crop information
    and take appropriate action.

</p>


</td>

</tr>


<!-- =====================================================
     FOOTER
===================================================== -->

<tr>

<td style="
    padding: 20px 30px;
    background-color: #f7f9f7;
    border-top: 1px solid #e7ece8;
">

    <p style="
        margin: 0;
        color: #7b857e;
        font-size: 11px;
        line-height: 1.5;
    ">

        This is an automated message from AgriWatch.
        Please do not reply directly to this email.

    </p>


    <p style="
        margin: 8px 0 0 0;
        color: #9aa29d;
        font-size: 11px;
    ">

        Smart Tomato Crop Monitoring
        and Web-Based Alert System

    </p>

</td>

</tr>


</table>


</td>

</tr>

</table>


</body>

</html>
"""

    # -----------------------------------------------------
    # Send email
    # -----------------------------------------------------

    send_email(
        recipient=recipient,
        subject=subject,
        body=body,
        html_body=html_body
    )


# =========================================================
# GET ALL MONITORING RECORDS
# =========================================================

@monitoring_bp.get(
    "/",
    strict_slashes=False
)
@jwt_required()
def get_monitoring_records():

    user_id = get_current_user_id()
    role = get_current_role()

    query = (
        MonitoringRecord.query
        .join(Crop)
        .join(Farm)
    )

    if role != "admin":

        query = query.filter(
            Farm.owner_id == user_id
        )

    records = (
        query
        .order_by(
            MonitoringRecord.recorded_at.desc()
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
# GET MONITORING RECORDS FOR ONE CROP
# =========================================================

@monitoring_bp.get(
    "/crop/<int:crop_id>"
)
@jwt_required()
def get_crop_monitoring(crop_id):

    user_id = get_current_user_id()
    role = get_current_role()

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
        crop,
        user_id,
        role
    ):

        return jsonify({
            "status": "error",
            "message": (
                "You do not have permission to "
                "view this crop's monitoring records."
            )
        }), 403

    records = (
        MonitoringRecord.query
        .filter_by(
            crop_id=crop_id
        )
        .order_by(
            MonitoringRecord.recorded_at.desc()
        )
        .all()
    )

    return jsonify({
        "status": "success",
        "crop_id": crop_id,
        "monitoring": [
            record.to_dict()
            for record in records
        ]
    }), 200


# =========================================================
# GET ONE MONITORING RECORD
# =========================================================

@monitoring_bp.get(
    "/<int:monitoring_id>"
)
@jwt_required()
def get_monitoring_record(
    monitoring_id
):

    user_id = get_current_user_id()
    role = get_current_role()

    record = db.session.get(
        MonitoringRecord,
        monitoring_id
    )

    if not record:

        return jsonify({
            "status": "error",
            "message": (
                "Monitoring record not found."
            )
        }), 404

    if not user_can_access_crop(
        record.crop,
        user_id,
        role
    ):

        return jsonify({
            "status": "error",
            "message": (
                "You do not have permission to "
                "view this monitoring record."
            )
        }), 403

    return jsonify({
        "status": "success",
        "monitoring": record.to_dict()
    }), 200


# =========================================================
# CREATE MONITORING RECORD
# =========================================================

@monitoring_bp.post(
    "/",
    strict_slashes=False
)
@jwt_required()
def create_monitoring_record():

    user_id = get_current_user_id()
    role = get_current_role()

    data = request.get_json() or {}

    crop_id = data.get(
        "crop_id"
    )

    # =====================================================
    # VALIDATE CROP ID
    # =====================================================

    if crop_id is None:

        return jsonify({
            "status": "error",
            "message": "crop_id is required."
        }), 400

    try:

        crop_id = int(
            crop_id
        )

    except (
        TypeError,
        ValueError
    ):

        return jsonify({
            "status": "error",
            "message": (
                "crop_id must be a valid integer."
            )
        }), 400

    # =====================================================
    # FIND CROP
    # =====================================================

    crop = db.session.get(
        Crop,
        crop_id
    )

    if not crop:

        return jsonify({
            "status": "error",
            "message": "Crop not found."
        }), 404

    # =====================================================
    # CHECK CROP OWNERSHIP
    # =====================================================

    if not user_can_access_crop(
        crop,
        user_id,
        role
    ):

        return jsonify({
            "status": "error",
            "message": (
                "You do not have permission to add "
                "monitoring data to this crop."
            )
        }), 403

    # =====================================================
    # NUMERIC VALUES
    # =====================================================

    soil_moisture = data.get(
        "soil_moisture"
    )

    crop_temperature = data.get(
        "crop_temperature"
    )

    # -----------------------------------------------------
    # Soil moisture
    # -----------------------------------------------------

    if soil_moisture is not None:

        try:

            soil_moisture = float(
                soil_moisture
            )

        except (
            TypeError,
            ValueError
        ):

            return jsonify({
                "status": "error",
                "message": (
                    "soil_moisture must be "
                    "a valid number."
                )
            }), 400

        if (
            soil_moisture < 0
            or soil_moisture > 100
        ):

            return jsonify({
                "status": "error",
                "message": (
                    "soil_moisture must be "
                    "between 0 and 100."
                )
            }), 400

    # -----------------------------------------------------
    # Crop temperature
    # -----------------------------------------------------

    if crop_temperature is not None:

        try:

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
                    "crop_temperature must be "
                    "a valid number."
                )
            }), 400

    # =====================================================
    # BOOLEAN VALUES
    # =====================================================

    pest_detected = bool(
        data.get(
            "pest_detected",
            False
        )
    )

    disease_detected = bool(
        data.get(
            "disease_detected",
            False
        )
    )

    discoloration_detected = bool(
        data.get(
            "discoloration_detected",
            False
        )
    )

    # =====================================================
    # PLANT CONDITION
    # =====================================================

    plant_condition = data.get(
        "plant_condition",
        "Healthy"
    )

    allowed_conditions = [
        "Healthy",
        "Needs Attention",
        "Critical"
    ]

    if plant_condition not in allowed_conditions:

        return jsonify({
            "status": "error",
            "message": (
                "plant_condition must be one of: "
                + ", ".join(
                    allowed_conditions
                )
            )
        }), 400

    # =====================================================
    # CREATE MONITORING RECORD
    # =====================================================

    record = MonitoringRecord(
        crop_id=crop_id,
        soil_moisture=soil_moisture,
        crop_temperature=crop_temperature,
        pest_detected=pest_detected,
        disease_detected=disease_detected,
        discoloration_detected=discoloration_detected,
        plant_condition=plant_condition
    )

    db.session.add(
        record
    )

    # =====================================================
    # SAVE MONITORING + ALERTS
    # =====================================================

    try:

        # -------------------------------------------------
        # Assign monitoring ID
        # -------------------------------------------------

        db.session.flush()

        # -------------------------------------------------
        # Generate alerts
        # -------------------------------------------------

        alerts = generate_alerts(
            record
        )

        # -------------------------------------------------
        # Add alerts
        # -------------------------------------------------

        for alert in alerts:

            db.session.add(
                alert
            )

        # -------------------------------------------------
        # Commit database transaction
        # -------------------------------------------------

        db.session.commit()

    except Exception as error:

        db.session.rollback()

        print(
            "Monitoring creation error:",
            error
        )

        return jsonify({
            "status": "error",
            "message": (
                "Unable to create monitoring record."
            )
        }), 500

    # =====================================================
    # SEND EMAIL NOTIFICATION
    # =====================================================

    email_sent = False

    if alerts:

        try:

            # -------------------------------------------------
            # Get farm owner
            # -------------------------------------------------

            owner = db.session.get(
                User,
                crop.farm.owner_id
            )

            if owner and owner.email:

                send_consolidated_alert_email(
                    recipient=owner.email,
                    crop=crop,
                    alerts=alerts
                )

                email_sent = True

                print(
                    f"Alert email sent to {owner.email}"
                )

        except Exception as error:

            # -------------------------------------------------
            # Important:
            #
            # Email failure should NOT undo the monitoring
            # record and alerts because they have already
            # been successfully committed.
            # -------------------------------------------------

            print(
                "Alert email error:",
                error
            )

    # =====================================================
    # SUCCESS RESPONSE
    # =====================================================

    return jsonify({

        "status": "success",

        "message": (
            "Monitoring record created successfully."
        ),

        "monitoring": (
            record.to_dict()
        ),

        "alerts_created": (
            len(alerts)
        ),

        "email_sent": (
            email_sent
        )

    }), 201


# =========================================================
# DELETE MONITORING RECORD
# =========================================================

@monitoring_bp.delete(
    "/<int:monitoring_id>"
)
@jwt_required()
def delete_monitoring_record(
    monitoring_id
):

    user_id = get_current_user_id()
    role = get_current_role()

    record = db.session.get(
        MonitoringRecord,
        monitoring_id
    )

    if not record:

        return jsonify({
            "status": "error",
            "message": (
                "Monitoring record not found."
            )
        }), 404

    if not user_can_access_crop(
        record.crop,
        user_id,
        role
    ):

        return jsonify({
            "status": "error",
            "message": (
                "You do not have permission to "
                "delete this monitoring record."
            )
        }), 403

    db.session.delete(
        record
    )

    try:

        db.session.commit()

    except Exception as error:

        db.session.rollback()

        print(
            "Monitoring deletion error:",
            error
        )

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
        )
    }), 200