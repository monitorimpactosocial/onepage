from datetime import datetime
from sqlalchemy import func
from ..models import Response, Submission

def _sum_value(period_key, question_keys=None):
    query = Response.query.join(Submission).filter(Submission.period_key == period_key)
    if question_keys:
        query = query.filter(Response.question_key.in_(question_keys))
    val = query.with_entities(func.sum(Response.value_num)).scalar()
    return val or 0

def _first_value(period_key, question_key, row_key=None):
    query = Response.query.join(Submission).filter(Submission.period_key == period_key, Response.question_key == question_key)
    if row_key:
        query = query.filter(Response.row_key == row_key)
    item = query.order_by(Response.id.desc()).first()
    if not item:
        return 0
    if item.value_num is not None:
        return item.value_num
    if item.value_text:
        try:
            return float(item.value_text.replace(",", "."))
        except Exception:
            return 0
    return 0

def _avg_value(period_key, question_key):
    val = Response.query.join(Submission).filter(
        Submission.period_key == period_key,
        Response.question_key == question_key
    ).with_entities(func.avg(Response.value_num)).scalar()
    return val or 0

def _available_periods():
    periods = [p[0] for p in Submission.query.with_entities(Submission.period_key).distinct().order_by(Submission.period_key).all()]
    if periods:
        return periods
    year = datetime.today().year
    return [f"{year}-{m:02d}" for m in range(1, 13)]

def build_dashboard_snapshot(period_key):
    sent = Submission.query.filter_by(period_key=period_key, status="Enviado").count()
    total = Submission.query.filter_by(period_key=period_key).count() or 1
    periods = _available_periods()
    snapshot = {
        "period_key": period_key,
        "kpis": {
            "formularios_enviados_pct": sent / total,
            "seguidores_total": _first_value(period_key, "comunicacion_social.total_followers"),
            "visitas_web": _first_value(period_key, "comunicacion_social.visitas_totales"),
            "plantacion_ha": _first_value(period_key, "operaciones_forestales.plantacion_ha"),
            "fomento_plantadas_ha": _sum_value(period_key, ["forestal_fomento.plantadas_ha"]),
            "compras_descuento_general_pct": _first_value(period_key, "compras.descuento_general_pct") / 100 if _first_value(period_key, "compras.descuento_general_pct") else 0,
            "opex_capex_b26_ytd": _first_value(period_key, "finanzas.opex_capex_b26_ytd"),
            "cumplimiento_ambiental": _avg_value(period_key, "ambiental.compliance_pct"),
            "ssl_industrial": _first_value(period_key, "ssl_industrial.accident_rate_lost"),
            "ssl_forestal": _first_value(period_key, "ssl_forestal.accident_rate_lost"),
        }
    }
    snapshot["series"] = {
        "periods": periods,
        "seguidores": [_first_value(pk, "comunicacion_social.total_followers") for pk in periods],
        "visitas": [_first_value(pk, "comunicacion_social.visitas_totales") for pk in periods],
        "plantacion": [_first_value(pk, "operaciones_forestales.plantacion_ha") for pk in periods],
        "fomento": [_sum_value(pk, ["forestal_fomento.plantadas_ha"]) for pk in periods],
    }
    return snapshot
