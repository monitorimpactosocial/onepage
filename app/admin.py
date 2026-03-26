from pathlib import Path
from flask import Blueprint, render_template, request, redirect, url_for, flash, abort
from flask_login import login_required, current_user
from werkzeug.security import generate_password_hash
from werkzeug.utils import secure_filename
from .extensions import db
from .models import User, Area, Question, OptionItem, AppSetting
from .services.workbook_sync import export_repository_workbook

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")

def admin_required():
    if not current_user.is_authenticated or current_user.role != "admin":
        abort(403)

@admin_bp.before_request
def _guard():
    admin_required()

@admin_bp.route("/")
@login_required
def index():
    return render_template(
        "admin/index.html",
        user_count=User.query.count(),
        area_count=Area.query.count(),
        question_count=Question.query.count(),
        option_count=OptionItem.query.count(),
    )

@admin_bp.route("/settings", methods=["GET", "POST"])
@login_required
def settings():
    logo = AppSetting.query.filter_by(setting_key="logo_filename").first()
    reminder = AppSetting.query.filter_by(setting_key="reminder_day").first()
    if request.method == "POST":
        if "logo_file" in request.files and request.files["logo_file"].filename:
            f = request.files["logo_file"]
            safe = secure_filename(f.filename)
            stored = f"logo_{safe}"
            upload_dir = Path(admin_bp.root_path).parent.parent / "instance" / "uploads"
            upload_dir.mkdir(parents=True, exist_ok=True)
            f.save(upload_dir / stored)
            if not logo:
                logo = AppSetting(setting_key="logo_filename")
                db.session.add(logo)
            logo.setting_value = stored
        if not reminder:
            reminder = AppSetting(setting_key="reminder_day")
            db.session.add(reminder)
        reminder.setting_value = request.form.get("reminder_day", "25").strip() or "25"
        db.session.commit()
        export_repository_workbook()
        flash("Configuración actualizada", "success")
        return redirect(url_for("admin.settings"))
    return render_template("admin/settings.html", logo=logo, reminder=reminder)

@admin_bp.route("/users", methods=["GET", "POST"])
@login_required
def users():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        if username:
            obj = User(
                username=username,
                full_name=request.form.get("full_name", "").strip() or username,
                email=request.form.get("email", "").strip(),
                role=request.form.get("role", "responsable"),
                area_code=request.form.get("area_code", "").strip() or None,
                password_hash=generate_password_hash(request.form.get("password", "cambiar2026")),
                is_active_flag=request.form.get("is_active") == "on"
            )
            db.session.add(obj)
            db.session.commit()
            flash("Usuario creado", "success")
        return redirect(url_for("admin.users"))
    return render_template("admin/users.html", items=User.query.order_by(User.username).all(), areas=Area.query.order_by(Area.name).all())

@admin_bp.route("/users/<int:item_id>/delete", methods=["POST"])
@login_required
def delete_user(item_id):
    if current_user.id == item_id:
        flash("No se puede eliminar el usuario autenticado", "danger")
        return redirect(url_for("admin.users"))
    item = User.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    flash("Usuario eliminado", "success")
    return redirect(url_for("admin.users"))

@admin_bp.route("/areas", methods=["GET", "POST"])
@login_required
def areas():
    if request.method == "POST":
        obj = Area(
            code=request.form.get("code", "").strip(),
            name=request.form.get("name", "").strip(),
            group_name=request.form.get("group_name", "").strip(),
            responsible=request.form.get("responsible", "").strip(),
            email=request.form.get("email", "").strip(),
            source_sheet=request.form.get("source_sheet", "").strip(),
            description=request.form.get("description", "").strip(),
            is_active=request.form.get("is_active") == "on"
        )
        db.session.add(obj)
        db.session.commit()
        flash("Área creada", "success")
        return redirect(url_for("admin.areas"))
    return render_template("admin/areas.html", items=Area.query.order_by(Area.code).all())

@admin_bp.route("/areas/<int:item_id>/delete", methods=["POST"])
@login_required
def delete_area(item_id):
    item = Area.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    flash("Área eliminada", "success")
    return redirect(url_for("admin.areas"))

@admin_bp.route("/questions", methods=["GET", "POST"])
@login_required
def questions():
    if request.method == "POST":
        obj = Question(
            question_key=request.form.get("question_key", "").strip(),
            area_code=request.form.get("area_code", "").strip(),
            form_code=request.form.get("form_code", "").strip(),
            section=request.form.get("section", "").strip(),
            group_key=request.form.get("group_key", "").strip(),
            question_code=request.form.get("question_code", "").strip(),
            label=request.form.get("label", "").strip(),
            input_type=request.form.get("input_type", "text").strip(),
            unit=request.form.get("unit", "").strip(),
            required=request.form.get("required") == "on",
            allow_observation=request.form.get("allow_observation") == "on",
            order_n=int(request.form.get("order_n", "0") or 0),
            options=request.form.get("options", "").strip(),
            list_code=request.form.get("list_code", "").strip() or None,
            user_can_manage_options=request.form.get("user_can_manage_options") == "on",
            source_sheet=request.form.get("source_sheet", "").strip(),
            notes=request.form.get("notes", "").strip(),
            is_active=request.form.get("is_active") == "on",
        )
        db.session.add(obj)
        db.session.commit()
        flash("Pregunta creada", "success")
        return redirect(url_for("admin.questions"))
    return render_template("admin/questions.html", items=Question.query.order_by(Question.area_code, Question.section, Question.order_n).all(), areas=Area.query.order_by(Area.name).all())

@admin_bp.route("/questions/<int:item_id>/delete", methods=["POST"])
@login_required
def delete_question(item_id):
    item = Question.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    flash("Pregunta eliminada", "success")
    return redirect(url_for("admin.questions"))

@admin_bp.route("/options", methods=["GET", "POST"])
@login_required
def options():
    if request.method == "POST":
        obj = OptionItem(
            list_code=request.form.get("list_code", "").strip(),
            value_code=request.form.get("value_code", "").strip() or request.form.get("value_label", "").strip(),
            value_label=request.form.get("value_label", "").strip(),
            group_name=request.form.get("group_name", "").strip(),
            owner_area_code=request.form.get("owner_area_code", "").strip() or None,
            user_editable=request.form.get("user_editable") == "on",
            sort_order=int(request.form.get("sort_order", "0") or 0),
            is_active=request.form.get("is_active") == "on",
            created_by=current_user.username,
        )
        db.session.add(obj)
        db.session.commit()
        flash("Opción creada", "success")
        return redirect(url_for("admin.options"))
    return render_template("admin/options.html", items=OptionItem.query.order_by(OptionItem.list_code, OptionItem.sort_order).all())

@admin_bp.route("/options/<int:item_id>/delete", methods=["POST"])
@login_required
def delete_option(item_id):
    item = OptionItem.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    flash("Opción eliminada", "success")
    return redirect(url_for("admin.options"))

@admin_bp.route("/export-workbook")
@login_required
def export_workbook():
    export_repository_workbook()
    flash("Libro actualizado y exportado", "success")
    return redirect(url_for("admin.index"))
