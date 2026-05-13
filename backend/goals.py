import eel
from .managers import GoalManager, BodyMetricsManager, NutritionCalculator

_goals = GoalManager()
_metrics = BodyMetricsManager()
_calculator = NutritionCalculator()


def _active_goal_type():
    active = [g for g in _goals.get_all() if g.get('is_active')]
    if active:
        return active[-1]['goal_type']
    return 'maintain'


@eel.expose
def get_goals():
    return _goals.get_all()


@eel.expose
def add_goal(goal_type, description='', target_weight_kg=None, target_date=None):
    goal = _goals.add(goal_type, description, target_weight_kg, target_date)
    calc = _calculator.calculate_and_save(goal_type)
    goal['_macros_result'] = calc
    return goal


@eel.expose
def complete_goal(goal_id):
    return _goals.complete(goal_id)


@eel.expose
def get_body_metrics():
    return _metrics.get_sorted()


@eel.expose
def add_body_metrics(date_str, weight_kg=None, body_fat_pct=None,
                     chest_cm=None, waist_cm=None, hips_cm=None,
                     bicep_cm=None, thigh_cm=None, notes=''):
    result = _metrics.add_or_update(
        date_str, weight_kg, body_fat_pct,
        chest_cm, waist_cm, hips_cm,
        bicep_cm, thigh_cm, notes,
    )
    calc = _calculator.calculate_and_save(_active_goal_type())
    return {'saved': result, 'macros': calc}


@eel.expose
def recalculate_nutrition_goals(goal_type=None):
    if goal_type is None:
        goal_type = _active_goal_type()
    return _calculator.calculate_and_save(goal_type)
