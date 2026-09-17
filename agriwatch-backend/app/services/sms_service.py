"""SIM800A gateway SMS service for AgriWatch.

The Flask backend runs on the cloud and does not have direct serial access
to the SIM800A. This service sends the SMS request to the Raspberry Pi
gateway, which is responsible for communicating with the physical SIM800A.
"""

import os
import requests


def _get_config(
    name,
    required=True,
    default=None
):
    """Read a setting from Flask config or environment variables."""

    try:
        from flask import current_app

        value = current_app.config.get(
            name
        )
    except RuntimeError:
        value = None

    if not value:
        value = os.getenv(
            name,
            default
        )

    if required and not value:
        raise RuntimeError(
            f"{name} is not configured."
        )

    return value


def normalize_phone_number(phone_number):
    """
    Normalize a Philippine mobile number to +639XXXXXXXXX.

    Accepted formats:
        09XXXXXXXXX
        9XXXXXXXXX
        63XXXXXXXXXX
        +63XXXXXXXXXX

    Returned format:
        +639XXXXXXXXX
    """

    if phone_number is None:
        raise ValueError(
            "Recipient phone number is required."
        )

    number = str(
        phone_number
    ).strip()

    if not number:
        raise ValueError(
            "Recipient phone number cannot be empty."
        )

    number = (
        number
        .replace(" ", "")
        .replace("-", "")
        .replace("(", "")
        .replace(")", "")
    )

    if number.startswith("09"):
        number = "+63" + number[1:]

    elif number.startswith("9") and len(number) == 10:
        number = "+63" + number

    elif number.startswith("63"):
        number = "+" + number

    elif number.startswith("+63"):
        pass

    else:
        raise ValueError(
            "Invalid Philippine mobile number. "
            "Use 09XXXXXXXXX or +639XXXXXXXXX."
        )

    import re

    if not re.fullmatch(
        r"\+639\d{9}",
        number
    ):
        raise ValueError(
            "Invalid Philippine mobile number. "
            "Use 09XXXXXXXXX or +639XXXXXXXXX."
        )

    return number


def send_sms(
    recipient,
    message
):
    """Send one SMS request to the Raspberry Pi SIM800A gateway."""

    if not message or not str(message).strip():
        raise ValueError(
            "SMS message cannot be empty."
        )

    recipient = normalize_phone_number(
        recipient
    )

    gateway_url = _get_config(
        "SIM800A_GATEWAY_URL"
    )

    gateway_token = _get_config(
        "SIM800A_GATEWAY_TOKEN",
        required=False
    )

    payload = {
        "recipient": recipient,
        "message": str(
            message
        ).strip()
    }

    headers = {
        "accept": "application/json",
        "content-type": "application/json",
    }

    if gateway_token:
        headers["Authorization"] = (
            f"Bearer {str(gateway_token).strip()}"
        )

    try:
        response = requests.post(
            str(gateway_url).rstrip("/"),
            headers=headers,
            json=payload,
            timeout=20,
        )
    except requests.RequestException as error:
        raise RuntimeError(
            "Unable to connect to the SIM800A gateway: "
            f"{error}"
        ) from error

    try:
        response_data = response.json()
    except ValueError:
        response_data = response.text

    if not response.ok:
        raise RuntimeError(
            "SIM800A gateway error "
            f"(HTTP {response.status_code}): "
            f"{response_data}"
        )

    if isinstance(response_data, dict):
        if response_data.get("success") is False:
            raise RuntimeError(
                "SIM800A gateway rejected the SMS: "
                f"{response_data}"
            )

        return {
            "success": True,
            "recipient": recipient,
            "message_id": response_data.get(
                "message_id"
            ) or response_data.get(
                "messageId"
            ),
            "status": response_data.get(
                "status",
                "accepted"
            ),
            "response": response_data,
        }

    return {
        "success": True,
        "recipient": recipient,
        "message_id": None,
        "status": "accepted",
        "response": response_data,
    }


def _short_alert_message(alert):
    """Create a compact SMS line for a single AgriWatch alert."""

    alert_type = str(
        getattr(
            alert,
            "alert_type",
            "Alert"
        )
    ).strip()

    severity = str(
        getattr(
            alert,
            "severity",
            "Warning"
        )
    ).strip()

    message = str(
        getattr(
            alert,
            "message",
            ""
        )
    ).strip()

    if alert_type == "Low Soil Moisture":
        return (
            f"Low soil moisture "
            f"({severity}): {message}"
        )

    if alert_type == "High Crop Temperature":
        return (
            f"High crop temperature "
            f"({severity}): {message}"
        )

    if alert_type == "Pest Detection":
        return (
            f"Pest detected "
            f"({severity})."
        )

    if alert_type == "Disease Detection":
        return (
            f"Disease detected "
            f"({severity})."
        )

    if alert_type == "Crop Discoloration":
        return (
            f"Discoloration detected "
            f"({severity})."
        )

    return (
        f"{alert_type} "
        f"({severity}): {message}"
    )


def build_alert_sms(
    farm_name,
    crop_name,
    alerts,
):
    """Build one consolidated AgriWatch alert SMS."""

    lines = [
        "AgriWatch Alert",
        (
            f"Farm: "
            f"{str(farm_name or 'Unknown Farm').strip()}"
        ),
        (
            f"Crop: "
            f"{str(crop_name or 'Unknown Crop').strip()}"
        ),
    ]

    for alert in alerts or []:
        lines.append(
            _short_alert_message(
                alert
            )
        )

    lines.append(
        "Check the AgriWatch dashboard."
    )

    return "\n".join(
        lines
    )


def send_alert_sms(
    recipient,
    farm_name,
    crop_name,
    alerts,
):
    """Build and send a consolidated AgriWatch alert SMS."""

    message = build_alert_sms(
        farm_name=farm_name,
        crop_name=crop_name,
        alerts=alerts,
    )

    return send_sms(
        recipient=recipient,
        message=message,
    )
