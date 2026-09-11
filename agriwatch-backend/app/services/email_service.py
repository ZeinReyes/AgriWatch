import smtplib

from email.message import EmailMessage

from flask import current_app


# ==========================================
# Generic Email Sender
# ==========================================

def send_email(
    recipient,
    subject,
    body
):

    message = EmailMessage()

    message["Subject"] = subject

    message["From"] = current_app.config[
        "MAIL_FROM"
    ]

    message["To"] = recipient

    message.set_content(body)

    host = current_app.config[
        "MAIL_HOST"
    ]

    port = current_app.config[
        "MAIL_PORT"
    ]

    username = current_app.config[
        "MAIL_USERNAME"
    ]

    password = current_app.config[
        "MAIL_PASSWORD"
    ]

    with smtplib.SMTP(
        host,
        port
    ) as server:

        server.starttls()

        server.login(
            username,
            password
        )

        server.send_message(
            message
        )


# ==========================================
# Signup Verification Email
# ==========================================

def send_verification_otp(
    recipient,
    otp
):

    subject = (
        "AgriWatch - Email Verification"
    )

    body = f"""
Hello,

Welcome to AgriWatch!

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

    send_email(
        recipient,
        subject,
        body
    )


# ==========================================
# Password Reset Email
# ==========================================

def send_password_reset_otp(
    recipient,
    otp
):

    subject = (
        "AgriWatch - Password Reset"
    )

    body = f"""
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

    send_email(
        recipient,
        subject,
        body
    )