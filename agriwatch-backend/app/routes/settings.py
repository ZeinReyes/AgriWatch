import re

from flask import Blueprint, jsonify, request
from flask_bcrypt import check_password_hash, generate_password_hash
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.user import User


settings_bp = Blueprint(
    "settings",
    __name__
)


def get_current_user():
    try:
        user_id = int(
            get_jwt_identity()
        )
    except (TypeError, ValueError):
        return None

    return db.session.get(
        User,
        user_id
    )


def normalize_phone_number(phone_number):
    """
    Normalize a Philippine mobile number to +639XXXXXXXXX.

    Accepted formats:
        09XXXXXXXXX
        9XXXXXXXXX
        63XXXXXXXXXX
        +63XXXXXXXXXX

    Returns:
        None when no number is supplied.
        +639XXXXXXXXX when supplied.
    """

    if phone_number is None:
        return None

    number = str(
        phone_number
    ).strip()

    if not number:
        return None

    number = (
        number
        .replace(" ", "")
        .replace("-", "")
        .replace("(", "")
        .replace(")", "")
    )

    if number.startswith("09"):
        number = "+63" + number[1:]

    elif number.startswith("9") and len(number) == 10:
        number = "+63" + number

    elif number.startswith("63"):
        number = "+" + number

    elif number.startswith("+63"):
        pass

    else:
        raise ValueError(
            "Invalid Philippine mobile number. "
            "Use 09XXXXXXXXX or +639XXXXXXXXX."
        )

    if not re.fullmatch(
        r"\+639\d{9}",
        number
    ):
        raise ValueError(
            "Invalid Philippine mobile number. "
            "Use 09XXXXXXXXX or +639XXXXXXXXX."
        )

    return number


# =========================================================
# GET SETTINGS
# =========================================================

@settings_bp.get("")
@jwt_required()
def get_settings():

    user = get_current_user()

    if not user:
        return jsonify({
            "status": "error",
            "message": "User not found."
        }), 404

    return jsonify({
        "status": "success",
        "settings": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone_number": user.phone_number,
            "role": user.role,
            "is_verified": user.is_verified,
            "is_active": user.is_active,
            "created_at": (
                user.created_at.isoformat()
                if user.created_at
                else None
            ),
            "updated_at": (
                user.updated_at.isoformat()
                if user.updated_at
                else None
            ),
        }
    }), 200


# =========================================================
# UPDATE PROFILE
# =========================================================

@settings_bp.patch("/profile")
@jwt_required()
def update_profile():

    user = get_current_user()

    if not user:
        return jsonify({
            "status": "error",
            "message": "User not found."
        }), 404

    data = request.get_json(
        silent=True
    ) or {}

    full_name = str(
        data.get("full_name", "")
    ).strip()

    if not full_name:
        return jsonify({
            "status": "error",
            "message": "Full name is required."
        }), 400

    if len(full_name) < 2:
        return jsonify({
            "status": "error",
            "message": "Full name must contain at least 2 characters."
        }), 400

    if len(full_name) > 150:
        return jsonify({
            "status": "error",
            "message": "Full name must not exceed 150 characters."
        }), 400

    phone_number = user.phone_number

    if "phone_number" in data:
        try:
            phone_number = normalize_phone_number(
                data.get("phone_number")
            )
        except ValueError as error:
            return jsonify({
                "status": "error",
                "message": str(error)
            }), 400

    try:

        user.full_name = full_name
        user.phone_number = phone_number

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Profile updated successfully.",
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "phone_number": user.phone_number,
                "role": user.role,
            }
        }), 200

    except Exception as e:

        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": "Failed to update profile.",
            "error": str(e)
        }), 500


# =========================================================
# CHANGE PASSWORD
# =========================================================

@settings_bp.post("/password")
@jwt_required()
def change_password():

    user = get_current_user()

    if not user:
        return jsonify({
            "status": "error",
            "message": "User not found."
        }), 404

    data = request.get_json(
        silent=True
    ) or {}

    current_password = str(
        data.get("current_password", "")
    )

    new_password = str(
        data.get("new_password", "")
    )

    confirm_password = str(
        data.get("confirm_password", "")
    )

    if not current_password:
        return jsonify({
            "status": "error",
            "message": "Current password is required."
        }), 400

    if not new_password:
        return jsonify({
            "status": "error",
            "message": "New password is required."
        }), 400

    if len(new_password) < 8:
        return jsonify({
            "status": "error",
            "message": "New password must be at least 8 characters."
        }), 400

    if new_password != confirm_password:
        return jsonify({
            "status": "error",
            "message": "New passwords do not match."
        }), 400

    if not check_password_hash(
        user.password_hash,
        current_password
    ):
        return jsonify({
            "status": "error",
            "message": "Current password is incorrect."
        }), 400

    try:

        user.password_hash = (
            generate_password_hash(
                new_password
            ).decode("utf-8")
        )

        db.session.commit()

        return jsonify({
            "status": "success",
            "message": "Password changed successfully."
        }), 200

    except Exception as e:

        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": "Failed to change password.",
            "error": str(e)
        }), 500
