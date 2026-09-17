from datetime import datetime

from app.extensions import db


class Crop(db.Model):

    __tablename__ = "crops"

    # =================================================
    # PRIMARY KEY
    # =================================================

    id = db.Column(
        db.Integer,
        primary_key=True
    )


    # =================================================
    # CROP INFORMATION
    # =================================================

    crop_name = db.Column(
        db.String(150),
        nullable=False
    )

    variety = db.Column(
        db.String(100),
        nullable=True
    )

    planting_date = db.Column(
        db.Date,
        nullable=False
    )

    expected_harvest_date = db.Column(
        db.Date,
        nullable=True
    )

    growth_stage = db.Column(
        db.String(50),
        nullable=False,
        default="Seedling"
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="Healthy"
    )


    # =================================================
    # FARM RELATIONSHIP
    # =================================================

    farm_id = db.Column(
        db.Integer,
        db.ForeignKey("farms.id"),
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

    farm = db.relationship(
        "Farm",
        backref=db.backref(
            "crops",
            lazy=True
        )
    )

    monitoring_records = db.relationship(
        "MonitoringRecord",
        back_populates="crop",
        cascade="all, delete-orphan"
    )

    alerts = db.relationship(
        "Alert",
        back_populates="crop",
        cascade="all, delete-orphan"
    )


    # =================================================
    # SERIALIZATION
    # =================================================

    def to_dict(self):

        return {
            "id": self.id,
            "crop_name": self.crop_name,
            "variety": self.variety,
            "planting_date": (
                self.planting_date.isoformat()
                if self.planting_date
                else None
            ),
            "expected_harvest_date": (
                self.expected_harvest_date.isoformat()
                if self.expected_harvest_date
                else None
            ),
            "growth_stage": self.growth_stage,
            "status": self.status,
            "farm_id": self.farm_id,
            "farm_name": (
                self.farm.farm_name
                if self.farm
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