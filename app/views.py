from datetime import datetime
from pathlib import Path
from uuid import uuid4
from werkzeug.utils import secure_filename
from flask import Blueprint, render_template, request, redirect, url_for, flash, abort, send_from_directory
from flask_login import login_required, current_user
from .extensions import db
from .models import Area, Question, Submission, Response, OptionItem, Attachment
from .services.catalog import get_area_layout, get_manageable_lists
from .services.dashboard import build_dashboard_snapshot
from .services.workbook_sync import export_repository_workbook
from .services.reminders import send_monthly_reminders

main_bp = Blueprint("main", __name__)

ALLOWED_EXTENSIONS = {"pdf","xlsx","xls","doc","docx","ppt","pptx","png","jpg","jpeg","webp","txt","csv"}

def _parse_value(question, raw_value):
    raw_value = (raw_value or "").strip()
    if raw_value == "":
        return None, None, None, None
    if question.input_type == "number":
        raw_value = raw_value.replace("%", "").replace(",", ".")
        try:
            return float(raw_value), None, None, None
        except Exception:
            return None, raw_value, None, None
    if question.input_type == "date":
        try:
            return None, None, datetime.strptime(raw_value, "%Y-%m-%d").date(), None
        except Exception:
            return None, raw_value, None, None
    if question.input_type in ("select", "text", "long_text", "multiselect"):
        return None, raw_value, None, None
    if question.input_type == "boolean":
        return None, None, None, raw_value.lower() in ("1", "true", "si", "sí", "yes", "on")
    return None, raw_value, None, None

def _upsert_submission(area_code, period_key):
    sub = Submission.query.filter_by(area_code=area_code, period_key=period_key).first()
    if not sub:
        sub = Submission(
            submission_key=f"SUB-{area_code}-{period_key}",
            area_code=area_code,
            period_key=period_key,
            status="Borrador",
            responsible_user=current_user.username,
            opened_at=datetime.utcnow()
        )
        db.session.add(sub)
        db.session.flush()
    return sub

def _allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def _save_attachments(submission):
    upload_dir = Path(main_bp.root_path).parent.parent / "instance" / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    files = request.files.getlist("attachments")
    created = 0
    for f in files:
        if not f or not f.filename:
            continue
        if not _allowed_file(f.filename):
            continue
        safe = secure_filename(f.filename)
        stored = f"{uuid4().hex}_{safe}"
        f.save(upload_dir / stored)
        db.session.add(Attachment(
            submission_id=submission.id,
            original_filename=safe,
            stored_filename=stored,
            content_type=f.mimetype,
            uploaded_by=current_user.username
        ))
        created += 1
    return created

def _get_saved_map(sub):
    saved = {}
    if sub:
        for r in sub.responses:
            saved[(r.row_key, r.question_key)] = r
    return saved

def _get_previous_period_key(period_key):
    dt = datetime.strptime(period_key + "-01", "%Y-%m-%d")
    prev = dt.replace(year=dt.year - 1)
    return prev.strftime("%Y-%m")

def _save_dynamic_form(area_code, period_key):
    sub = _upsert_submission(area_code, period_key)
    sub.saved_at = datetime.utcnow()
    sub.comments = request.form.get("submission_comments", "")
    sub.narrative_text = request.form.get("narrative_text", "")
    if request.form.get("submit_action") == "send":
        sub.status = "Enviado"
        sub.submitted_at = datetime.utcnow()
    else:
        sub.status = "Borrador"

    Response.query.filter_by(submission_id=sub.id).delete()
    questions = Question.query.filter_by(area_code=area_code, is_active=True).all()
    qmap = {q.question_key: q for q in questions}
    required_total = 0
    required_filled = 0

    for key, values in request.form.lists():
        if not key.startswith("resp::"):
            continue
        _, row_key, question_key = key.split("::", 2)
        q = qmap.get(question_key)
        if not q:
            continue
        raw_value = "|".join(values) if q.input_type == "multiselect" else (values[-1] if values else "")
        value_num, value_text, value_date, value_bool = _parse_value(q, raw_value)
        observation = request.form.get(f"obs::{row_key}::{question_key}", "").strip() if q.allow_observation else None
        has_value = any(v is not None and v != "" for v in [value_num, value_text, value_date, value_bool])
        if q.required:
            required_total += 1
            if has_value:
                required_filled += 1
        if has_value or observation:
            db.session.add(Response(
                submission_id=sub.id,
                question_key=question_key,
                row_key=row_key,
                value_num=value_num,
                value_text=value_text,
                value_date=value_date,
                value_bool=value_bool,
                unit=q.unit,
                observation=observation,
                created_by=current_user.username
            ))

    sub.completeness_pct = round((required_filled / required_total) * 100, 2) if required_total else 100
    _save_attachments(sub)
    db.session.commit()
    export_repository_workbook()
    return sub

def _can_manage_list(list_code, area_code):
    if current_user.role == "admin":
        return True
    items = OptionItem.query.filter_by(list_code=list_code, is_active=True).all()
    if items:
        return any(i.user_editable and i.owner_area_code == area_code for i in items)
    q = Question.query.filter_by(area_code=area_code, list_code=list_code, user_can_manage_options=True).first()
    return q is not None and current_user.area_code == area_code

@main_bp.route("/media/<path:filename>")
@login_required
def media_file(filename):
    upload_dir = Path(main_bp.root_path).parent.parent / "instance" / "uploads"
    return send_from_directory(upload_dir, filename, as_attachment=False)

@main_bp.route("/")
@login_required
def home():
    return redirect(url_for("main.dashboard"))

@main_bp.route("/dashboard")
@login_required
def dashboard():
    period_key = request.args.get("period_key", datetime.today().strftime("%Y-%m"))
    snapshot = build_dashboard_snapshot(period_key)
    areas = Area.query.filter_by(is_active=True).order_by(Area.name).all()
    return render_template("dashboard.html", snapshot=snapshot, areas=areas)

@main_bp.route("/form/<area_code>/<period_key>", methods=["GET", "POST"])
@login_required
def area_form(area_code, period_key):
    if current_user.role != "admin" and current_user.area_code != area_code:
        abort(403)
    period_key = request.values.get("period_key", period_key)
    area = Area.query.filter_by(code=area_code).first_or_404()
    if request.method == "POST":
        _save_dynamic_form(area_code, period_key)
        flash("Formulario guardado correctamente", "success")
        return redirect(url_for("main.area_form", area_code=area_code, period_key=period_key))
    layout = get_area_layout(area_code)
    sub = Submission.query.filter_by(area_code=area_code, period_key=period_key).first()
    saved = _get_saved_map(sub)
    previous_period_key = _get_previous_period_key(period_key)
    prev_sub = Submission.query.filter_by(area_code=area_code, period_key=previous_period_key).first()
    previous_values = _get_saved_map(prev_sub)
    attachments = sub.attachments if sub else []
    manageable_lists = get_manageable_lists(area_code)
    return render_template(
        "area_form.html",
        area=area,
        period_key=period_key,
        previous_period_key=previous_period_key,
        layout=layout,
        saved=saved,
        previous_values=previous_values,
        sub=sub,
        attachments=attachments,
        manageable_lists=manageable_lists,
    )

@main_bp.route("/lists/<list_code>", methods=["GET", "POST"])
@login_required
def list_manager(list_code):
    sample = OptionItem.query.filter_by(list_code=list_code).first()
    area_code = request.args.get("area_code") or (sample.owner_area_code if sample else current_user.area_code)
    if not _can_manage_list(list_code, area_code):
        abort(403)
    if request.method == "POST":
        action = request.form.get("action", "create")
        if action == "create":
            value_label = request.form.get("value_label", "").strip()
            if value_label:
                value_code = request.form.get("value_code", "").strip() or secure_filename(value_label).replace("-", "_")
                next_order = (db.session.query(db.func.max(OptionItem.sort_order)).filter_by(list_code=list_code).scalar() or 0) + 1
                db.session.add(OptionItem(
                    list_code=list_code,
                    value_code=value_code,
                    value_label=value_label,
                    group_name=request.form.get("group_name", list_code),
                    owner_area_code=area_code,
                    user_editable=True,
                    sort_order=next_order,
                    is_active=True,
                    created_by=current_user.username
                ))
                db.session.commit()
                export_repository_workbook()
                flash("Elemento agregado", "success")
        elif action == "update":
            item = OptionItem.query.get_or_404(int(request.form.get("item_id")))
            item.value_code = request.form.get("value_code", item.value_code).strip() or item.value_code
            item.value_label = request.form.get("value_label", item.value_label).strip() or item.value_label
            item.sort_order = int(request.form.get("sort_order", item.sort_order) or item.sort_order)
            db.session.commit()
            export_repository_workbook()
            flash("Elemento actualizado", "success")
        elif action == "delete":
            item = OptionItem.query.get_or_404(int(request.form.get("item_id")))
            db.session.delete(item)
            db.session.commit()
            export_repository_workbook()
            flash("Elemento eliminado", "success")
        return redirect(url_for("main.list_manager", list_code=list_code, area_code=area_code))
    items = OptionItem.query.filter_by(list_code=list_code).order_by(OptionItem.sort_order, OptionItem.value_label).all()
    return render_template("list_manager.html", list_code=list_code, area_code=area_code, items=items)

@main_bp.route("/attachment/<int:item_id>/delete", methods=["POST"])
@login_required
def delete_attachment(item_id):
    item = Attachment.query.get_or_404(item_id)
    if current_user.role != "admin" and current_user.area_code != item.submission.area_code:
        abort(403)
    filepath = Path(main_bp.root_path).parent.parent / "instance" / "uploads" / item.stored_filename
    if filepath.exists():
        filepath.unlink()
    db.session.delete(item)
    db.session.commit()
    export_repository_workbook()
    flash("Adjunto eliminado", "success")
    return redirect(url_for("main.area_form", area_code=item.submission.area_code, period_key=item.submission.period_key))

@main_bp.route("/report/<period_key>")
@login_required
def report(period_key):
    snapshot = build_dashboard_snapshot(period_key)
    submissions = Submission.query.filter_by(period_key=period_key).order_by(Submission.area_code).all()
    return render_template("report.html", snapshot=snapshot, submissions=submissions)

@main_bp.route("/tasks/send-reminders")
@login_required
def manual_send_reminders():
    if current_user.role != "admin":
        abort(403)
    sent = send_monthly_reminders()
    flash(f"Recordatorios procesados: {sent}", "success")
    return redirect(url_for("admin.index"))
