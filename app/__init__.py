from pathlib import Path
from flask import Flask, url_for
from .config import Config
from .extensions import db, login_manager
from .auth import auth_bp
from .views import main_bp
from .admin import admin_bp
from .services.reminders import start_scheduler

def create_app():
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(Config)
    Path(app.instance_path).mkdir(parents=True, exist_ok=True)
    Path(app.config["UPLOAD_FOLDER"]).mkdir(parents=True, exist_ok=True)

    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = "auth.login"

    with app.app_context():
        from . import models
        db.create_all()
        _ensure_default_settings()

    @app.context_processor
    def inject_branding():
        from .models import AppSetting
        logo = AppSetting.query.filter_by(setting_key="logo_filename").first()
        if logo and logo.setting_value:
            if logo.setting_value.startswith("img/"):
                brand_logo_url = url_for("static", filename=logo.setting_value)
            else:
                brand_logo_url = url_for("main.media_file", filename=logo.setting_value)
        else:
            brand_logo_url = url_for("static", filename="img/logo_paracel.png")
        return {"brand_logo_url": brand_logo_url}

    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(admin_bp)

    start_scheduler(app)
    return app

def _ensure_default_settings():
    from .models import AppSetting
    if not AppSetting.query.filter_by(setting_key="logo_filename").first():
        db.session.add(AppSetting(setting_key="logo_filename", setting_value="img/logo_paracel.png"))
    if not AppSetting.query.filter_by(setting_key="reminder_day").first():
        db.session.add(AppSetting(setting_key="reminder_day", setting_value="25"))
    db.session.commit()
