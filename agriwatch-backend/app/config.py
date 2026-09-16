import os

from dotenv import load_dotenv


load_dotenv()


class Config:

    # =====================================================
    # Flask
    # =====================================================

    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "agriwatch-secret-key"
    )

    # =====================================================
    # Database
    # =====================================================

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SQLALCHEMY_ENGINE_OPTIONS = {
        "connect_args": {
            "ssl": {}
        }
    }

    # =====================================================
    # JWT
    # =====================================================

    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        "agriwatch-jwt-secret-key"
    )

    # =====================================================
    # Brevo Email API
    # =====================================================

    BREVO_API_KEY = os.getenv(
        "BREVO_API_KEY"
    )

    MAIL_FROM = os.getenv(
        "MAIL_FROM"
    )

    MAIL_FROM_NAME = os.getenv(
        "MAIL_FROM_NAME",
        "AgriWatch"
    )

    # =====================================================
    # OTP
    # =====================================================

    OTP_EXPIRY_MINUTES = int(
        os.getenv(
            "OTP_EXPIRY_MINUTES",
            "5"
        )
    )

    OTP_MAX_ATTEMPTS = int(
        os.getenv(
            "OTP_MAX_ATTEMPTS",
            "5"
        )
    )


    INFOBIP_API_KEY = os.getenv(
        "INFOBIP_API_KEY"
    )

    INFOBIP_BASE_URL = os.getenv(
        "INFOBIP_BASE_URL",
        "https://api.infobip.com"
    )

    INFOBIP_SENDER = os.getenv(
        "INFOBIP_SENDER",
        "ServiceSMS"
    )

    INFOBIP_SMS_RECIPIENT = os.getenv(
        "INFOBIP_SMS_RECIPIENT"
    )