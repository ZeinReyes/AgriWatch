from datetime import datetime

from app.extensions import db


class Alert(db.Model):
    __tablename__ = "alerts"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    crop_id = db.Column(
        db.Integer,
        db.ForeignKey("crops.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    monitoring_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "monitoring_records.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    alert_type = db.Column(
        db.String(50),
        nullable=False
    )

    severity = db.Column(
        db.String(20),
        nullable=False
    )

    message = db.Column(
        db.String(255),
        nullable=False
    )

    is_read = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )

    is_resolved = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    resolved_at = db.Column(
        db.DateTime,
        nullable=True
    )

    crop = db.relationship(
        "Crop",
        back_populates="alerts"
    )

    monitoring = db.relationship(
        "MonitoringRecord",
        back_populates="alerts"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "crop_id": self.crop_id,
            "monitoring_id": self.monitoring_id,
            "alert_type": self.alert_type,
            "severity": self.severity,
            "message": self.message,
            "is_read": self.is_read,
            "is_resolved": self.is_resolved,
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
            "resolved_at": (
                self.resolved_at.isoformat()
                if self.resolved_at
                else None
            )
        }