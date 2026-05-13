import eel
from datetime import datetime
from . import db


@eel.expose
def get_goals():
    return db.read('goals')


@eel.expose
def add_goal(goal_type, description='', target_weight_kg=None, target_date=None):
    goals = db.read('goals')
    goal = {
        'id': db.next_id(goals),
        'goal_type': goal_type,
        'target_weight_kg': float(target_weight_kg) if target_weight_kg not in (None, '') else None,
        'target_date': target_date or None,
        'description': description,
        'is_active': True,
        'created_at': datetime.now().isoformat(),
    }
    goals.append(goal)
    db.write('goals', goals)
    return goal


@eel.expose
def complete_goal(goal_id):
    goals = db.read('goals')
    goal = next((g for g in goals if g['id'] == goal_id), None)
    if goal:
        goal['is_active'] = False
    db.write('goals', goals)
    return True


@eel.expose
def get_body_metrics():
    return sorted(db.read('body_metrics'), key=lambda x: x['date'], reverse=True)


@eel.expose
def add_body_metrics(date_str, weight_kg=None, body_fat_pct=None,
                     chest_cm=None, waist_cm=None, hips_cm=None,
                     bicep_cm=None, thigh_cm=None, notes=''):
    metrics = db.read('body_metrics')

    def _f(v):
        try:
            return float(v) if v not in (None, '') else None
        except (ValueError, TypeError):
            return None

    data = {
        'date':         date_str,
        'weight_kg':    _f(weight_kg),
        'body_fat_pct': _f(body_fat_pct),
        'chest_cm':     _f(chest_cm),
        'waist_cm':     _f(waist_cm),
        'hips_cm':      _f(hips_cm),
        'bicep_cm':     _f(bicep_cm),
        'thigh_cm':     _f(thigh_cm),
        'notes':        notes or '',
    }

    existing = next((m for m in metrics if m['date'] == date_str), None)
    if existing:
        existing.update(data)
    else:
        data['id'] = db.next_id(metrics)
        metrics.append(data)

    db.write('body_metrics', metrics)
    return True
