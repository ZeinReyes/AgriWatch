from datetime import datetime

from app.extensions import db


class Farm(db.Model):

    __tablename__ = "farms"

    # =================================================
    # PRIMARY KEY
    # =================================================

    id = db.Column(
        db.Integer,
        primary_key=True
    )


    # =================================================
    # FARM INFORMATION
    # =================================================

    farm_name = db.Column(
        db.String(150),
        nullable=False
    )

    location = db.Column(
        db.String(255),
        nullable=False
    )

    area = db.Column(
        db.Float,
        nullable=True
    )

    description = db.Column(
        db.Text,
        nullable=True
    )


    # =================================================
    # FARM OWNER
    # =================================================

    owner_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True
    )


    # =================================================
    # TIMESTAMPS
    # =================================================

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )


    # =================================================
    # RELATIONSHIP
    # =================================================

    owner = db.relationship(
        "User",
        backref=db.backref(
            "farms",
            lazy=True
        )
    )


    # =================================================
    # SERIALIZATION
    # =================================================

    def to_dict(self):

        return {
            "id": self.id,
            "farm_name": self.farm_name,
            "location": self.location,
            "area": self.area,
            "description": self.description,
            "owner_id": self.owner_id,
            "owner_name": (
                self.owner.full_name
                if self.owner
                else None
            ),
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at
                else None
            )
        }