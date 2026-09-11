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

    # =================================================
    # CREATE FLASK APP
    # =================================================

    app = Flask(__name__)

    app.config.from_object(Config)


    # =================================================
    # INITIALIZE EXTENSIONS
    # =================================================

    db.init_app(app)

    bcrypt.init_app(app)

    jwt.init_app(app)


    # =================================================
    # JWT ERROR HANDLERS
    # =================================================

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


    # =================================================
    # CORS
    # =================================================

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    origin.strip()
                    for origin in os.getenv(
                        "CORS_ORIGINS",
                        "http://localhost:5173"
                    ).split(",")
                    if origin.strip()
                ]
            }
        }
    )


    # =================================================
    # IMPORT MODELS
    # =================================================

    from app.models.user import User
    from app.models.otp import OTP
    from app.models.farm import Farm
    from app.models.crop import Crop


    # =================================================
    # CREATE DATABASE TABLES
    # =================================================

    with app.app_context():

        db.create_all()


    # =================================================
    # REGISTER AUTH ROUTES
    # =================================================

    from app.routes.auth import auth_bp

    app.register_blueprint(
        auth_bp,
        url_prefix="/api/auth"
    )


    # =================================================
    # REGISTER ADMIN ROUTES
    # =================================================

    from app.routes.admin import admin_bp

    app.register_blueprint(
        admin_bp,
        url_prefix="/api/admin"
    )


    # =================================================
    # REGISTER FARM ROUTES
    # =================================================

    from app.routes.farm import farm_bp

    app.register_blueprint(
        farm_bp,
        url_prefix="/api/farms"
    )


    # =================================================
    # REGISTER CROP ROUTES
    # =================================================

    from app.routes.crop import crop_bp

    app.register_blueprint(
        crop_bp,
        url_prefix="/api/crops"
    )


    # =================================================
    # HEALTH CHECK
    # =================================================

    @app.get("/api/health")
    def health_check():

        return {
            "status": "success",
            "message": "AgriWatch API is running"
        }


    # =================================================
    # RETURN APP
    # =================================================

    return app