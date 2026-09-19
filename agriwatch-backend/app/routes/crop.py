from datetime import date

from flask import Blueprint, jsonify, request

from flask_jwt_extended import (
    get_jwt,
    get_jwt_identity,
    jwt_required
)

from app.extensions import db
from app.models.crop import Crop
from app.models.farm import Farm


crop_bp = Blueprint("crop", __name__)


def get_current_user_id():
    return int(get_jwt_identity())


def get_current_role():
    return get_jwt().get("role")


def user_can_manage_crop(crop, user_id, role):
    return role == "admin" or (
        role == "farmer"
        and crop
        and crop.farm
        and crop.farm.owner_id == user_id
    )


@crop_bp.get("")
@jwt_required()
def get_crops():
    current_user_id = get_current_user_id()
    current_role = get_current_role()

    if current_role in {"admin", "viewer"}:
        crops = (
            Crop.query
            .join(Farm)
            .order_by(Crop.created_at.desc())
            .all()
        )
    else:
        crops = (
            Crop.query
            .join(Farm)
            .filter(Farm.owner_id == current_user_id)
            .order_by(Crop.created_at.desc())
            .all()
        )

    return jsonify({
        "status": "success",
        "crops": [crop.to_dict() for crop in crops]
    }), 200


@crop_bp.get("/<int:crop_id>")
@jwt_required()
def get_crop(crop_id):
    current_user_id = get_current_user_id()
    current_role = get_current_role()

    crop = db.session.get(Crop, crop_id)

    if not crop:
        return jsonify({
            "status": "error",
            "message": "Crop not found."
        }), 404

    if (
        current_role not in {"admin", "viewer"}
        and (not crop.farm or crop.farm.owner_id != current_user_id)
    ):
        return jsonify({
            "status": "error",
            "message": "You do not have access to this crop."
        }), 403

    return jsonify({
        "status": "success",
        "crop": crop.to_dict()
    }), 200


@crop_bp.post("")
@jwt_required()
def create_crop():
    current_user_id = get_current_user_id()
    current_role = get_current_role()

    if current_role == "viewer":
        return jsonify({
            "status": "error",
            "message": "Viewers cannot create crops."
        }), 403

    data = request.get_json() or {}

    crop_name = (data.get("crop_name") or "").strip()
    variety = (data.get("variety") or "").strip()
    planting_date = (data.get("planting_date") or "").strip()
    expected_harvest_date = (data.get("expected_harvest_date") or "").strip()
    growth_stage = (data.get("growth_stage") or "Seedling").strip()
    status = (data.get("status") or "Healthy").strip()
    farm_id = data.get("farm_id")

    if not crop_name:
        return jsonify({"status": "error", "message": "Crop name is required."}), 400

    if not planting_date:
        return jsonify({"status": "error", "message": "Planting date is required."}), 400

    if farm_id is None:
        return jsonify({"status": "error", "message": "Farm is required."}), 400

    try:
        farm_id = int(farm_id)
    except (TypeError, ValueError):
        return jsonify({"status": "error", "message": "Invalid farm ID."}), 400

    farm = db.session.get(Farm, farm_id)

    if not farm:
        return jsonify({"status": "error", "message": "Farm not found."}), 404

    if current_role != "admin" and farm.owner_id != current_user_id:
        return jsonify({
            "status": "error",
            "message": "You can only add crops to your own farm."
        }), 403

    try:
        planting_date_value = date.fromisoformat(planting_date)
    except ValueError:
        return jsonify({"status": "error", "message": "Invalid planting date."}), 400

    expected_harvest_date_value = None
    if expected_harvest_date:
        try:
            expected_harvest_date_value = date.fromisoformat(expected_harvest_date)
        except ValueError:
            return jsonify({
                "status": "error",
                "message": "Invalid expected harvest date."
            }), 400

    if (
        expected_harvest_date_value
        and expected_harvest_date_value < planting_date_value
    ):
        return jsonify({
            "status": "error",
            "message": "Expected harvest date cannot be before planting date."
        }), 400

    allowed_growth_stages = {
        "Seedling", "Vegetative", "Flowering",
        "Fruit Development", "Maturity", "Harvested"
    }
    allowed_statuses = {
        "Healthy", "Needs Attention", "Critical", "Harvested"
    }

    if growth_stage not in allowed_growth_stages:
        return jsonify({"status": "error", "message": "Invalid growth stage."}), 400

    if status not in allowed_statuses:
        return jsonify({"status": "error", "message": "Invalid crop status."}), 400

    crop = Crop(
        crop_name=crop_name,
        variety=variety or None,
        planting_date=planting_date_value,
        expected_harvest_date=expected_harvest_date_value,
        growth_stage=growth_stage,
        status=status,
        farm_id=farm_id
    )

    db.session.add(crop)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Crop created successfully.",
        "crop": crop.to_dict()
    }), 201


@crop_bp.put("/<int:crop_id>")
@jwt_required()
def update_crop(crop_id):
    current_user_id = get_current_user_id()
    current_role = get_current_role()

    if current_role == "viewer":
        return jsonify({
            "status": "error",
            "message": "Viewers cannot update crops."
        }), 403

    crop = db.session.get(Crop, crop_id)

    if not crop:
        return jsonify({"status": "error", "message": "Crop not found."}), 404

    if not user_can_manage_crop(crop, current_user_id, current_role):
        return jsonify({
            "status": "error",
            "message": "You do not have permission to update this crop."
        }), 403

    data = request.get_json() or {}

    crop_name = data.get("crop_name")
    variety = data.get("variety")
    planting_date = data.get("planting_date")
    expected_harvest_date = data.get("expected_harvest_date")
    growth_stage = data.get("growth_stage")
    status = data.get("status")
    farm_id = data.get("farm_id")

    if crop_name is not None:
        crop_name = crop_name.strip()
        if not crop_name:
            return jsonify({"status": "error", "message": "Crop name cannot be empty."}), 400
        crop.crop_name = crop_name

    if variety is not None:
        variety = variety.strip()
        crop.variety = variety or None

    if planting_date is not None:
        try:
            crop.planting_date = date.fromisoformat(planting_date)
        except ValueError:
            return jsonify({"status": "error", "message": "Invalid planting date."}), 400

    if expected_harvest_date is not None:
        if expected_harvest_date == "":
            crop.expected_harvest_date = None
        else:
            try:
                crop.expected_harvest_date = date.fromisoformat(expected_harvest_date)
            except ValueError:
                return jsonify({
                    "status": "error",
                    "message": "Invalid expected harvest date."
                }), 400

    if (
        crop.expected_harvest_date
        and crop.planting_date
        and crop.expected_harvest_date < crop.planting_date
    ):
        return jsonify({
            "status": "error",
            "message": "Expected harvest date cannot be earlier than planting date."
        }), 400

    allowed_growth_stages = {
        "Seedling", "Vegetative", "Flowering",
        "Fruit Development", "Maturity", "Harvested"
    }
    if growth_stage is not None:
        if growth_stage not in allowed_growth_stages:
            return jsonify({"status": "error", "message": "Invalid growth stage."}), 400
        crop.growth_stage = growth_stage

    allowed_statuses = {
        "Healthy", "Needs Attention", "Critical", "Harvested"
    }
    if status is not None:
        if status not in allowed_statuses:
            return jsonify({"status": "error", "message": "Invalid crop status."}), 400
        crop.status = status

    if farm_id is not None:
        try:
            farm_id = int(farm_id)
        except (TypeError, ValueError):
            return jsonify({"status": "error", "message": "Invalid farm ID."}), 400

        new_farm = db.session.get(Farm, farm_id)
        if not new_farm:
            return jsonify({
                "status": "error",
                "message": "Selected farm not found."
            }), 404

        if current_role != "admin" and new_farm.owner_id != current_user_id:
            return jsonify({
                "status": "error",
                "message": "You can only move crops to your own farms."
            }), 403

        crop.farm_id = new_farm.id

    try:
        db.session.commit()
    except Exception as error:
        db.session.rollback()
        print("Crop update error:", error)
        return jsonify({"status": "error", "message": "Unable to update crop."}), 500

    return jsonify({
        "status": "success",
        "message": "Crop updated successfully.",
        "crop": crop.to_dict()
    }), 200


@crop_bp.delete("/<int:crop_id>")
@jwt_required()
def delete_crop(crop_id):
    current_user_id = get_current_user_id()
    current_role = get_current_role()

    if current_role == "viewer":
        return jsonify({
            "status": "error",
            "message": "Viewers cannot delete crops."
        }), 403

    crop = db.session.get(Crop, crop_id)

    if not crop:
        return jsonify({"status": "error", "message": "Crop not found."}), 404

    if not user_can_manage_crop(crop, current_user_id, current_role):
        return jsonify({
            "status": "error",
            "message": "You do not have permission to delete this crop."
        }), 403

    db.session.delete(crop)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Crop deleted successfully."
    }), 200
