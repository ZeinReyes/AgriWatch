from datetime import datetime

from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from sqlalchemy import func

from app.extensions import db
from app.models.farm import Farm
from app.models.crop import Crop
from app.models.monitoring import MonitoringRecord
from app.models.alert import Alert


reports_bp = Blueprint("reports", __name__)


SOIL_MOISTURE_THRESHOLD = 30
HIGH_TEMP_THRESHOLD = 35


def get_scoped_ids(role, user_id):
    """
    Determines which farms/crops the current user can include
    in reports.

    Admin:
        Can see all farms and crops.

    Farmer:
        Can only see farms they own and the crops belonging
        to those farms.

    Viewer:
        Reports are read-only and currently cover the system's
        available report data because the current database model
        does not associate viewers with specific farms.
    """

    if role in {"admin", "viewer"}:
        farm_ids = [
            farm_id
            for (farm_id,) in db.session.query(Farm.id).all()
        ]

        crop_ids = [
            crop_id
            for (crop_id,) in db.session.query(Crop.id).all()
        ]

        return farm_ids, crop_ids

    if role == "farmer":
        farm_ids = [
            farm_id
            for (farm_id,) in db.session.query(Farm.id)
            .filter(Farm.owner_id == user_id)
            .all()
        ]

        if not farm_ids:
            return [], []

        crop_ids = [
            crop_id
            for (crop_id,) in db.session.query(Crop.id)
            .filter(Crop.farm_id.in_(farm_ids))
            .all()
        ]

        return farm_ids, crop_ids

    return [], []


def calculate_crop_health(latest_records):
    """
    Calculates the percentage of monitored crops that are healthy.

    Critical:
        - disease detected
        - crop temperature above threshold
        - plant condition is Critical

    Needs Attention:
        - soil moisture below threshold
        - pest detected
        - discoloration detected
        - plant condition is Needs Attention

    Healthy:
        - none of the above conditions
    """

    if not latest_records:
        return 0

    healthy_count = 0

    for record in latest_records:

        if record.plant_condition == "Critical":
            continue

        if record.disease_detected:
            continue

        if (
            record.crop_temperature is not None
            and record.crop_temperature > HIGH_TEMP_THRESHOLD
        ):
            continue

        if record.plant_condition == "Needs Attention":
            continue

        if (
            record.soil_moisture is not None
            and record.soil_moisture < SOIL_MOISTURE_THRESHOLD
        ):
            continue

        if record.pest_detected:
            continue

        if record.discoloration_detected:
            continue

        healthy_count += 1

    return round((healthy_count / len(latest_records)) * 100, 2)


@reports_bp.get("/summary")
@jwt_required()
def get_report_summary():
    """
    GET /api/reports/summary

    Accessible by:
        admin
        farmer
        viewer
    """

    claims = get_jwt()
    role = claims.get("role")

    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({
            "status": "error",
            "message": "Invalid user identity."
        }), 401

    allowed_roles = {"admin", "farmer", "viewer"}

    if role not in allowed_roles:
        return jsonify({
            "status": "error",
            "message": "You do not have permission to access reports."
        }), 403

    try:
        farm_ids, crop_ids = get_scoped_ids(role, user_id)

        # ---------------------------------------------------------
        # Farms
        # ---------------------------------------------------------

        if farm_ids:
            farm_count = (
                db.session.query(func.count(Farm.id))
                .filter(Farm.id.in_(farm_ids))
                .scalar()
            ) or 0
        else:
            farm_count = 0

        # ---------------------------------------------------------
        # Crops
        # ---------------------------------------------------------

        if crop_ids:
            crop_count = (
                db.session.query(func.count(Crop.id))
                .filter(Crop.id.in_(crop_ids))
                .scalar()
            ) or 0
        else:
            crop_count = 0

        # ---------------------------------------------------------
        # Monitoring records
        # ---------------------------------------------------------

        if crop_ids:
            monitoring_records = (
                MonitoringRecord.query
                .filter(MonitoringRecord.crop_id.in_(crop_ids))
                .order_by(
                    MonitoringRecord.recorded_at.desc(),
                    MonitoringRecord.id.desc()
                )
                .all()
            )
        else:
            monitoring_records = []

        # ---------------------------------------------------------
        # Alerts
        # ---------------------------------------------------------

        if crop_ids:
            alerts = (
                Alert.query
                .filter(Alert.crop_id.in_(crop_ids))
                .order_by(
                    Alert.created_at.desc(),
                    Alert.id.desc()
                )
                .all()
            )
        else:
            alerts = []

        # ---------------------------------------------------------
        # Latest monitoring record per crop
        # ---------------------------------------------------------

        latest_by_crop = {}

        for record in monitoring_records:
            if record.crop_id not in latest_by_crop:
                latest_by_crop[record.crop_id] = record

        latest_records = list(latest_by_crop.values())

        # ---------------------------------------------------------
        # Monitoring statistics
        # ---------------------------------------------------------

        crops_with_monitoring = len(latest_records)

        healthy_crops = 0
        needs_attention_crops = 0
        critical_crops = 0

        for record in latest_records:

            if record.plant_condition == "Critical":
                critical_crops += 1
                continue

            if record.disease_detected:
                critical_crops += 1
                continue

            if (
                record.crop_temperature is not None
                and record.crop_temperature > HIGH_TEMP_THRESHOLD
            ):
                critical_crops += 1
                continue

            if record.plant_condition == "Needs Attention":
                needs_attention_crops += 1
                continue

            if (
                record.soil_moisture is not None
                and record.soil_moisture < SOIL_MOISTURE_THRESHOLD
            ):
                needs_attention_crops += 1
                continue

            if record.pest_detected:
                needs_attention_crops += 1
                continue

            if record.discoloration_detected:
                needs_attention_crops += 1
                continue

            healthy_crops += 1

        crop_health_percentage = calculate_crop_health(
            latest_records
        )

        # ---------------------------------------------------------
        # Sensor/environment statistics
        # ---------------------------------------------------------

        moisture_values = [
            record.soil_moisture
            for record in monitoring_records
            if record.soil_moisture is not None
        ]

        temperature_values = [
            record.crop_temperature
            for record in monitoring_records
            if record.crop_temperature is not None
        ]

        average_moisture = (
            round(sum(moisture_values) / len(moisture_values), 2)
            if moisture_values
            else None
        )

        average_temperature = (
            round(
                sum(temperature_values)
                / len(temperature_values),
                2
            )
            if temperature_values
            else None
        )

        low_moisture_count = sum(
            1
            for record in monitoring_records
            if (
                record.soil_moisture is not None
                and record.soil_moisture < SOIL_MOISTURE_THRESHOLD
            )
        )

        high_temperature_count = sum(
            1
            for record in monitoring_records
            if (
                record.crop_temperature is not None
                and record.crop_temperature > HIGH_TEMP_THRESHOLD
            )
        )

        pest_count = sum(
            1
            for record in monitoring_records
            if record.pest_detected
        )

        disease_count = sum(
            1
            for record in monitoring_records
            if record.disease_detected
        )

        discoloration_count = sum(
            1
            for record in monitoring_records
            if record.discoloration_detected
        )

        # ---------------------------------------------------------
        # Alert statistics
        # ---------------------------------------------------------

        unresolved_alerts = sum(
            1
            for alert in alerts
            if not alert.is_resolved
        )

        critical_alerts = sum(
            1
            for alert in alerts
            if alert.severity.lower() == "critical"
        )

        alert_breakdown = {}

        for alert in alerts:
            alert_type = alert.alert_type

            if alert_type not in alert_breakdown:
                alert_breakdown[alert_type] = 0

            alert_breakdown[alert_type] += 1

        alert_breakdown_list = [
            {
                "alert_type": alert_type,
                "count": count
            }
            for alert_type, count
            in sorted(
                alert_breakdown.items(),
                key=lambda item: item[1],
                reverse=True
            )
        ]

        # ---------------------------------------------------------
        # Recent monitoring
        # ---------------------------------------------------------

        recent_records = monitoring_records[:20]

        recent_monitoring = []

        for record in recent_records:

            crop = Crop.query.get(record.crop_id)

            farm_name = None
            crop_name = None

            if crop:
                crop_name = crop.crop_name

                farm = Farm.query.get(crop.farm_id)

                if farm:
                    farm_name = farm.farm_name

            recent_monitoring.append({
                "id": record.id,
                "crop_id": record.crop_id,
                "crop_name": crop_name,
                "farm_name": farm_name,
                "soil_moisture": record.soil_moisture,
                "crop_temperature": record.crop_temperature,
                "pest_detected": record.pest_detected,
                "disease_detected": record.disease_detected,
                "discoloration_detected": (
                    record.discoloration_detected
                ),
                "plant_condition": record.plant_condition,
                "recorded_at": (
                    record.recorded_at.isoformat()
                    if record.recorded_at
                    else None
                )
            })

        # ---------------------------------------------------------
        # Recent alerts
        # ---------------------------------------------------------

        recent_alerts = []

        for alert in alerts[:20]:

            crop = Crop.query.get(alert.crop_id)

            crop_name = crop.crop_name if crop else None

            farm_name = None

            if crop:
                farm = Farm.query.get(crop.farm_id)

                if farm:
                    farm_name = farm.farm_name

            recent_alerts.append({
                "id": alert.id,
                "crop_id": alert.crop_id,
                "monitoring_id": alert.monitoring_id,
                "crop_name": crop_name,
                "farm_name": farm_name,
                "alert_type": alert.alert_type,
                "severity": alert.severity,
                "message": alert.message,
                "is_read": alert.is_read,
                "is_resolved": alert.is_resolved,
                "created_at": (
                    alert.created_at.isoformat()
                    if alert.created_at
                    else None
                ),
                "resolved_at": (
                    alert.resolved_at.isoformat()
                    if alert.resolved_at
                    else None
                )
            })

        # ---------------------------------------------------------
        # Response
        # ---------------------------------------------------------

        return jsonify({
            "status": "success",
            "generated_at": datetime.utcnow().isoformat(),

            "summary": {
                "farms": farm_count,
                "crops": crop_count,
                "crops_with_monitoring": crops_with_monitoring,

                "healthy_crops": healthy_crops,
                "needs_attention_crops": (
                    needs_attention_crops
                ),
                "critical_crops": critical_crops,

                "crop_health_percentage": (
                    crop_health_percentage
                ),

                "monitoring_records": len(
                    monitoring_records
                ),

                "alerts": len(alerts),
                "unresolved_alerts": unresolved_alerts,
                "critical_alerts": critical_alerts,

                "low_moisture_count": low_moisture_count,
                "high_temperature_count": (
                    high_temperature_count
                ),
                "pest_count": pest_count,
                "disease_count": disease_count,
                "discoloration_count": (
                    discoloration_count
                ),

                "average_moisture": average_moisture,
                "average_temperature": average_temperature
            },

            "alert_breakdown": alert_breakdown_list,

            "recent_monitoring": recent_monitoring,

            "recent_alerts": recent_alerts
        }), 200

    except Exception as e:
        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": "Failed to generate report summary.",
            "error": str(e)
        }), 500