import json
from pathlib import Path
from werkzeug.security import generate_password_hash
from flask import current_app
from .extensions import db
from .models import User, Area, Question, OptionItem, AppSetting
from .services.workbook_sync import export_repository_workbook

def seed_database(reset=False):
    if reset:
        db.drop_all()
        db.create_all()

    seed_path = Path(current_app.root_path).parent / "data" / "catalog_seed.json"
    payload = json.loads(seed_path.read_text(encoding="utf-8"))

    if not Area.query.first():
        for item in payload["areas"]:
            db.session.add(Area(
                code=item["area_code"],
                name=item["area_name"],
                group_name=item.get("group"),
                responsible=item.get("responsible"),
                email=item.get("email"),
                source_sheet=item.get("source_sheet"),
                description=item.get("description"),
                is_active=True,
            ))

    if not User.query.first():
        for item in payload["users"]:
            password = "paracel2026" if item["username"] == "admin" else "cambiar2026"
            db.session.add(User(
                username=item["username"],
                full_name=item["full_name"],
                email=item.get("email"),
                role=item["role"],
                area_code=item.get("area_code"),
                password_hash=generate_password_hash(password),
                is_active_flag=item.get("active", "Sí") == "Sí"
            ))

    if not Question.query.first():
        for item in payload["question_catalog"]:
            db.session.add(Question(
                question_key=item["question_id"],
                area_code=item["area_code"],
                form_code=item["form_code"],
                section=item["section"],
                group_key=item["group_key"],
                question_code=item["question_code"],
                label=item["label"],
                input_type=item["input_type"],
                unit=item.get("unit"),
                required=item.get("required", "Sí") == "Sí",
                allow_observation=item.get("allow_observation", "No") == "Sí",
                order_n=item.get("order_n", 0),
                options=item.get("options", ""),
                list_code=item.get("list_code"),
                user_can_manage_options=item.get("user_can_manage_options", "No") == "Sí",
                source_sheet=item.get("source_sheet", ""),
                notes=item.get("notes", ""),
                is_active=True,
            ))

    if not OptionItem.query.first():
        for list_code, values in payload["option_lists"].items():
            for pos, val in enumerate(values, start=1):
                if isinstance(val, dict):
                    value_code = val.get("value_code") or val.get("value_label")
                    value_label = val.get("value_label") or val.get("value_code")
                    owner_area_code = val.get("owner_area_code")
                    user_editable = val.get("user_editable", False)
                    group_name = val.get("group_name", list_code)
                else:
                    value_code = str(val).strip()
                    value_label = str(val).strip()
                    owner_area_code = None
                    user_editable = False
                    group_name = list_code
                db.session.add(OptionItem(
                    list_code=list_code,
                    value_code=str(value_code).strip(),
                    value_label=str(value_label).strip(),
                    group_name=group_name,
                    owner_area_code=owner_area_code,
                    user_editable=user_editable,
                    sort_order=pos,
                    is_active=True,
                    created_by="seed"
                ))

    if not AppSetting.query.filter_by(setting_key="logo_filename").first():
        db.session.add(AppSetting(setting_key="logo_filename", setting_value="img/logo_paracel.png"))
    if not AppSetting.query.filter_by(setting_key="reminder_day").first():
        db.session.add(AppSetting(setting_key="reminder_day", setting_value="25"))

    db.session.commit()
    export_repository_workbook()
