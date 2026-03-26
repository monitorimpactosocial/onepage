import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", f"sqlite:///{Path(BASE_DIR / 'instance' / 'paracel_onepage.db').as_posix()}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    WORKBOOK_TEMPLATE = os.getenv("WORKBOOK_TEMPLATE", str(BASE_DIR / "data" / "PARACEL_repositorio_mensual_template.xlsx"))
    WORKBOOK_OUTPUT = os.getenv("WORKBOOK_OUTPUT", str(BASE_DIR / "instance" / "PARACEL_repositorio_mensual_online.xlsx"))
    REMINDER_DAY = int(os.getenv("REMINDER_DAY", "25"))
    SMTP_HOST = os.getenv("SMTP_HOST", "")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    MAIL_FROM = os.getenv("MAIL_FROM", "reportes@paracel.local")
    GRAPH_TENANT_ID = os.getenv("GRAPH_TENANT_ID", "")
    GRAPH_CLIENT_ID = os.getenv("GRAPH_CLIENT_ID", "")
    GRAPH_CLIENT_SECRET = os.getenv("GRAPH_CLIENT_SECRET", "")
    GRAPH_DRIVE_ID = os.getenv("GRAPH_DRIVE_ID", "")
    GRAPH_UPLOAD_PATH = os.getenv("GRAPH_UPLOAD_PATH", "")
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", str(25 * 1024 * 1024)))
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", str(BASE_DIR / "instance" / "uploads"))
