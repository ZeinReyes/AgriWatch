from functools import wraps

from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt


def role_required(*allowed_roles):
    """
    Restrict an API endpoint to specific user roles.

    Example:

        @role_required("admin")

    Multiple roles:

        @role_required("farmer", "admin", "viewer")
    """

    def decorator(fn):

        @wraps(fn)
        def wrapper(*args, **kwargs):

            # Make sure the request has a valid JWT
            verify_jwt_in_request()

            # Get claims from the JWT
            claims = get_jwt()

            # Get the user's role
            user_role = claims.get("role")

            # Check permission
            if user_role not in allowed_roles:

                return jsonify({
                    "success": False,
                    "message": (
                        "You do not have permission "
                        "to access this resource."
                    )
                }), 403

            return fn(*args, **kwargs)

        return wrapper

    return decorator