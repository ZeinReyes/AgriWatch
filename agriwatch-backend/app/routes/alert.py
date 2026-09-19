from datetime import datetime

from flask import Blueprint, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity,
    get_jwt
)

from app.extensions import db
from app.models.alert import Alert
from app.models.crop import Crop
from app.models.farm import Farm


alert_bp = Blueprint("alert", __name__)


def get_current_user_id():
    return int(get_jwt_identity())


def get_current_role():
    return get_jwt().get("role")


def user_can_access_crop(crop, user_id, role):
    if role in {"admin", "viewer"}:
        return True
    return bool(
        crop
        and crop.farm
        and role == "farmer"
        and crop.farm.owner_id == user_id
    )


def require_alert_mutation_access():
    return get_current_role() != "viewer"


@alert_bp.get("/", strict_slashes=False)
@jwt_required()
def get_alerts():
    user_id = get_current_user_id()
    role = get_current_role()

    query = Alert.query.join(Crop).join(Farm)

    if role not in {"admin", "viewer"}:
        query = query.filter(Farm.owner_id == user_id)

    alerts = query.order_by(Alert.created_at.desc()).all()

    return jsonify({
        "status": "success",
        "alerts": [alert.to_dict() for alert in alerts]
    }), 200


@alert_bp.get("/crop/<int:crop_id>")
@jwt_required()
def get_crop_alerts(crop_id):
    user_id = get_current_user_id()
    role = get_current_role()

    crop = db.session.get(Crop, crop_id)

    if not crop:
        return jsonify({
            "status": "error",
            "message": "Crop not found."
        }), 404

    if not user_can_access_crop(crop, user_id, role):
        return jsonify({
            "status": "error",
            "message": "You do not have permission to view this crop's alerts."
        }), 403

    alerts = (
        Alert.query
        .filter_by(crop_id=crop_id)
        .order_by(Alert.created_at.desc())
        .all()
    )

    return jsonify({
        "status": "success",
        "crop_id": crop_id,
        "alerts": [alert.to_dict() for alert in alerts]
    }), 200


@alert_bp.get("/<int:alert_id>")
@jwt_required()
def get_alert(alert_id):
    user_id = get_current_user_id()
    role = get_current_role()

    alert = db.session.get(Alert, alert_id)

    if not alert:
        return jsonify({
            "status": "error",
            "message": "Alert not found."
        }), 404

    if not user_can_access_crop(alert.crop, user_id, role):
        return jsonify({
            "status": "error",
            "message": "You do not have permission to view this alert."
        }), 403

    return jsonify({
        "status": "success",
        "alert": alert.to_dict()
    }), 200


@alert_bp.patch("/<int:alert_id>/read")
@jwt_required()
def mark_alert_as_read(alert_id):
    user_id = get_current_user_id()
    role = get_current_role()

    if not require_alert_mutation_access():
        return jsonify({
            "status": "error",
            "message": "Viewers cannot modify alerts."
        }), 403

    alert = db.session.get(Alert, alert_id)

    if not alert:
        return jsonify({
            "status": "error",
            "message": "Alert not found."
        }), 404

    if not user_can_access_crop(alert.crop, user_id, role):
        return jsonify({
            "status": "error",
            "message": "You do not have permission to update this alert."
        }), 403

    alert.is_read = True
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Alert marked as read.",
        "alert": alert.to_dict()
    }), 200


@alert_bp.patch("/<int:alert_id>/resolve")
@jwt_required()
def resolve_alert(alert_id):
    user_id = get_current_user_id()
    role = get_current_role()

    if not require_alert_mutation_access():
        return jsonify({
            "status": "error",
            "message": "Viewers cannot modify alerts."
        }), 403

    alert = db.session.get(Alert, alert_id)

    if not alert:
        return jsonify({
            "status": "error",
            "message": "Alert not found."
        }), 404

    if not user_can_access_crop(alert.crop, user_id, role):
        return jsonify({
            "status": "error",
            "message": "You do not have permission to update this alert."
        }), 403

    alert.is_resolved = True
    alert.is_read = True
    alert.resolved_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Alert resolved successfully.",
        "alert": alert.to_dict()
    }), 200
