import smtplib

from email.message import EmailMessage

from flask import current_app


# =========================================================
# AgriWatch Email Service
# =========================================================


def send_email(
    recipient,
    subject,
    body,
    html_body=None
):
    """
    Generic email sender.

    Sends both plain-text and HTML versions when html_body
    is provided.
    """

    message = EmailMessage()

    message["Subject"] = subject
    message["From"] = current_app.config["MAIL_FROM"]
    message["To"] = recipient

    # Plain-text fallback
    message.set_content(body)

    # HTML version
    if html_body:
        message.add_alternative(
            html_body,
            subtype="html"
        )

    host = current_app.config["MAIL_HOST"]
    port = current_app.config["MAIL_PORT"]
    username = current_app.config["MAIL_USERNAME"]
    password = current_app.config["MAIL_PASSWORD"]

    with smtplib.SMTP(host, port) as server:

        server.starttls()

        server.login(
            username,
            password
        )

        server.send_message(
            message
        )


# =========================================================
# Shared AgriWatch Email Template
# =========================================================


def build_email_template(
    title,
    content_html
):
    """
    Creates the standard AgriWatch HTML email layout.
    """

    return f"""
<!DOCTYPE html>

<html>

<head>

    <meta charset="UTF-8">

    <meta name="viewport"
          content="width=device-width,
                   initial-scale=1.0">

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
        line-height: 1.2;
    ">
        AgriWatch
    </div>

    <div style="
        color: #dcebdd;
        font-size: 12px;
        margin-top: 5px;
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
    padding: 32px 30px;
">

    <h1 style="
        margin: 0 0 18px 0;
        color: #183b24;
        font-size: 22px;
        line-height: 1.3;
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
        Smart Tomato Crop Monitoring and Web-Based Alert System
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
# Signup Verification Email
# =========================================================


def send_verification_otp(
    recipient,
    otp
):

    subject = (
        "AgriWatch - Verify Your Email"
    )

    body = f"""
AgriWatch Email Verification

Hello,

Thank you for creating an AgriWatch account.

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
    margin: 0 0 18px 0;
    color: #4f5d53;
    font-size: 14px;
    line-height: 1.6;
">
    Hello,
</p>

<p style="
    margin: 0 0 22px 0;
    color: #4f5d53;
    font-size: 14px;
    line-height: 1.6;
">
    Thank you for creating an
    <strong>AgriWatch</strong> account.
    Please use the verification code below
    to confirm your email address.
</p>

<div style="
    background-color: #edf6ef;
    border: 1px solid #d8e9dc;
    border-radius: 10px;
    padding: 20px;
    text-align: center;
    margin-bottom: 22px;
">

    <div style="
        color: #6f7c73;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 8px;
    ">
        Verification Code
    </div>

    <div style="
        color: #2f7543;
        font-size: 32px;
        font-weight: bold;
        letter-spacing: 7px;
    ">
        {otp}
    </div>

</div>

<p style="
    margin: 0 0 10px 0;
    color: #6c776f;
    font-size: 13px;
    line-height: 1.5;
">
    This verification code will expire in
    <strong>5 minutes</strong>.
</p>

<p style="
    margin: 20px 0 0 0;
    color: #7b857e;
    font-size: 12px;
    line-height: 1.5;
">
    If you did not create an AgriWatch account,
    you can safely ignore this email.
</p>
"""

    html_body = build_email_template(
        "Verify Your Email",
        content_html
    )

    send_email(
        recipient,
        subject,
        body,
        html_body
    )


# =========================================================
# Password Reset Email
# =========================================================


def send_password_reset_otp(
    recipient,
    otp
):

    subject = (
        "AgriWatch - Password Reset Code"
    )

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
    margin: 0 0 18px 0;
    color: #4f5d53;
    font-size: 14px;
    line-height: 1.6;
">
    Hello,
</p>

<p style="
    margin: 0 0 22px 0;
    color: #4f5d53;
    font-size: 14px;
    line-height: 1.6;
">
    We received a request to reset your
    <strong>AgriWatch</strong> account password.
    Use the code below to continue.
</p>

<div style="
    background-color: #f5f7f5;
    border: 1px solid #dfe6e1;
    border-radius: 10px;
    padding: 20px;
    text-align: center;
    margin-bottom: 22px;
">

    <div style="
        color: #6f7c73;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 8px;
    ">
        Password Reset Code
    </div>

    <div style="
        color: #2f7543;
        font-size: 32px;
        font-weight: bold;
        letter-spacing: 7px;
    ">
        {otp}
    </div>

</div>

<p style="
    margin: 0 0 10px 0;
    color: #6c776f;
    font-size: 13px;
    line-height: 1.5;
">
    This password reset code will expire in
    <strong>5 minutes</strong>.
</p>

<p style="
    margin: 20px 0 0 0;
    color: #7b857e;
    font-size: 12px;
    line-height: 1.5;
">
    If you did not request a password reset,
    you can safely ignore this email.
</p>
"""

    html_body = build_email_template(
        "Password Reset",
        content_html
    )

    send_email(
        recipient,
        subject,
        body,
        html_body
    )


# =========================================================
# Monitoring Alert Email
# =========================================================


def send_alert_email(
    recipient,
    alert_type,
    severity,
    message,
    crop_name=None,
    crop_id=None
):
    """
    Sends an automated monitoring alert to the farmer.
    """

    severity_lower = (
        severity.lower()
        if severity
        else "warning"
    )

    if severity_lower == "critical":

        severity_label = "CRITICAL"

        severity_bg = "#fff0ed"

        severity_text = "#b33b29"

    else:

        severity_label = "WARNING"

        severity_bg = "#fff6df"

        severity_text = "#9a6a05"


    subject = (
        f"AgriWatch - {severity_label}: "
        f"{alert_type}"
    )


    crop_information = ""

    if crop_name:

        crop_information += f"""
        <div style="
            margin-bottom: 7px;
            color: #5f6b63;
            font-size: 13px;
        ">
            <strong>Crop:</strong>
            {crop_name}
        </div>
        """

    elif crop_id:

        crop_information += f"""
        <div style="
            margin-bottom: 7px;
            color: #5f6b63;
            font-size: 13px;
        ">
            <strong>Crop ID:</strong>
            #{crop_id}
        </div>
        """


    body = f"""
AgriWatch Monitoring Alert

Alert Type: {alert_type}
Severity: {severity_label}

{message}

{f"Crop: {crop_name}" if crop_name else f"Crop ID: #{crop_id}" if crop_id else ""}

Please log in to the AgriWatch monitoring system
to review the latest crop information.

Regards,

AgriWatch
Smart Tomato Crop Monitoring
and Web-Based Alert System
"""


    content_html = f"""

<p style="
    margin: 0 0 20px 0;
    color: #4f5d53;
    font-size: 14px;
    line-height: 1.6;
">
    A monitoring condition requiring your
    attention has been detected.
</p>


<div style="
    background-color: {severity_bg};
    border: 1px solid {severity_bg};
    border-radius: 10px;
    padding: 16px 18px;
    margin-bottom: 20px;
">

    <div style="
        margin-bottom: 6px;
        color: {severity_text};
        font-size: 11px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
    ">
        {severity_label}
    </div>

    <div style="
        color: #203c28;
        font-size: 18px;
        font-weight: bold;
    ">
        {alert_type}
    </div>

</div>


<div style="
    margin-bottom: 20px;
">

    <div style="
        color: #7b857e;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.7px;
        margin-bottom: 7px;
    ">
        Detection Details
    </div>

    <div style="
        background-color: #f7f9f7;
        border: 1px solid #e3e9e4;
        border-radius: 9px;
        padding: 15px;

        color: #4f5d53;
        font-size: 13px;
        line-height: 1.6;
    ">
        {message}
    </div>

</div>


{crop_information}


<p style="
    margin: 20px 0 0 0;
    color: #6c776f;
    font-size: 13px;
    line-height: 1.6;
">
    Please log in to the
    <strong>AgriWatch monitoring system</strong>
    to review the latest crop information
    and take appropriate action.
</p>

"""

    html_body = build_email_template(
        "Crop Monitoring Alert",
        content_html
    )

    send_email(
        recipient,
        subject,
        body,
        html_body
    )