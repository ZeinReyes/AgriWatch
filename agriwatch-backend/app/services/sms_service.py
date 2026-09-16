"""Infobip SMS service for AgriWatch."""

import requests
from flask import current_app


DEFAULT_BASE_URL = "https://api.infobip.com"
SMS_PATH = "/sms/3/messages"


def _get_config(name, required=True, default=None):
    """Read an Infobip setting from the Flask application config."""

    value = current_app.config.get(name, default)

    if required and not value:
        raise RuntimeError(
            f"{name} is not configured."
        )

    return value


def normalize_phone_number(phone_number):
    """
    Normalize a Philippine mobile number into E.164 digits.

    Accepted common formats:
        09XXXXXXXXX
        9XXXXXXXXX
        +639XXXXXXXXX
        639XXXXXXXXX

    Returned format:
        639XXXXXXXXX
    """

    if phone_number is None:
        raise ValueError(
            "Recipient phone number is required."
        )

    number = str(phone_number).strip()

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

    if number.startswith("+63"):
        number = number[1:]

    elif number.startswith("09"):
        number = "63" + number[1:]

    elif number.startswith("9") and len(number) == 10:
        number = "63" + number

    if len(number) != 12 or not number.startswith("639"):
        raise ValueError(
            "Invalid Philippine mobile number. "
            "Use 09XXXXXXXXX, 9XXXXXXXXX, or 639XXXXXXXXX."
        )

    return number


def _build_url():
    """Build the current Infobip SMS API URL."""

    base_url = _get_config(
        "INFOBIP_BASE_URL",
        required=False,
        default=DEFAULT_BASE_URL,
    )

    return f"{str(base_url).rstrip('/')}{SMS_PATH}"


def send_sms(recipient, message):
    """
    Send an SMS through Infobip SMS API v3.

    Required API key scope:
        sms:message:send
    """

    if not message or not str(message).strip():
        raise ValueError(
            "SMS message cannot be empty."
        )

    recipient = normalize_phone_number(recipient)

    api_key = _get_config("INFOBIP_API_KEY")
    sender = _get_config("INFOBIP_SENDER")
    url = _build_url()

    payload = {
        "messages": [
            {
                "sender": str(sender).strip(),
                "destinations": [
                    {
                        "to": recipient
                    }
                ],
                "content": {
                    "text": str(message).strip()
                }
            }
        ]
    }

    headers = {
        "Authorization": f"App {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    try:
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=15,
        )

    except requests.RequestException as error:
        raise RuntimeError(
            f"Unable to connect to Infobip: {error}"
        ) from error

    try:
        response_data = response.json()

    except ValueError:
        response_data = response.text

    if not response.ok:
        raise RuntimeError(
            f"Infobip API error "
            f"(HTTP {response.status_code}): "
            f"{response_data}"
        )

    messages = (
        response_data.get("messages", [])
        if isinstance(response_data, dict)
        else []
    )

    first = (
        messages[0]
        if messages
        else {}
    )

    status = (
        first.get("status", {})
        if isinstance(first, dict)
        else {}
    )

    if isinstance(status, dict):
        status_name = status.get("name")
        status_description = status.get(
            "description"
        )
    else:
        status_name = status
        status_description = None

    # Infobip may return HTTP 200 for an accepted request
    # while the message has a status indicating an error.
    if (
        isinstance(status_name, str)
        and status_name.lower() in {
            "rejected",
            "failed",
            "error",
        }
    ):
        raise RuntimeError(
            "Infobip rejected the SMS: "
            f"{status_description or status_name}"
        )

    return {
        "success": True,
        "recipient": recipient,
        "message_id": first.get("messageId")
        if isinstance(first, dict)
        else None,
        "status": status_name,
        "status_description": status_description,
        "response": response_data,
    }


def _short_alert_message(alert):
    """Create a compact SMS line for a single AgriWatch alert."""

    alert_type = str(
        getattr(alert, "alert_type", "Alert")
    ).strip()

    severity = str(
        getattr(alert, "severity", "Warning")
    ).strip()

    message = str(
        getattr(alert, "message", "")
    ).strip()

    if alert_type == "Low Soil Moisture":
        return f"Low soil moisture ({severity}): {message}"

    if alert_type == "High Crop Temperature":
        return f"High crop temperature ({severity}): {message}"

    if alert_type == "Pest Detection":
        return f"Pest detected ({severity})."

    if alert_type == "Disease Detection":
        return f"Disease detected ({severity})."

    if alert_type == "Crop Discoloration":
        return f"Discoloration detected ({severity})."

    return f"{alert_type} ({severity}): {message}"


def build_alert_sms(
    farm_name,
    crop_name,
    alerts,
):
    """Build one consolidated AgriWatch SMS."""

    lines = [
        "AgriWatch Alert",
        f"Farm: {str(farm_name or 'Unknown Farm').strip()}",
        f"Crop: {str(crop_name or 'Unknown Crop').strip()}",
    ]

    for alert in alerts or []:
        lines.append(
            _short_alert_message(alert)
        )

    lines.append(
        "Check the AgriWatch dashboard."
    )

    return "\n".join(lines)


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
