from collections import defaultdict
from ..models import Question, OptionItem

GROUP_OPTION_MAP = {
    ("talento_humano", "th_area"): "areas_paracel",
    ("ambiental", "ambiental"): "contractors",
    ("finanzas", "fin_tierras"): "land_states",
    ("comunicacion_social", "social_programas"): "social_programs",
    ("forestal_fomento", "fomento_proveedores"): "fomento_proveedores",
}

def get_area_layout(area_code):
    questions = Question.query.filter_by(area_code=area_code, is_active=True).order_by(Question.section, Question.order_n).all()
    layout = defaultdict(lambda: defaultdict(list))
    for q in questions:
        layout[q.section][q.group_key].append(q)

    result = []
    for section, groups in layout.items():
        section_dict = {"section": section, "groups": []}
        for group_key, items in groups.items():
            list_code = items[0].list_code if items and items[0].list_code else GROUP_OPTION_MAP.get((area_code, group_key))
            rows = []
            options = []
            repeated = False
            if list_code:
                list_items = OptionItem.query.filter_by(list_code=list_code, is_active=True).order_by(OptionItem.sort_order, OptionItem.value_label).all()
                repeated = group_key in ("th_area", "ambiental", "fin_tierras", "social_programas", "fomento_proveedores")
                if repeated:
                    rows = list_items
                else:
                    options = list_items
            section_dict["groups"].append({
                "group_key": group_key,
                "questions": items,
                "rows": rows,
                "options": options,
                "repeated": repeated,
                "list_code": list_code,
                "user_can_manage_options": any(q.user_can_manage_options for q in items),
            })
        result.append(section_dict)
    return result

def get_option_items(list_code):
    return OptionItem.query.filter_by(list_code=list_code, is_active=True).order_by(OptionItem.sort_order, OptionItem.value_label).all()

def get_manageable_lists(area_code):
    items = Question.query.filter(
        Question.area_code == area_code,
        Question.is_active == True,
        Question.list_code.isnot(None),
        Question.user_can_manage_options == True
    ).all()
    seen = {}
    for q in items:
        seen[q.list_code] = q.group_key
    result = []
    for list_code, group_key in seen.items():
        option_count = OptionItem.query.filter_by(list_code=list_code, is_active=True).count()
        result.append({"list_code": list_code, "group_key": group_key, "count": option_count})
    return sorted(result, key=lambda x: x["list_code"])
