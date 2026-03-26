import smtplib
from email.message import EmailMessage
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from flask import current_app
from ..extensions import db
from ..models import User, Submission, AppSetting

_scheduler = None

def _target_period():
    today = datetime.today().replace(day=1)
    prev = today - timedelta(days=1)
    return prev.strftime("%Y-%m")

def send_mail(to_address, subject, body):
    cfg = current_app.config
    if not cfg.get("SMTP_HOST") or not to_address:
        return False, "SMTP no configurado"
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = cfg.get("MAIL_FROM")
    msg["To"] = to_address
    msg.set_content(body)
    try:
        server = smtplib.SMTP(cfg["SMTP_HOST"], cfg["SMTP_PORT"], timeout=30)
        if cfg.get("SMTP_USE_TLS"):
            server.starttls()
        if cfg.get("SMTP_USER"):
            server.login(cfg["SMTP_USER"], cfg["SMTP_PASSWORD"])
        server.send_message(msg)
        server.quit()
        return True, "enviado"
    except Exception as exc:
        return False, str(exc)

def send_monthly_reminders(period_key=None):
    period_key = period_key or _target_period()
    sent = []
    for user in User.query.filter(User.role == "responsable", User.is_active_flag.is_(True)).all():
        subject = f"Recordatorio de carga mensual, período {period_key}"
        body = (
            f"Estimado/a {user.full_name},\n\n"
            f"Se recuerda la necesidad de completar la carga mensual correspondiente al cierre del período {period_key}.\n"
            f"Ingrese a la app con su usuario y contraseña para registrar la información de su área.\n\n"
            f"Saludos."
        )
        ok, detail = send_mail(user.email, subject, body)
        sub = Submission.query.filter_by(area_code=user.area_code, period_key=period_key).first()
        if sub:
            sub.reminder_sent_at = datetime.utcnow()
        sent.append({"username": user.username, "ok": ok, "detail": detail})
    db.session.commit()
    return sent

def _job_wrapper(app):
    with app.app_context():
        send_monthly_reminders()

def start_scheduler(app):
    global _scheduler
    if _scheduler is not None:
        return
    _scheduler = BackgroundScheduler(daemon=True)
    _scheduler.add_job(
        func=_job_wrapper,
        trigger="cron",
        args=[app],
        day=_reminder_day(app),
        hour=8,
        minute=0,
        id="monthly_reminders",
        replace_existing=True,
    )
    _scheduler.start()


def _reminder_day(app):
    with app.app_context():
        item = AppSetting.query.filter_by(setting_key='reminder_day').first()
        try:
            return int(item.setting_value) if item and item.setting_value else app.config['REMINDER_DAY']
        except Exception:
            return app.config['REMINDER_DAY']
