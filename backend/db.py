import json
import os

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')

_FILES = {
    'workouts':       'workouts.json',
    'exercises':      'exercises.json',
    'presets':        'presets.json',
    'food_items':     'food_items.json',
    'food_log':       'food_log.json',
    'nutrition_goal': 'nutrition_goal.json',
    'goals':          'goals.json',
    'body_metrics':   'body_metrics.json',
    'profile':        'profile.json',
}

_SINGLE = {'nutrition_goal', 'profile'}


def _path(key):
    return os.path.join(DATA_DIR, _FILES[key])


def read(key):
    path = _path(key)
    if not os.path.exists(path):
        return {} if key in _SINGLE else []
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def write(key, data):
    path = _path(key)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def next_id(data_list):
    if not data_list:
        return 1
    return max(item['id'] for item in data_list) + 1


def next_exercise_id():
    workouts = read('workouts')
    all_ids = [we['id'] for w in workouts for we in w.get('exercises', [])]
    return max(all_ids, default=0) + 1


def next_set_id():
    workouts = read('workouts')
    all_ids = [
        s['id']
        for w in workouts
        for we in w.get('exercises', [])
        for s in we.get('sets', [])
    ]
    return max(all_ids, default=0) + 1
