from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from app.extensions import db
from app.models.crop import Crop
from app.models.farm import Farm
from app.models.monitoring import MonitoringRecord


monitoring_bp = Blueprint(
    "monitoring",
    __name__
)


def get_current_user_id():
    return int(get_jwt_identity())


def get_current_role():
    return get_jwt().get("role")


def user_can_access_crop(crop, user_id, role):
    if role == "admin":
        return True

    return crop.farm.owner_id == user_id


# =========================================================
# GET ALL MONITORING RECORDS
# =========================================================

@monitoring_bp.get("/", strict_slashes=False)
@jwt_required()
def get_monitoring_records():

    user_id = get_current_user_id()
    role = get_current_role()

    query = MonitoringRecord.query.join(Crop).join(Farm)

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

@monitoring_bp.get("/crop/<int:crop_id>")
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
                "You do not have permission to view "
                "this crop's monitoring records."
            )
        }), 403

    records = (
        MonitoringRecord.query
        .filter_by(crop_id=crop_id)
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

@monitoring_bp.get("/<int:monitoring_id>")
@jwt_required()
def get_monitoring_record(monitoring_id):

    user_id = get_current_user_id()
    role = get_current_role()

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
        record.crop,
        user_id,
        role
    ):
        return jsonify({
            "status": "error",
            "message": (
                "You do not have permission to view "
                "this monitoring record."
            )
        }), 403

    return jsonify({
        "status": "success",
        "monitoring": record.to_dict()
    }), 200


# =========================================================
# CREATE MONITORING RECORD
# =========================================================

@monitoring_bp.post("/", strict_slashes=False)
@jwt_required()
def create_monitoring_record():

    user_id = get_current_user_id()
    role = get_current_role()

    data = request.get_json() or {}

    crop_id = data.get("crop_id")

    if crop_id is None:
        return jsonify({
            "status": "error",
            "message": "crop_id is required."
        }), 400

    try:
        crop_id = int(crop_id)

    except (TypeError, ValueError):
        return jsonify({
            "status": "error",
            "message": "crop_id must be a valid integer."
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

    # -----------------------------------------------------
    # Validate numeric values
    # -----------------------------------------------------

    soil_moisture = data.get(
        "soil_moisture"
    )

    crop_temperature = data.get(
        "crop_temperature"
    )

    if soil_moisture is not None:

        try:
            soil_moisture = float(
                soil_moisture
            )

        except (TypeError, ValueError):

            return jsonify({
                "status": "error",
                "message": (
                    "soil_moisture must be "
                    "a valid number."
                )
            }), 400

        if soil_moisture < 0 or soil_moisture > 100:

            return jsonify({
                "status": "error",
                "message": (
                    "soil_moisture must be "
                    "between 0 and 100."
                )
            }), 400

    if crop_temperature is not None:

        try:
            crop_temperature = float(
                crop_temperature
            )

        except (TypeError, ValueError):

            return jsonify({
                "status": "error",
                "message": (
                    "crop_temperature must be "
                    "a valid number."
                )
            }), 400

    # -----------------------------------------------------
    # Boolean values
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # Plant condition
    # -----------------------------------------------------

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
                + ", ".join(allowed_conditions)
            )
        }), 400

    # -----------------------------------------------------
    # Create monitoring record
    # -----------------------------------------------------

    record = MonitoringRecord(
        crop_id=crop_id,
        soil_moisture=soil_moisture,
        crop_temperature=crop_temperature,
        pest_detected=pest_detected,
        disease_detected=disease_detected,
        discoloration_detected=discoloration_detected,
        plant_condition=plant_condition
    )

    db.session.add(record)

    try:

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

    return jsonify({
        "status": "success",
        "message": (
            "Monitoring record created successfully."
        ),
        "monitoring": record.to_dict()
    }), 201


# =========================================================
# DELETE MONITORING RECORD
# =========================================================

@monitoring_bp.delete("/<int:monitoring_id>")
@jwt_required()
def delete_monitoring_record(monitoring_id):

    user_id = get_current_user_id()
    role = get_current_role()

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

    db.session.delete(record)

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