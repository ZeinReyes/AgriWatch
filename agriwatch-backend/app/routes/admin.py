from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    get_jwt,
    get_jwt_identity,
    jwt_required,
)

from app.extensions import db
from app.models.user import User


admin_bp = Blueprint(
    "admin",
    __name__,
)


def admin_required():
    claims = get_jwt()

    return claims.get("role") == "admin"


# =========================================================
# GET ALL USERS
# =========================================================

@admin_bp.get("/users")
@jwt_required()
def get_users():

    if not admin_required():
        return jsonify({
            "status": "error",
            "message": "Administrator access required."
        }), 403

    users = (
        User.query
        .order_by(User.created_at.desc())
        .all()
    )

    return jsonify({
        "status": "success",
        "users": [
            user.to_dict()
            for user in users
        ]
    }), 200


# =========================================================
# GET SINGLE USER
# =========================================================

@admin_bp.get("/users/<int:user_id>")
@jwt_required()
def get_user(user_id):

    if not admin_required():
        return jsonify({
            "status": "error",
            "message": "Administrator access required."
        }), 403

    user = db.session.get(
        User,
        user_id
    )

    if not user:
        return jsonify({
            "status": "error",
            "message": "User not found."
        }), 404

    return jsonify({
        "status": "success",
        "user": user.to_dict()
    }), 200


# =========================================================
# CHANGE USER ROLE
# =========================================================

@admin_bp.patch("/users/<int:user_id>/role")
@jwt_required()
def update_user_role(user_id):

    if not admin_required():
        return jsonify({
            "status": "error",
            "message": "Administrator access required."
        }), 403

    current_admin_id = int(
        get_jwt_identity()
    )

    user = db.session.get(
        User,
        user_id
    )

    if not user:
        return jsonify({
            "status": "error",
            "message": "User not found."
        }), 404

    # Prevent an administrator from
    # changing their own role.
    if user.id == current_admin_id:
        return jsonify({
            "status": "error",
            "message": "You cannot change your own administrator role."
        }), 400

    data = request.get_json() or {}

    new_role = data.get("role")

    allowed_roles = {
        "farmer",
        "viewer",
    }

    if new_role not in allowed_roles:
        return jsonify({
            "status": "error",
            "message": "Invalid role. Choose farmer or viewer."
        }), 400

    user.role = new_role

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "User role updated successfully.",
        "user": user.to_dict()
    }), 200


# =========================================================
# CHANGE USER STATUS
# =========================================================

@admin_bp.patch("/users/<int:user_id>/status")
@jwt_required()
def update_user_status(user_id):

    if not admin_required():
        return jsonify({
            "status": "error",
            "message": "Administrator access required."
        }), 403

    current_admin_id = int(
        get_jwt_identity()
    )

    user = db.session.get(
        User,
        user_id
    )

    if not user:
        return jsonify({
            "status": "error",
            "message": "User not found."
        }), 404

    # Prevent an administrator from
    # deactivating themselves.
    if user.id == current_admin_id:
        return jsonify({
            "status": "error",
            "message": "You cannot deactivate your own account."
        }), 400

    data = request.get_json() or {}

    is_active = data.get(
        "is_active"
    )

    if not isinstance(
        is_active,
        bool
    ):
        return jsonify({
            "status": "error",
            "message": "is_active must be true or false."
        }), 400

    user.is_active = is_active

    db.session.commit()

    return jsonify({
        "status": "success",
        "message": (
            "User activated successfully."
            if is_active
            else "User deactivated successfully."
        ),
        "user": user.to_dict()
    }), 200