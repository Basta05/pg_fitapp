import eel
from datetime import datetime, date, timedelta
from . import db


@eel.expose
def get_dashboard_stats():
    workouts = db.read('workouts')
    week_start = (date.today() - timedelta(days=date.today().weekday())).isoformat()

    total = len(workouts)
    this_week = len([w for w in workouts if w['date'] >= week_start])
    recent = sorted(workouts, key=lambda x: x['date'], reverse=True)[:5]

    metrics = db.read('body_metrics')
    latest_weight = None
    if metrics:
        latest = sorted(metrics, key=lambda x: x['date'], reverse=True)[0]
        latest_weight = latest.get('weight_kg')

    return {
        'total_workouts': total,
        'this_week': this_week,
        'recent_workouts': recent,
        'latest_weight': latest_weight,
    }


@eel.expose
def get_workouts():
    return sorted(db.read('workouts'), key=lambda x: x['date'], reverse=True)


@eel.expose
def get_workout(workout_id):
    workouts = db.read('workouts')
    workout = next((w for w in workouts if w['id'] == workout_id), None)
    if not workout:
        return None
    exercises = db.read('exercises')
    ex_map = {e['id']: e for e in exercises}
    for we in workout.get('exercises', []):
        we['exercise'] = ex_map.get(we['exercise_id'], {})
    return workout


@eel.expose
def create_workout(name, date_str, notes='', workout_type='custom', duration_minutes=None):
    workouts = db.read('workouts')
    new_id = db.next_id(workouts)
    workout = {
        'id': new_id,
        'name': name,
        'date': date_str,
        'duration_minutes': duration_minutes,
        'workout_type': workout_type,
        'notes': notes,
        'created_at': datetime.now().isoformat(),
        'exercises': [],
    }
    workouts.append(workout)
    db.write('workouts', workouts)
    return workout


@eel.expose
def delete_workout(workout_id):
    workouts = db.read('workouts')
    db.write('workouts', [w for w in workouts if w['id'] != workout_id])
    return True


@eel.expose
def add_exercise_to_workout(workout_id, exercise_id):
    workouts = db.read('workouts')
    workout = next((w for w in workouts if w['id'] == workout_id), None)
    if not workout:
        return None
    we = {
        'id': db.next_exercise_id(),
        'exercise_id': exercise_id,
        'order': len(workout['exercises']),
        'sets': [],
    }
    workout['exercises'].append(we)
    db.write('workouts', workouts)
    exercises = db.read('exercises')
    ex_map = {e['id']: e for e in exercises}
    we['exercise'] = ex_map.get(exercise_id, {})
    return we


@eel.expose
def delete_exercise_from_workout(workout_id, we_id):
    workouts = db.read('workouts')
    workout = next((w for w in workouts if w['id'] == workout_id), None)
    if not workout:
        return False
    workout['exercises'] = [e for e in workout['exercises'] if e['id'] != we_id]
    db.write('workouts', workouts)
    return True


@eel.expose
def add_set(workout_id, we_id, reps=None, weight_kg=None, duration_seconds=None, notes=''):
    workouts = db.read('workouts')
    workout = next((w for w in workouts if w['id'] == workout_id), None)
    if not workout:
        return None
    we = next((e for e in workout['exercises'] if e['id'] == we_id), None)
    if not we:
        return None
    new_set = {
        'id': db.next_set_id(),
        'set_number': len(we['sets']) + 1,
        'reps': int(reps) if reps not in (None, '') else None,
        'weight_kg': float(weight_kg) if weight_kg not in (None, '') else None,
        'duration_seconds': duration_seconds,
        'notes': notes or '',
    }
    we['sets'].append(new_set)
    db.write('workouts', workouts)
    return new_set


@eel.expose
def edit_set(workout_id, we_id, set_id, reps=None, weight_kg=None):
    workouts = db.read('workouts')
    workout = next((w for w in workouts if w['id'] == workout_id), None)
    if not workout:
        return None
    we = next((e for e in workout['exercises'] if e['id'] == we_id), None)
    if not we:
        return None
    s = next((s for s in we['sets'] if s['id'] == set_id), None)
    if not s:
        return None
    if reps not in (None, ''):
        s['reps'] = int(reps)
    if weight_kg not in (None, ''):
        s['weight_kg'] = float(weight_kg)
    db.write('workouts', workouts)
    return s


@eel.expose
def delete_set(workout_id, we_id, set_id):
    workouts = db.read('workouts')
    workout = next((w for w in workouts if w['id'] == workout_id), None)
    if not workout:
        return False
    we = next((e for e in workout['exercises'] if e['id'] == we_id), None)
    if not we:
        return False
    we['sets'] = [s for s in we['sets'] if s['id'] != set_id]
    db.write('workouts', workouts)
    return True


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
    presets = db.read('presets')
    preset = next((p for p in presets if p['id'] == preset_id), None)
    if not preset:
        return None
    workouts = db.read('workouts')
    new_id = db.next_id(workouts)
    exercises_list = []
    for i, ex_id in enumerate(preset.get('exercise_ids', [])):
        exercises_list.append({
            'id': db.next_exercise_id() + i,
            'exercise_id': ex_id,
            'order': i,
            'sets': [],
        })
    workout = {
        'id': new_id,
        'name': preset['name'],
        'date': date.today().isoformat(),
        'duration_minutes': None,
        'workout_type': 'preset',
        'notes': '',
        'created_at': datetime.now().isoformat(),
        'exercises': exercises_list,
    }
    workouts.append(workout)
    db.write('workouts', workouts)
    return workout
