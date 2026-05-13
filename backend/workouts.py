import eel
from . import db
from .managers import WorkoutManager

_workouts = WorkoutManager()


@eel.expose
def get_dashboard_stats():
    this_week = _workouts.get_this_week_count()
    all_workouts = _workouts.get_all()
    recent = sorted(all_workouts, key=lambda x: x['date'], reverse=True)[:5]

    from .managers import BodyMetricsManager
    _metrics = BodyMetricsManager()
    latest_weight = _metrics.get_latest_weight()

    return {
        'total_workouts': len(all_workouts),
        'this_week': this_week,
        'recent_workouts': recent,
        'latest_weight': latest_weight,
    }


@eel.expose
def get_workouts():
    return _workouts.get_sorted()


@eel.expose
def get_workout(workout_id):
    return _workouts.get_with_exercises(workout_id)


@eel.expose
def create_workout(name, date_str, notes='', workout_type='custom', duration_minutes=None):
    return _workouts.create(name, date_str, notes, workout_type, duration_minutes)


@eel.expose
def delete_workout(workout_id):
    return _workouts.delete_by_id(workout_id)


@eel.expose
def add_exercise_to_workout(workout_id, exercise_id):
    return _workouts.add_exercise(workout_id, exercise_id)


@eel.expose
def delete_exercise_from_workout(workout_id, we_id):
    return _workouts.remove_exercise(workout_id, we_id)


@eel.expose
def add_set(workout_id, we_id, reps=None, weight_kg=None, duration_seconds=None, notes=''):
    return _workouts.add_set(workout_id, we_id, reps, weight_kg, duration_seconds, notes)


@eel.expose
def edit_set(workout_id, we_id, set_id, reps=None, weight_kg=None):
    return _workouts.edit_set(workout_id, we_id, set_id, reps, weight_kg)


@eel.expose
def delete_set(workout_id, we_id, set_id):
    return _workouts.delete_set(workout_id, we_id, set_id)


@eel.expose
def get_exercises(muscle_group=None):
    exercises = db.read('exercises')
    if muscle_group:
        exercises = [e for e in exercises if e['muscle_group'] == muscle_group]
    return sorted(exercises, key=lambda x: x['name'])


@eel.expose
def get_presets():
    presets = db.read('presets')
    exercises = db.read('exercises')
    ex_map = {e['id']: e for e in exercises}
    for p in presets:
        p['exercises_detail'] = [ex_map.get(eid, {}) for eid in p.get('exercise_ids', [])]
    return presets


@eel.expose
def start_preset(preset_id):
    return _workouts.create_from_preset(preset_id)
