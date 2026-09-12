from flask import Flask
import os

from flask_cors import CORS
from app.config import Config
from app.extensions import db, bcrypt, jwt


def create_app():

    app = Flask(__name__)

    app.config.from_object(Config)

    # ========================================
    # DATABASE
    # ========================================

    db.init_app(app)


    # ========================================
    # AUTHENTICATION
    # ========================================

    bcrypt.init_app(app)

    jwt.init_app(app)


    # ========================================
    # JWT ERROR HANDLERS
    # ========================================

    @jwt.unauthorized_loader
    def unauthorized_callback(reason):

        return {
            "status": "error",
            "message": f"Missing or invalid authorization: {reason}"
        }, 401


    @jwt.invalid_token_loader
    def invalid_token_callback(reason):

        return {
            "status": "error",
            "message": f"Invalid token: {reason}"
        }, 422


    @jwt.expired_token_loader
    def expired_token_callback(
        jwt_header,
        jwt_payload
    ):

        return {
            "status": "error",
            "message": "Your session has expired. Please log in again."
        }, 401


    # ========================================
    # CORS
    # ========================================

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


    # ========================================
    # ROUTES
    # ========================================

    from app.routes.auth import auth_bp
    from app.routes.admin import admin_bp
    from app.routes.farm import farm_bp
    from app.routes.crop import crop_bp
    from app.routes.monitoring import monitoring_bp
    from app.routes.alert import alert_bp
    from app.routes.reports import reports_bp


    app.register_blueprint(
        auth_bp,
        url_prefix="/api/auth"
    )


    app.register_blueprint(
        admin_bp,
        url_prefix="/api/admin"
    )


    app.register_blueprint(
        farm_bp,
        url_prefix="/api/farms"
    )


    app.register_blueprint(
        crop_bp,
        url_prefix="/api/crops"
    )


    app.register_blueprint(
        monitoring_bp,
        url_prefix="/api/monitoring"
    )


    app.register_blueprint(
        alert_bp,
        url_prefix="/api/alerts"
    )


    app.register_blueprint(
        reports_bp,
        url_prefix="/api/reports"
    )


    # ========================================
    # HEALTH CHECK
    # ========================================

    @app.get("/")
    def health_check():

        return {
            "status": "success",
            "message": "AgriWatch backend is running."
        }


    # ========================================
    # DATABASE INITIALIZATION
    # ========================================

    with app.app_context():

        from app.models.user import User
        from app.models.otp import OTP
        from app.models.farm import Farm
        from app.models.crop import Crop
        from app.models.monitoring import MonitoringRecord
        from app.models.alert import Alert

        db.create_all()


    return app