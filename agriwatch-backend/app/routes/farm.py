from flask import Blueprint, jsonify, request

from flask_jwt_extended import (
    get_jwt,
    get_jwt_identity,
    jwt_required
)

from app.extensions import db
from app.models.farm import Farm


farm_bp = Blueprint(
    "farm",
    __name__
)


# =====================================================
# HELPER FUNCTIONS
# =====================================================

def get_current_user_id():

    return int(
        get_jwt_identity()
    )


def get_current_role():

    claims = get_jwt()

    return claims.get("role")


# =====================================================
# GET FARMS
# =====================================================

@farm_bp.get("")
@jwt_required()
def get_farms():

    current_user_id = (
        get_current_user_id()
    )

    current_role = (
        get_current_role()
    )


    # ---------------------------------------------
    # ADMIN
    # ---------------------------------------------

    if current_role == "admin":

        farms = (
            Farm.query
            .order_by(
                Farm.created_at.desc()
            )
            .all()
        )


    # ---------------------------------------------
    # FARMER / VIEWER
    # ---------------------------------------------

    else:

        farms = (
            Farm.query
            .filter_by(
                owner_id=current_user_id
            )
            .order_by(
                Farm.created_at.desc()
            )
            .all()
        )


    return jsonify({
        "status": "success",
        "farms": [
            farm.to_dict()
            for farm in farms
        ]
    }), 200


# =====================================================
# GET SINGLE FARM
# =====================================================

@farm_bp.get("/<int:farm_id>")
@jwt_required()
def get_farm(farm_id):

    current_user_id = (
        get_current_user_id()
    )

    current_role = (
        get_current_role()
    )


    farm = db.session.get(
        Farm,
        farm_id
    )


    if not farm:

        return jsonify({
            "status": "error",
            "message": "Farm not found."
        }), 404


    # ---------------------------------------------
    # ACCESS CONTROL
    # ---------------------------------------------

    if (
        current_role != "admin"
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


# =====================================================
# CREATE FARM
# =====================================================

@farm_bp.post("")
@jwt_required()
def create_farm():

    current_user_id = (
        get_current_user_id()
    )

    data = (
        request.get_json()
        or {}
    )


    # ---------------------------------------------
    # GET DATA
    # ---------------------------------------------

    farm_name = (
        data.get("farm_name")
        or ""
    ).strip()

    location = (
        data.get("location")
        or ""
    ).strip()

    area = data.get("area")

    description = (
        data.get("description")
        or ""
    ).strip()


    # ---------------------------------------------
    # VALIDATION
    # ---------------------------------------------

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


    # ---------------------------------------------
    # AREA VALIDATION
    # ---------------------------------------------

    if area is not None:

        try:

            area = float(area)

        except (
            TypeError,
            ValueError
        ):

            return jsonify({
                "status": "error",
                "message": "Area must be a valid number."
            }), 400


        if area < 0:

            return jsonify({
                "status": "error",
                "message": "Area cannot be negative."
            }), 400


    # ---------------------------------------------
    # CREATE FARM
    # ---------------------------------------------

    farm = Farm(
        farm_name=farm_name,
        location=location,
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


# =====================================================
# UPDATE FARM
# =====================================================

@farm_bp.put("/<int:farm_id>")
@jwt_required()
def update_farm(farm_id):

    current_user_id = (
        get_current_user_id()
    )

    current_role = (
        get_current_role()
    )


    farm = db.session.get(
        Farm,
        farm_id
    )


    if not farm:

        return jsonify({
            "status": "error",
            "message": "Farm not found."
        }), 404


    # ---------------------------------------------
    # ACCESS CONTROL
    # ---------------------------------------------

    if (
        current_role != "admin"
        and farm.owner_id != current_user_id
    ):

        return jsonify({
            "status": "error",
            "message": "You do not have permission to update this farm."
        }), 403


    data = (
        request.get_json()
        or {}
    )


    # ---------------------------------------------
    # FARM NAME
    # ---------------------------------------------

    if "farm_name" in data:

        farm_name = (
            data.get("farm_name")
            or ""
        ).strip()

        if not farm_name:

            return jsonify({
                "status": "error",
                "message": "Farm name cannot be empty."
            }), 400

        farm.farm_name = farm_name


    # ---------------------------------------------
    # LOCATION
    # ---------------------------------------------

    if "location" in data:

        location = (
            data.get("location")
            or ""
        ).strip()

        if not location:

            return jsonify({
                "status": "error",
                "message": "Farm location cannot be empty."
            }), 400

        farm.location = location


    # ---------------------------------------------
    # AREA
    # ---------------------------------------------

    if "area" in data:

        area = data.get("area")

        if area is None:

            farm.area = None

        else:

            try:

                area = float(area)

            except (
                TypeError,
                ValueError
            ):

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


    # ---------------------------------------------
    # DESCRIPTION
    # ---------------------------------------------

    if "description" in data:

        description = (
            data.get("description")
            or ""
        ).strip()

        farm.description = (
            description or None
        )


    db.session.commit()


    return jsonify({
        "status": "success",
        "message": "Farm updated successfully.",
        "farm": farm.to_dict()
    }), 200


# =====================================================
# DELETE FARM
# =====================================================

@farm_bp.delete("/<int:farm_id>")
@jwt_required()
def delete_farm(farm_id):

    current_user_id = (
        get_current_user_id()
    )

    current_role = (
        get_current_role()
    )


    farm = db.session.get(
        Farm,
        farm_id
    )


    if not farm:

        return jsonify({
            "status": "error",
            "message": "Farm not found."
        }), 404


    # ---------------------------------------------
    # ACCESS CONTROL
    # ---------------------------------------------

    if (
        current_role != "admin"
        and farm.owner_id != current_user_id
    ):

        return jsonify({
            "status": "error",
            "message": "You do not have permission to delete this farm."
        }), 403


    db.session.delete(farm)

    db.session.commit()


    return jsonify({
        "status": "success",
        "message": "Farm deleted successfully."
    }), 200