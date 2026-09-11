from datetime import datetime

from app.extensions import db


class MonitoringRecord(db.Model):
    __tablename__ = "monitoring_records"

    id = db.Column(db.Integer, primary_key=True)

    crop_id = db.Column(
        db.Integer,
        db.ForeignKey("crops.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    soil_moisture = db.Column(db.Float, nullable=True)

    crop_temperature = db.Column(db.Float, nullable=True)

    pest_detected = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )

    disease_detected = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )

    discoloration_detected = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )

    plant_condition = db.Column(
        db.String(50),
        nullable=False,
        default="Healthy"
    )

    recorded_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    crop = db.relationship(
        "Crop",
        back_populates="monitoring_records"
    )

    alerts = db.relationship(
        "Alert",
        back_populates="monitoring",
        cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "crop_id": self.crop_id,
            "soil_moisture": self.soil_moisture,
            "crop_temperature": self.crop_temperature,
            "pest_detected": self.pest_detected,
            "disease_detected": self.disease_detected,
            "discoloration_detected": self.discoloration_detected,
            "plant_condition": self.plant_condition,
            "recorded_at": (
                self.recorded_at.isoformat()
                if self.recorded_at
                else None
            )
        }