import os

from dotenv import load_dotenv


load_dotenv()


class Config:

    # =================================================
    # FLASK
    # =================================================

    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "agriwatch-secret-key"
    )

    # =================================================
    # DATABASE
    # =================================================

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SQLALCHEMY_ENGINE_OPTIONS = {
        "connect_args": {
            "ssl": {}
        }
    }

    # =================================================
    # JWT
    # =================================================

    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        "agriwatch-jwt-secret-key"
    )

    # =================================================
    # MAIL
    # =================================================

    MAIL_HOST = os.getenv(
        "MAIL_HOST",
        "smtp.gmail.com"
    )

    MAIL_PORT = int(
        os.getenv(
            "MAIL_PORT",
            "587"
        )
    )

    MAIL_USERNAME = os.getenv(
        "MAIL_USERNAME"
    )

    MAIL_PASSWORD = os.getenv(
        "MAIL_PASSWORD"
    )

    MAIL_FROM = os.getenv(
        "MAIL_FROM"
    )

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