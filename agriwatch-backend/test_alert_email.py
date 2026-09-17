from app import create_app
from app.services.email_service import send_alert_email


app = create_app()


with app.app_context():

    recipient = app.config["MAIL_USERNAME"]

    send_alert_email(
        recipient=recipient,
        alert_type="High Crop Temperature",
        severity="Critical",
        message=(
            "Crop temperature is 36.0°C, "
            "which is above the 35°C threshold."
        ),
        crop_name="Tomato Crop",
        crop_id=3
    )

    print()
    print("=" * 50)
    print("AGRIWATCH EMAIL TEST")
    print("=" * 50)
    print()
    print(f"Email sent successfully to: {recipient}")
    print()
    print("=" * 50)