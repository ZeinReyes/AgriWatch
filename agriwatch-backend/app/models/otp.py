from datetime import datetime

from app.extensions import db


class OTP(db.Model):

    __tablename__ = "otps"

    # ==========================================
    # Primary Key
    # ==========================================

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    # ==========================================
    # Email
    # ==========================================

    email = db.Column(
        db.String(255),
        nullable=False,
        index=True
    )

    # ==========================================
    # OTP
    # ==========================================

    otp_hash = db.Column(
        db.String(255),
        nullable=False
    )

    # ==========================================
    # Purpose
    # ==========================================

    purpose = db.Column(
        db.String(50),
        nullable=False
    )

    # Possible values:
    #
    # signup_verification
    # password_reset

    # ==========================================
    # Expiration
    # ==========================================

    expires_at = db.Column(
        db.DateTime,
        nullable=False
    )

    # ==========================================
    # Security
    # ==========================================

    attempts = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    is_used = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )

    # ==========================================
    # Timestamp
    # ==========================================

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )