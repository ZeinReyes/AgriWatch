from datetime import datetime

from app.extensions import (
    db,
    bcrypt
)


class User(db.Model):

    __tablename__ = "users"

    # ==========================================
    # Primary Key
    # ==========================================

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    # ==========================================
    # User Information
    # ==========================================

    full_name = db.Column(
        db.String(150),
        nullable=False
    )

    email = db.Column(
        db.String(255),
        unique=True,
        nullable=False,
        index=True
    )

    # ==========================================
    # Authentication
    # ==========================================

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    # ==========================================
    # Role
    # ==========================================

    role = db.Column(
        db.String(30),
        nullable=False,
        default="farmer"
    )

    # ==========================================
    # Account Status
    # ==========================================

    is_verified = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )

    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True
    )

    # ==========================================
    # Timestamps
    # ==========================================

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # ==========================================
    # Password Hashing
    # ==========================================

    def set_password(self, password):

        self.password_hash = (
            bcrypt
            .generate_password_hash(password)
            .decode("utf-8")
        )

    # ==========================================
    # Password Verification
    # ==========================================

    def check_password(self, password):

        return bcrypt.check_password_hash(
            self.password_hash,
            password
        )

    # ==========================================
    # JSON Representation
    # ==========================================

    def to_dict(self):

        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role,
            "is_verified": self.is_verified,
            "is_active": self.is_active,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            )
        }