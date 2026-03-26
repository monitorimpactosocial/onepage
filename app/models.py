from datetime import datetime
from flask_login import UserMixin
from .extensions import db, login_manager

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    full_name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(180), nullable=True)
    role = db.Column(db.String(30), nullable=False, default="responsable")
    area_code = db.Column(db.String(80), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_active_flag = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def get_id(self):
        return str(self.id)

    @property
    def is_active(self):
        return self.is_active_flag

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class Area(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(80), unique=True, nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False)
    group_name = db.Column(db.String(100), nullable=True)
    responsible = db.Column(db.String(150), nullable=True)
    email = db.Column(db.String(180), nullable=True)
    source_sheet = db.Column(db.String(180), nullable=True)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)

class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question_key = db.Column(db.String(180), unique=True, nullable=False, index=True)
    area_code = db.Column(db.String(80), nullable=False, index=True)
    form_code = db.Column(db.String(80), nullable=False)
    section = db.Column(db.String(120), nullable=False)
    group_key = db.Column(db.String(80), nullable=False)
    question_code = db.Column(db.String(80), nullable=False)
    label = db.Column(db.String(255), nullable=False)
    input_type = db.Column(db.String(30), nullable=False, default="number")
    unit = db.Column(db.String(40), nullable=True)
    required = db.Column(db.Boolean, default=True)
    allow_observation = db.Column(db.Boolean, default=False)
    order_n = db.Column(db.Integer, default=0)
    options = db.Column(db.Text, nullable=True)
    list_code = db.Column(db.String(80), nullable=True)
    user_can_manage_options = db.Column(db.Boolean, default=False)
    source_sheet = db.Column(db.String(180), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)

class OptionItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    list_code = db.Column(db.String(80), index=True, nullable=False)
    value_code = db.Column(db.String(120), nullable=False)
    value_label = db.Column(db.String(180), nullable=False)
    group_name = db.Column(db.String(120), nullable=True)
    owner_area_code = db.Column(db.String(80), nullable=True)
    user_editable = db.Column(db.Boolean, default=False)
    sort_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.String(80), nullable=True)

class Submission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    submission_key = db.Column(db.String(120), unique=True, nullable=False, index=True)
    area_code = db.Column(db.String(80), index=True, nullable=False)
    period_key = db.Column(db.String(7), index=True, nullable=False)
    status = db.Column(db.String(30), nullable=False, default="Borrador")
    responsible_user = db.Column(db.String(80), nullable=True)
    opened_at = db.Column(db.DateTime, nullable=True)
    saved_at = db.Column(db.DateTime, nullable=True)
    submitted_at = db.Column(db.DateTime, nullable=True)
    completeness_pct = db.Column(db.Float, default=0)
    reminder_sent_at = db.Column(db.DateTime, nullable=True)
    comments = db.Column(db.Text, nullable=True)
    narrative_text = db.Column(db.Text, nullable=True)
    responses = db.relationship("Response", backref="submission", cascade="all, delete-orphan", lazy=True)
    attachments = db.relationship("Attachment", backref="submission", cascade="all, delete-orphan", lazy=True)

class Response(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey("submission.id"), nullable=False, index=True)
    question_key = db.Column(db.String(180), index=True, nullable=False)
    row_key = db.Column(db.String(180), nullable=True, default="general")
    value_num = db.Column(db.Float, nullable=True)
    value_text = db.Column(db.Text, nullable=True)
    value_date = db.Column(db.Date, nullable=True)
    value_bool = db.Column(db.Boolean, nullable=True)
    unit = db.Column(db.String(40), nullable=True)
    observation = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.String(80), nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Attachment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey("submission.id"), nullable=False, index=True)
    original_filename = db.Column(db.String(255), nullable=False)
    stored_filename = db.Column(db.String(255), nullable=False)
    content_type = db.Column(db.String(120), nullable=True)
    uploaded_by = db.Column(db.String(80), nullable=True)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

class AppSetting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    setting_key = db.Column(db.String(80), unique=True, nullable=False, index=True)
    setting_value = db.Column(db.Text, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
