import secrets

from datetime import (
    datetime,
    timedelta
)

from app.extensions import bcrypt


# ==========================================
# Generate OTP
# ==========================================

def generate_otp():

    return str(
        secrets.randbelow(900000) + 100000
    )


# ==========================================
# Hash OTP
# ==========================================

def hash_otp(otp):

    return (
        bcrypt
        .generate_password_hash(otp)
        .decode("utf-8")
    )


# ==========================================
# Verify OTP
# ==========================================

def verify_otp(
    otp,
    otp_hash
):

    return bcrypt.check_password_hash(
        otp_hash,
        otp
    )


# ==========================================
# OTP Expiration
# ==========================================

def get_otp_expiration(
    minutes=5
):

    return (
        datetime.utcnow()
        + timedelta(minutes=minutes)
    )