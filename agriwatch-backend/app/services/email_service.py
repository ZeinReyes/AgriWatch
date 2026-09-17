import requests

from flask import current_app


BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


# =========================================================
# Generic Email Sender
# =========================================================

def send_email(
    recipient,
    subject,
    body,
    html_body=None
):
    """
    Send an email through the Brevo transactional
    email API.

    Uses HTTPS instead of SMTP so it works on
    Render Free web services.
    """

    api_key = current_app.config.get(
        "BREVO_API_KEY"
    )

    sender_email = current_app.config.get(
        "MAIL_FROM"
    )

    sender_name = current_app.config.get(
        "MAIL_FROM_NAME",
        "AgriWatch"
    )

    if not api_key:
        raise RuntimeError(
            "BREVO_API_KEY is not configured."
        )

    if not sender_email:
        raise RuntimeError(
            "MAIL_FROM is not configured."
        )

    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json"
    }

    payload = {
        "sender": {
            "name": sender_name,
            "email": sender_email
        },

        "to": [
            {
                "email": recipient
            }
        ],

        "subject": subject,

        "textContent": body
    }

    if html_body:
        payload["htmlContent"] = html_body

    try:

        response = requests.post(
            BREVO_API_URL,
            headers=headers,
            json=payload,
            timeout=8
        )

    except requests.RequestException as error:

        raise RuntimeError(
            f"Unable to connect to Brevo: {error}"
        ) from error

    if not response.ok:

        try:
            error_details = response.json()

        except ValueError:
            error_details = response.text

        raise RuntimeError(
            f"Brevo API error: {error_details}"
        )

    try:
        return response.json()

    except ValueError:
        return {
            "status": "sent"
        }


# =========================================================
# AgriWatch HTML Email Template
# =========================================================

def build_email_template(
    title,
    content_html
):
    return f"""
<!DOCTYPE html>

<html>

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

</head>

<body style="
    margin: 0;
    padding: 0;
    background-color: #f4f7f4;
    font-family: Arial, Helvetica, sans-serif;
">

<table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        background-color: #f4f7f4;
        padding: 35px 15px;
    "
>

<tr>

<td align="center">

<table
    width="600"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
        max-width: 600px;
        width: 100%;
        background-color: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #e1e8e3;
    "
>

<!-- =====================================================
     HEADER
===================================================== -->

<tr>

<td style="
    background-color: #2f7543;
    padding: 24px 30px;
">

    <div style="
        color: #ffffff;
        font-size: 24px;
        font-weight: bold;
    ">
        AgriWatch
    </div>

    <div style="
        margin-top: 5px;
        color: #dcebdd;
        font-size: 12px;
    ">
        Smart Tomato Crop Monitoring
        and Web-Based Alert System
    </div>

</td>

</tr>


<!-- =====================================================
     CONTENT
===================================================== -->

<tr>

<td style="
    padding: 30px;
">

    <h1 style="
        margin: 0 0 20px 0;
        color: #183b24;
        font-size: 22px;
    ">
        {title}
    </h1>

    {content_html}

</td>

</tr>


<!-- =====================================================
     FOOTER
===================================================== -->

<tr>

<td style="
    padding: 20px 30px;
    background-color: #f7f9f7;
    border-top: 1px solid #e7ece8;
">

    <p style="
        margin: 0;
        color: #7b857e;
        font-size: 11px;
        line-height: 1.5;
    ">
        This is an automated message from AgriWatch.
        Please do not reply directly to this email.
    </p>

    <p style="
        margin: 8px 0 0 0;
        color: #9aa29d;
        font-size: 11px;
    ">
        Smart Tomato Crop Monitoring
        and Web-Based Alert System
    </p>

</td>

</tr>

</table>

</td>

</tr>

</table>

</body>

</html>
"""


# =========================================================
# Email Verification OTP
# =========================================================

def send_verification_otp(
    recipient,
    otp
):

    subject = "AgriWatch - Email Verification"

    body = f"""
AgriWatch Email Verification

Hello,

Welcome to AgriWatch.

Your email verification code is:

{otp}

This code will expire in 5 minutes.

If you did not create an AgriWatch account,
you can safely ignore this email.

Regards,

AgriWatch
Smart Tomato Crop Monitoring
and Web-Based Alert System
"""

    content_html = f"""

<p style="
    color: #68736b;
    font-size: 14px;
    line-height: 1.6;
">
    Hello,
</p>

<p style="
    color: #68736b;
    font-size: 14px;
    line-height: 1.6;
">
    Welcome to AgriWatch.
    Please use the verification code below
    to verify your email address.
</p>

<div style="
    margin: 25px 0;
    padding: 20px;
    background-color: #f1f7f2;
    border: 1px solid #d8e8db;
    border-radius: 10px;
    text-align: center;
">

    <div style="
        margin-bottom: 8px;
        color: #718077;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
    ">
        Verification Code
    </div>

    <div style="
        color: #2f7543;
        font-size: 30px;
        font-weight: bold;
        letter-spacing: 7px;
    ">
        {otp}
    </div>

</div>

<p style="
    color: #68736b;
    font-size: 13px;
    line-height: 1.6;
">
    This code will expire in
    <strong>5 minutes</strong>.
</p>

<p style="
    color: #68736b;
    font-size: 13px;
    line-height: 1.6;
">
    If you did not create an AgriWatch account,
    you can safely ignore this email.
</p>

"""

    return send_email(
        recipient=recipient,
        subject=subject,
        body=body,
        html_body=build_email_template(
            "Verify Your Email",
            content_html
        )
    )


# =========================================================
# Password Reset OTP
# =========================================================

def send_password_reset_otp(
    recipient,
    otp
):

    subject = "AgriWatch - Password Reset"

    body = f"""
AgriWatch Password Reset

Hello,

We received a request to reset your
AgriWatch account password.

Your password reset code is:

{otp}

This code will expire in 5 minutes.

If you did not request a password reset,
you can safely ignore this email.

Regards,

AgriWatch
Smart Tomato Crop Monitoring
and Web-Based Alert System
"""

    content_html = f"""

<p style="
    color: #68736b;
    font-size: 14px;
    line-height: 1.6;
">
    Hello,
</p>

<p style="
    color: #68736b;
    font-size: 14px;
    line-height: 1.6;
">
    We received a request to reset your
    AgriWatch account password.
</p>

<div style="
    margin: 25px 0;
    padding: 20px;
    background-color: #f1f7f2;
    border: 1px solid #d8e8db;
    border-radius: 10px;
    text-align: center;
">

    <div style="
        margin-bottom: 8px;
        color: #718077;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
    ">
        Password Reset Code
    </div>

    <div style="
        color: #2f7543;
        font-size: 30px;
        font-weight: bold;
        letter-spacing: 7px;
    ">
        {otp}
    </div>

</div>

<p style="
    color: #68736b;
    font-size: 13px;
    line-height: 1.6;
">
    This code will expire in
    <strong>5 minutes</strong>.
</p>

<p style="
    color: #68736b;
    font-size: 13px;
    line-height: 1.6;
">
    If you did not request a password reset,
    you can safely ignore this email.
</p>

"""

    return send_email(
        recipient=recipient,
        subject=subject,
        body=body,
        html_body=build_email_template(
            "Reset Your Password",
            content_html
        )
    )


# =========================================================
# Single Alert Email
# =========================================================

def send_alert_email(
    recipient,
    alert_type,
    severity,
    message,
    crop_name=None,
    crop_id=None
):

    subject = (
        f"AgriWatch - {severity} Alert: "
        f"{alert_type}"
    )

    crop_display = (
        crop_name
        if crop_name
        else "Tomato Crop"
    )

    crop_id_display = (
        str(crop_id)
        if crop_id is not None
        else "N/A"
    )

    body = f"""
AgriWatch Crop Monitoring Alert

Alert:
{alert_type}

Severity:
{severity}

Crop:
{crop_display}

Crop ID:
{crop_id_display}

Message:
{message}

Please log in to AgriWatch to review
the latest crop monitoring information.

Regards,

AgriWatch
Smart Tomato Crop Monitoring
and Web-Based Alert System
"""

    if severity.lower() == "critical":

        badge_background = "#fff0ed"
        badge_color = "#b33b29"

    else:

        badge_background = "#fff6df"
        badge_color = "#9a6a05"

    content_html = f"""

<p style="
    color: #68736b;
    font-size: 14px;
    line-height: 1.6;
">
    AgriWatch detected a condition that
    may require your attention.
</p>

<div style="
    margin: 20px 0;
    padding: 18px;
    border: 1px solid #e1e8e3;
    border-radius: 10px;
">

    <div style="
        margin-bottom: 10px;
    ">

        <span style="
            display: inline-block;
            padding: 5px 10px;
            border-radius: 20px;
            background-color: {badge_background};
            color: {badge_color};
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        ">
            {severity}
        </span>

    </div>

    <div style="
        margin-bottom: 8px;
        color: #203c28;
        font-size: 16px;
        font-weight: bold;
    ">
        {alert_type}
    </div>

    <div style="
        margin-bottom: 12px;
        color: #68736b;
        font-size: 13px;
        line-height: 1.5;
    ">
        {message}
    </div>

    <div style="
        color: #7b857e;
        font-size: 12px;
    ">
        Crop:
        <strong>{crop_display}</strong>

        &nbsp;&nbsp;|&nbsp;&nbsp;

        Crop ID:
        <strong>{crop_id_display}</strong>
    </div>

</div>

<p style="
    color: #68736b;
    font-size: 13px;
    line-height: 1.6;
">
    Please log in to AgriWatch to review
    the latest crop monitoring information.
</p>

"""

    return send_email(
        recipient=recipient,
        subject=subject,
        body=body,
        html_body=build_email_template(
            "Crop Monitoring Alert",
            content_html
        )
    )