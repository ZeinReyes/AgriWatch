from flask import Blueprint, jsonify, request

from flask_jwt_extended import (
    get_jwt,
    get_jwt_identity,
    jwt_required
)

from app.extensions import db
from app.models.farm import Farm
from app.models.crop import Crop


farm_bp = Blueprint(
    "farm",
    __name__
)


def get_current_user_id():
    return int(get_jwt_identity())


def get_current_role():
    return get_jwt().get("role")


def validate_coordinates(latitude, longitude):
    if latitude is None and longitude is None:
        return None, None, None

    if latitude is None or longitude is None:
        return None, None, "Both latitude and longitude are required."

    try:
        latitude = float(latitude)
        longitude = float(longitude)
    except (TypeError, ValueError):
        return None, None, "Latitude and longitude must be valid numbers."

    if latitude < -90 or latitude > 90:
        return None, None, "Latitude must be between -90 and 90."

    if longitude < -180 or longitude > 180:
        return None, None, "Longitude must be between -180 and 180."

    return latitude, longitude, None


@farm_bp.get("")
@jwt_required()
def get_farms():
    current_user_id = get_current_user_id()
    current_role = get_current_role()

    if current_role in {"admin", "viewer"}:
        farms = (
            Farm.query
            .order_by(Farm.created_at.desc())
            .all()
        )
    else:
        farms = (
            Farm.query
            .filter_by(owner_id=current_user_id)
            .order_by(Farm.created_at.desc())
            .all()
        )

    return jsonify({
        "status": "success",
        "farms": [farm.to_dict() for farm in farms]
    }), 200


@farm_bp.get("/<int:farm_id>")
@jwt_required()
def get_farm(farm_id):
    current_user_id = get_current_user_id()
    current_role = get_current_role()

    farm = db.session.get(Farm, farm_id)

    if not farm:
        return jsonify({
            "status": "error",
            "message": "Farm not found."
        }), 404

    if (
        current_role not in {"admin", "viewer"}
        and farm.owner_id != current_user_id
    ):
        return jsonify({
            "status": "error",
            "message": "You do not have access to this farm."
        }), 403

    return jsonify({
        "status": "success",
        "farm": farm.to_dict()
    }), 200


@farm_bp.post("")
@jwt_required()
def create_farm():
    current_user_id = get_current_user_id()
    current_role = get_current_role()

    if current_role == "viewer":
        return jsonify({
            "status": "error",
            "message": "Viewers cannot create farms."
        }), 403

    data = request.get_json() or {}

    farm_name = (data.get("farm_name") or "").strip()
    location = (data.get("location") or "").strip()
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    area = data.get("area")
    description = (data.get("description") or "").strip()

    if not farm_name:
        return jsonify({
            "status": "error",
            "message": "Farm name is required."
        }), 400

    if not location:
        return jsonify({
            "status": "error",
            "message": "Farm location is required."
        }), 400

    latitude, longitude, coordinate_error = validate_coordinates(
        latitude, longitude
    )

    if coordinate_error:
        return jsonify({
            "status": "error",
            "message": coordinate_error
        }), 400

    if area is not None:
        try:
            area = float(area)
        except (TypeError, ValueError):
            return jsonify({
                "status": "error",
                "message": "Area must be a valid number."
            }), 400

        if area < 0:
            return jsonify({
                "status": "error",
                "message": "Area cannot be negative."
            }), 400

    farm = Farm(
        farm_name=farm_name,
        location=location,
        latitude=latitude,
        longitude=longitude,
        area=area,
        description=description or None,
        owner_id=current_user_id
    )

    db.session.add(farm)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Farm created successfully.",
        "farm": farm.to_dict()
    }), 201


@farm_bp.put("/<int:farm_id>")
@jwt_required()
def update_farm(farm_id):
    current_user_id = get_current_user_id()
    current_role = get_current_role()

    if current_role == "viewer":
        return jsonify({
            "status": "error",
            "message": "Viewers cannot update farms."
        }), 403

    farm = db.session.get(Farm, farm_id)

    if not farm:
        return jsonify({
            "status": "error",
            "message": "Farm not found."
        }), 404

    if current_role != "admin" and farm.owner_id != current_user_id:
        return jsonify({
            "status": "error",
            "message": "You do not have permission to update this farm."
        }), 403

    data = request.get_json() or {}

    if "farm_name" in data:
        farm_name = (data.get("farm_name") or "").strip()
        if not farm_name:
            return jsonify({
                "status": "error",
                "message": "Farm name cannot be empty."
            }), 400
        farm.farm_name = farm_name

    if "location" in data:
        location = (data.get("location") or "").strip()
        if not location:
            return jsonify({
                "status": "error",
                "message": "Farm location cannot be empty."
            }), 400
        farm.location = location

    if "latitude" in data or "longitude" in data:
        latitude = data.get("latitude", farm.latitude)
        longitude = data.get("longitude", farm.longitude)

        latitude, longitude, coordinate_error = validate_coordinates(
            latitude, longitude
        )

        if coordinate_error:
            return jsonify({
                "status": "error",
                "message": coordinate_error
            }), 400

        farm.latitude = latitude
        farm.longitude = longitude

    if "area" in data:
        area = data.get("area")
        if area is None:
            farm.area = None
        else:
            try:
                area = float(area)
            except (TypeError, ValueError):
                return jsonify({
                    "status": "error",
                    "message": "Area must be a valid number."
                }), 400

            if area < 0:
                return jsonify({
                    "status": "error",
                    "message": "Area cannot be negative."
                }), 400

            farm.area = area

    if "description" in data:
        description = (data.get("description") or "").strip()
        farm.description = description or None

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Farm updated successfully.",
        "farm": farm.to_dict()
    }), 200


@farm_bp.delete("/<int:farm_id>")
@jwt_required()
def delete_farm(farm_id):
    current_user_id = get_current_user_id()
    current_role = get_current_role()

    if current_role == "viewer":
        return jsonify({
            "status": "error",
            "message": "Viewers cannot delete farms."
        }), 403

    farm = db.session.get(Farm, farm_id)

    if not farm:
        return jsonify({
            "status": "error",
            "message": "Farm not found."
        }), 404

    if current_role != "admin" and farm.owner_id != current_user_id:
        return jsonify({
            "status": "error",
            "message": "You do not have permission to delete this farm."
        }), 403

    try:
        crops = Crop.query.filter_by(farm_id=farm.id).all()
        for crop in crops:
            db.session.delete(crop)

        db.session.delete(farm)
        db.session.commit()

    except Exception as error:
        db.session.rollback()
        print("Farm deletion error:", error)
        return jsonify({
            "status": "error",
            "message": "Unable to delete farm. Please try again."
        }), 500

    return jsonify({
        "status": "success",
        "message": "Farm deleted successfully."
    }), 200
