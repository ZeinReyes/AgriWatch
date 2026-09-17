from datetime import datetime

from flask import (
    Blueprint,
    request
)

from flask_jwt_extended import (
    create_access_token
)

from app.extensions import db

from app.models.user import User
from app.models.otp import OTP

from app.utils.otp import (
    generate_otp,
    hash_otp,
    verify_otp,
    get_otp_expiration
)

from app.services.email_service import (
    send_verification_otp,
    send_password_reset_otp
)


auth_bp = Blueprint(
    "auth",
    __name__
)


# =====================================================
# REGISTER
# =====================================================

@auth_bp.post("/register")
def register():

    data = request.get_json() or {}

    full_name = data.get(
        "full_name",
        ""
    ).strip()

    email = data.get(
        "email",
        ""
    ).strip().lower()

    password = data.get(
        "password",
        ""
    )

    # -----------------------------------------
    # Validation
    # -----------------------------------------

    if not full_name:

        return {
            "success": False,
            "message": "Full name is required."
        }, 400

    if not email:

        return {
            "success": False,
            "message": "Email is required."
        }, 400

    if len(password) < 8:

        return {
            "success": False,
            "message":
                "Password must be at least 8 characters."
        }, 400

    # -----------------------------------------
    # Check existing account
    # -----------------------------------------

    existing_user = User.query.filter_by(
        email=email
    ).first()

    if existing_user:

        if existing_user.is_verified:

            return {
                "success": False,
                "message":
                    "An account with this email already exists."
            }, 409

        # Account exists but isn't verified.
        # Update the information and resend OTP.

        user = existing_user

        user.full_name = full_name

        user.set_password(
            password
        )

    else:

        user = User(
            full_name=full_name,
            email=email,
            role="farmer",
            is_verified=False,
            is_active=True
        )

        user.set_password(
            password
        )

        db.session.add(user)

    # -----------------------------------------
    # Remove previous signup OTP
    # -----------------------------------------

    OTP.query.filter_by(
        email=email,
        purpose="signup_verification",
        is_used=False
    ).delete()

    # -----------------------------------------
    # Generate OTP
    # -----------------------------------------

    otp = generate_otp()

    otp_record = OTP(
        email=email,
        otp_hash=hash_otp(otp),
        purpose="signup_verification",
        expires_at=get_otp_expiration(5),
        attempts=0,
        is_used=False
    )

    db.session.add(
        otp_record
    )

    db.session.commit()

    # -----------------------------------------
    # Send Email
    # -----------------------------------------

    try:

        send_verification_otp(
            email,
            otp
        )

    except Exception as error:

        print(
            "Email error:",
            error
        )

        return {
            "success": False,
            "message":
                "Unable to send verification email."
        }, 500

    return {
        "success": True,
        "message":
            "Account created. Please verify your email.",
        "email": email
    }, 201


# =====================================================
# VERIFY EMAIL
# =====================================================

@auth_bp.post("/verify-email")
def verify_email():

    data = request.get_json() or {}

    email = data.get(
        "email",
        ""
    ).strip().lower()

    otp_value = data.get(
        "otp",
        ""
    ).strip()

    if not email or not otp_value:

        return {
            "success": False,
            "message":
                "Email and OTP are required."
        }, 400

    # -----------------------------------------
    # Find latest OTP
    # -----------------------------------------

    otp_record = OTP.query.filter_by(
        email=email,
        purpose="signup_verification",
        is_used=False
    ).order_by(
        OTP.created_at.desc()
    ).first()

    if not otp_record:

        return {
            "success": False,
            "message":
                "No valid verification OTP found."
        }, 400

    # -----------------------------------------
    # Expiration
    # -----------------------------------------

    if datetime.utcnow() > otp_record.expires_at:

        return {
            "success": False,
            "message":
                "OTP has expired."
        }, 400

    # -----------------------------------------
    # Attempts
    # -----------------------------------------

    if otp_record.attempts >= 5:

        return {
            "success": False,
            "message":
                "Too many incorrect attempts."
        }, 429

    # -----------------------------------------
    # Verify OTP
    # -----------------------------------------

    if not verify_otp(
        otp_value,
        otp_record.otp_hash
    ):

        otp_record.attempts += 1

        db.session.commit()

        return {
            "success": False,
            "message":
                "Incorrect OTP."
        }, 400

    # -----------------------------------------
    # Find User
    # -----------------------------------------

    user = User.query.filter_by(
        email=email
    ).first()

    if not user:

        return {
            "success": False,
            "message":
                "User account not found."
        }, 404

    # -----------------------------------------
    # Verify Account
    # -----------------------------------------

    user.is_verified = True

    otp_record.is_used = True

    db.session.commit()

    return {
        "success": True,
        "message":
            "Email verified successfully."
    }


# =====================================================
# RESEND VERIFICATION OTP
# =====================================================

@auth_bp.post("/resend-verification")
def resend_verification():

    data = request.get_json() or {}

    email = data.get(
        "email",
        ""
    ).strip().lower()

    if not email:

        return {
            "success": False,
            "message":
                "Email is required."
        }, 400

    user = User.query.filter_by(
        email=email
    ).first()

    if not user:

        return {
            "success": False,
            "message":
                "Unable to process verification request."
        }, 400

    if user.is_verified:

        return {
            "success": False,
            "message":
                "Email is already verified."
        }, 400

    # -----------------------------------------
    # Remove previous OTPs
    # -----------------------------------------

    OTP.query.filter_by(
        email=email,
        purpose="signup_verification",
        is_used=False
    ).delete()

    # -----------------------------------------
    # Generate new OTP
    # -----------------------------------------

    otp = generate_otp()

    otp_record = OTP(
        email=email,
        otp_hash=hash_otp(otp),
        purpose="signup_verification",
        expires_at=get_otp_expiration(5),
        attempts=0,
        is_used=False
    )

    db.session.add(
        otp_record
    )

    db.session.commit()

    # -----------------------------------------
    # Send email
    # -----------------------------------------

    try:

        send_verification_otp(
            email,
            otp
        )

    except Exception as error:

        print(
            "Email error:",
            error
        )

        return {
            "success": False,
            "message":
                "Unable to send OTP."
        }, 500

    return {
        "success": True,
        "message":
            "A new verification OTP has been sent."
    }


# =====================================================
# LOGIN
# =====================================================

@auth_bp.post("/login")
def login():

    data = request.get_json() or {}

    email = data.get(
        "email",
        ""
    ).strip().lower()

    password = data.get(
        "password",
        ""
    )

    # -----------------------------------------
    # Find user
    # -----------------------------------------

    user = User.query.filter_by(
        email=email
    ).first()

    if not user:

        return {
            "success": False,
            "message":
                "Invalid email or password."
        }, 401

    # -----------------------------------------
    # Password
    # -----------------------------------------

    if not user.check_password(
        password
    ):

        return {
            "success": False,
            "message":
                "Invalid email or password."
        }, 401

    # -----------------------------------------
    # Email Verification
    # -----------------------------------------

    if not user.is_verified:

        return {
            "success": False,
            "message":
                "Please verify your email before signing in.",
            "requires_verification": True
        }, 403

    # -----------------------------------------
    # Account Status
    # -----------------------------------------

    if not user.is_active:

        return {
            "success": False,
            "message":
                "This account has been deactivated."
        }, 403

    # -----------------------------------------
    # Create JWT
    # -----------------------------------------

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": user.role
        }
    )

    return {
        "success": True,
        "message":
            "Login successful.",
        "access_token":
            access_token,
        "user":
            user.to_dict()
    }


# =====================================================
# FORGOT PASSWORD
# =====================================================

@auth_bp.post("/forgot-password")
def forgot_password():

    data = request.get_json() or {}

    email = data.get(
        "email",
        ""
    ).strip().lower()

    if not email:

        return {
            "success": False,
            "message":
                "Email is required."
        }, 400

    user = User.query.filter_by(
        email=email
    ).first()

    # -----------------------------------------
    # Generic response
    # -----------------------------------------
    #
    # This prevents revealing whether
    # an email exists in the database.

    if not user:

        return {
            "success": True,
            "message":
                "If the account exists, a reset OTP has been sent."
        }

    if not user.is_active:

        return {
            "success": True,
            "message":
                "If the account exists, a reset OTP has been sent."
        }

    # -----------------------------------------
    # Remove old reset OTPs
    # -----------------------------------------

    OTP.query.filter_by(
        email=email,
        purpose="password_reset",
        is_used=False
    ).delete()

    # -----------------------------------------
    # Generate OTP
    # -----------------------------------------

    otp = generate_otp()

    otp_record = OTP(
        email=email,
        otp_hash=hash_otp(otp),
        purpose="password_reset",
        expires_at=get_otp_expiration(5),
        attempts=0,
        is_used=False
    )

    db.session.add(
        otp_record
    )

    db.session.commit()

    # -----------------------------------------
    # Send email
    # -----------------------------------------

    try:

        send_password_reset_otp(
            email,
            otp
        )

    except Exception as error:

        print(
            "Password reset email error:",
            error
        )

        return {
            "success": False,
            "message":
                "Unable to send reset email."
        }, 500

    return {
        "success": True,
        "message":
            "If the account exists, a reset OTP has been sent."
    }


# =====================================================
# VERIFY RESET OTP
# =====================================================

@auth_bp.post("/verify-reset-otp")
def verify_reset_otp():

    data = request.get_json() or {}

    email = data.get(
        "email",
        ""
    ).strip().lower()

    otp_value = data.get(
        "otp",
        ""
    ).strip()

    if not email or not otp_value:

        return {
            "success": False,
            "message":
                "Email and OTP are required."
        }, 400

    otp_record = OTP.query.filter_by(
        email=email,
        purpose="password_reset",
        is_used=False
    ).order_by(
        OTP.created_at.desc()
    ).first()

    if not otp_record:

        return {
            "success": False,
            "message":
                "Invalid or expired OTP."
        }, 400

    if datetime.utcnow() > otp_record.expires_at:

        return {
            "success": False,
            "message":
                "OTP has expired."
        }, 400

    if otp_record.attempts >= 5:

        return {
            "success": False,
            "message":
                "Too many incorrect attempts."
        }, 429

    if not verify_otp(
        otp_value,
        otp_record.otp_hash
    ):

        otp_record.attempts += 1

        db.session.commit()

        return {
            "success": False,
            "message":
                "Incorrect OTP."
        }, 400

    return {
        "success": True,
        "message":
            "OTP verified. You may reset your password."
    }


# =====================================================
# RESET PASSWORD
# =====================================================

@auth_bp.post("/reset-password")
def reset_password():

    data = request.get_json() or {}

    email = data.get(
        "email",
        ""
    ).strip().lower()

    otp_value = data.get(
        "otp",
        ""
    ).strip()

    new_password = data.get(
        "password",
        ""
    )

    if not email or not otp_value:

        return {
            "success": False,
            "message":
                "Email and OTP are required."
        }, 400

    if len(new_password) < 8:

        return {
            "success": False,
            "message":
                "Password must be at least 8 characters."
        }, 400

    # -----------------------------------------
    # Find OTP
    # -----------------------------------------

    otp_record = OTP.query.filter_by(
        email=email,
        purpose="password_reset",
        is_used=False
    ).order_by(
        OTP.created_at.desc()
    ).first()

    if not otp_record:

        return {
            "success": False,
            "message":
                "Invalid or expired OTP."
        }, 400

    # -----------------------------------------
    # Check expiration
    # -----------------------------------------

    if datetime.utcnow() > otp_record.expires_at:

        return {
            "success": False,
            "message":
                "OTP has expired."
        }, 400

    # -----------------------------------------
    # Check attempts
    # -----------------------------------------

    if otp_record.attempts >= 5:

        return {
            "success": False,
            "message":
                "Too many incorrect attempts."
        }, 429

    # -----------------------------------------
    # Verify OTP again
    # -----------------------------------------

    if not verify_otp(
        otp_value,
        otp_record.otp_hash
    ):

        otp_record.attempts += 1

        db.session.commit()

        return {
            "success": False,
            "message":
                "Incorrect OTP."
        }, 400

    # -----------------------------------------
    # Find user
    # -----------------------------------------

    user = User.query.filter_by(
        email=email
    ).first()

    if not user:

        return {
            "success": False,
            "message":
                "Unable to reset password."
        }, 400

    # -----------------------------------------
    # Update password
    # -----------------------------------------

    user.set_password(
        new_password
    )

    # -----------------------------------------
    # Consume OTP
    # -----------------------------------------

    otp_record.is_used = True

    db.session.commit()

    return {
        "success": True,
        "message":
            "Password reset successfully."
    }