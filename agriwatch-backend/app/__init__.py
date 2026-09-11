from flask import Flask
import os

from flask_cors import CORS

from app.config import Config

from app.extensions import (
    db,
    bcrypt,
    jwt
)


def create_app():

    app = Flask(__name__)

    app.config.from_object(
        Config
    )

    # =====================================================
    # DATABASE / EXTENSIONS
    # =====================================================

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    # =====================================================
    # JWT ERROR HANDLERS
    # =====================================================

    @jwt.unauthorized_loader
    def unauthorized_callback(reason):

        return {
            "status": "error",
            "message": (
                f"Missing or invalid authorization: "
                f"{reason}"
            )
        }, 401


    @jwt.invalid_token_loader
    def invalid_token_callback(reason):

        return {
            "status": "error",
            "message": (
                f"Invalid token: "
                f"{reason}"
            )
        }, 422


    @jwt.expired_token_loader
    def expired_token_callback(
        jwt_header,
        jwt_payload
    ):

        return {
            "status": "error",
            "message": (
                "Your session has expired. "
                "Please log in again."
            )
        }, 401

    # =====================================================
    # CORS
    # =====================================================

    cors_origins = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,https://agriwatch-frontend.onrender.com"
    )

    allowed_origins = [
        origin.strip().rstrip("/")
        for origin in cors_origins.split(",")
        if origin.strip()
    ]

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": allowed_origins,
                "methods": [
                    "GET",
                    "POST",
                    "PUT",
                    "PATCH",
                    "DELETE",
                    "OPTIONS"
                ],
                "allow_headers": [
                    "Content-Type",
                    "Authorization"
                ],
                "supports_credentials": False
            }
        }
    )

    # =====================================================
    # MODELS
    # =====================================================

    from app.models.user import User
    from app.models.otp import OTP
    from app.models.farm import Farm
    from app.models.crop import Crop
    from app.models.monitoring import MonitoringRecord
    from app.models.alert import Alert

    # =====================================================
    # CREATE DATABASE TABLES
    # =====================================================

    with app.app_context():

        db.create_all()

    # =====================================================
    # ROUTES
    # =====================================================

    from app.routes.auth import auth_bp

    app.register_blueprint(
        auth_bp,
        url_prefix="/api/auth"
    )


    from app.routes.admin import admin_bp

    app.register_blueprint(
        admin_bp,
        url_prefix="/api/admin"
    )


    from app.routes.farm import farm_bp

    app.register_blueprint(
        farm_bp,
        url_prefix="/api/farms"
    )


    from app.routes.crop import crop_bp

    app.register_blueprint(
        crop_bp,
        url_prefix="/api/crops"
    )


    from app.routes.monitoring import monitoring_bp

    app.register_blueprint(
        monitoring_bp,
        url_prefix="/api/monitoring"
    )


    from app.routes.alert import alert_bp

    app.register_blueprint(
        alert_bp,
        url_prefix="/api/alerts"
    )

    # =====================================================
    # HEALTH CHECK
    # =====================================================

    @app.get("/api/health")
    def health_check():

        return {
            "status": "success",
            "message": "AgriWatch API is running"
        }

    return app