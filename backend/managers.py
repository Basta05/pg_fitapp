from . import db
from datetime import datetime, date, timedelta


class BaseManager:
    """Základní třída pro správu dat — sdílené CRUD operace nad JSON soubory."""

    def __init__(self, db_key):
        self._db_key = db_key

    def get_all(self):
        return db.read(self._db_key)

    def save_all(self, items):
        db.write(self._db_key, items)

    def next_id(self):
        return db.next_id(self.get_all())

    def get_by_id(self, item_id):
        return next((i for i in self.get_all() if i['id'] == item_id), None)

    def delete_by_id(self, item_id):
        self.save_all([i for i in self.get_all() if i['id'] != item_id])
        return True


class WorkoutManager(BaseManager):
    """Správa tréninků — dědí z BaseManager."""

    def __init__(self):
        super().__init__('workouts')

    def get_sorted(self):
        return sorted(self.get_all(), key=lambda x: x['date'], reverse=True)

    def get_this_week_count(self):
        week_start = (date.today() - timedelta(days=date.today().weekday())).isoformat()
        return len([w for w in self.get_all() if w['date'] >= week_start])

    def create(self, name, date_str, notes='', workout_type='custom', duration_minutes=None):
        workouts = self.get_all()
        workout = {
            'id': db.next_id(workouts),
            'name': name,
            'date': date_str,
            'duration_minutes': duration_minutes,
            'workout_type': workout_type,
            'notes': notes,
            'created_at': datetime.now().isoformat(),
            'exercises': [],
        }
        workouts.append(workout)
        self.save_all(workouts)
        return workout

    def get_with_exercises(self, workout_id):
        workout = self.get_by_id(workout_id)
        if not workout:
            return None
        exercises = db.read('exercises')
        ex_map = {e['id']: e for e in exercises}
        for we in workout.get('exercises', []):
            we['exercise'] = ex_map.get(we['exercise_id'], {})
        return workout

    def add_exercise(self, workout_id, exercise_id):
        workouts = self.get_all()
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
        self.save_all(workouts)
        exercises = db.read('exercises')
        ex_map = {e['id']: e for e in exercises}
        we['exercise'] = ex_map.get(exercise_id, {})
        return we

    def remove_exercise(self, workout_id, we_id):
        workouts = self.get_all()
        workout = next((w for w in workouts if w['id'] == workout_id), None)
        if not workout:
            return False
        workout['exercises'] = [e for e in workout['exercises'] if e['id'] != we_id]
        self.save_all(workouts)
        return True

    def add_set(self, workout_id, we_id, reps=None, weight_kg=None, duration_seconds=None, notes=''):
        workouts = self.get_all()
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
        self.save_all(workouts)
        return new_set

    def edit_set(self, workout_id, we_id, set_id, reps=None, weight_kg=None):
        workouts = self.get_all()
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
        self.save_all(workouts)
        return s

    def delete_set(self, workout_id, we_id, set_id):
        workouts = self.get_all()
        workout = next((w for w in workouts if w['id'] == workout_id), None)
        if not workout:
            return False
        we = next((e for e in workout['exercises'] if e['id'] == we_id), None)
        if not we:
            return False
        we['sets'] = [s for s in we['sets'] if s['id'] != set_id]
        self.save_all(workouts)
        return True

    def create_from_preset(self, preset_id):
        presets = db.read('presets')
        preset = next((p for p in presets if p['id'] == preset_id), None)
        if not preset:
            return None
        workouts = self.get_all()
        exercises_list = []
        for i, ex_id in enumerate(preset.get('exercise_ids', [])):
            exercises_list.append({
                'id': db.next_exercise_id() + i,
                'exercise_id': ex_id,
                'order': i,
                'sets': [],
            })
        workout = {
            'id': db.next_id(workouts),
            'name': preset['name'],
            'date': date.today().isoformat(),
            'duration_minutes': None,
            'workout_type': 'preset',
            'notes': '',
            'created_at': datetime.now().isoformat(),
            'exercises': exercises_list,
        }
        workouts.append(workout)
        self.save_all(workouts)
        return workout


class NutritionManager(BaseManager):
    """Správa food logu — dědí z BaseManager."""

    def __init__(self):
        super().__init__('food_log')

    def get_by_date(self, date_str=None):
        logs = self.get_all()
        if date_str:
            logs = [l for l in logs if l['date'] == date_str]
        food_items = db.read('food_items')
        food_map = {f['id']: f for f in food_items}
        result = []
        for log in logs:
            item = food_map.get(log['food_item_id'], {})
            factor = log['amount_grams'] / 100
            result.append({
                **log,
                'food_name': item.get('name', ''),
                'calories': round(item.get('calories_per_100g', 0) * factor, 1),
                'protein':  round(item.get('protein_per_100g', 0) * factor, 1),
                'carbs':    round(item.get('carbs_per_100g', 0) * factor, 1),
                'fat':      round(item.get('fat_per_100g', 0) * factor, 1),
            })
        return sorted(result, key=lambda x: x['meal_type'])

    def add_entry(self, food_item_id, date_str, meal_type, amount_grams):
        logs = self.get_all()
        entry = {
            'id': db.next_id(logs),
            'food_item_id': int(food_item_id),
            'date': date_str,
            'meal_type': meal_type,
            'amount_grams': float(amount_grams),
        }
        logs.append(entry)
        self.save_all(logs)
        return entry


class GoalManager(BaseManager):
    """Správa cílů — dědí z BaseManager."""

    def __init__(self):
        super().__init__('goals')

    def add(self, goal_type, description='', target_weight_kg=None, target_date=None):
        goals = self.get_all()
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
        self.save_all(goals)
        return goal

    def complete(self, goal_id):
        goals = self.get_all()
        goal = next((g for g in goals if g['id'] == goal_id), None)
        if goal:
            goal['is_active'] = False
        self.save_all(goals)
        return True


class BodyMetricsManager(BaseManager):
    """Správa tělesných metrik — dědí z BaseManager."""

    def __init__(self):
        super().__init__('body_metrics')

    def get_sorted(self):
        return sorted(self.get_all(), key=lambda x: x['date'], reverse=True)

    def get_latest_weight(self):
        metrics = self.get_all()
        if not metrics:
            return None
        latest = sorted(metrics, key=lambda x: x['date'], reverse=True)[0]
        return latest.get('weight_kg')

    def add_or_update(self, date_str, weight_kg=None, body_fat_pct=None,
                      chest_cm=None, waist_cm=None, hips_cm=None,
                      bicep_cm=None, thigh_cm=None, notes=''):
        metrics = self.get_all()

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

        self.save_all(metrics)
        return True


class NutritionCalculator:
    """Výpočet nutričních maker z profilu, tělesných metrik a cíle."""

    _PROTEIN_PER_KG = {
        'lose_weight':       2.2,
        'gain_muscle':       1.8,
        'maintain':          1.6,
        'improve_endurance': 1.4,
        'other':             1.6,
    }
    _CALORIE_ADJUSTMENT = {
        'lose_weight':       -500,
        'gain_muscle':       +300,
        'maintain':            0,
        'improve_endurance': +100,
        'other':               0,
    }
    _FAT_RATIO = {
        'lose_weight':       0.25,
        'gain_muscle':       0.25,
        'maintain':          0.25,
        'improve_endurance': 0.20,
        'other':             0.25,
    }
    _ACTIVITY_FACTORS = {
        'sedentary':   1.2,
        'light':       1.375,
        'moderate':    1.55,
        'active':      1.725,
        'very_active': 1.9,
    }

    def __init__(self):
        self._profile_mgr = ProfileManager()
        self._metrics_mgr = BodyMetricsManager()

    def _age(self, date_of_birth):
        if not date_of_birth:
            return None
        dob = date.fromisoformat(date_of_birth)
        today = date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    def _bmr(self, weight_kg, height_cm, age, gender):
        if gender == 'male':
            return 88.362 + (13.397 * weight_kg) + (4.799 * height_cm) - (5.677 * age)
        return 447.593 + (9.247 * weight_kg) + (3.098 * height_cm) - (4.330 * age)

    def calculate(self, goal_type):
        profile = self._profile_mgr.get()
        weight_kg = self._metrics_mgr.get_latest_weight() or profile.get('starting_weight_kg')
        height_cm = profile.get('height_cm')
        age = self._age(profile.get('date_of_birth'))

        missing = []
        if not weight_kg:
            missing.append('váha (tělesné míry nebo profil)')
        if not height_cm:
            missing.append('výška (profil)')
        if age is None:
            missing.append('datum narození (profil)')
        if missing:
            return {'error': 'Chybí údaje pro výpočet: ' + ', '.join(missing)}

        tdee = self._bmr(weight_kg, height_cm, age, profile.get('gender', 'male')) \
               * self._ACTIVITY_FACTORS.get(profile.get('activity_level', 'moderate'), 1.55)

        target_kcal = round(tdee + self._CALORIE_ADJUSTMENT.get(goal_type, 0))
        protein = round(self._PROTEIN_PER_KG.get(goal_type, 1.6) * weight_kg)
        fat = round((target_kcal * self._FAT_RATIO.get(goal_type, 0.25)) / 9)
        carbs = max(0, round((target_kcal - protein * 4 - fat * 9) / 4))

        return {
            'daily_calories': target_kcal,
            'daily_protein':  protein,
            'daily_carbs':    carbs,
            'daily_fat':      fat,
        }

    def calculate_and_save(self, goal_type):
        result = self.calculate(goal_type)
        if result and 'error' not in result:
            db.write('nutrition_goal', result)
        return result


class ProfileManager:
    """Správa profilu uživatele — singleton objekt (není seznam)."""

    _DEFAULT = {
        'name': 'Uživatel',
        'email': '',
        'gender': 'male',
        'date_of_birth': None,
        'height_cm': None,
        'starting_weight_kg': None,
        'activity_level': 'moderate',
        'bio': '',
    }

    def get(self):
        profile = db.read('profile')
        if not profile:
            db.write('profile', self._DEFAULT)
            return self._DEFAULT
        return profile

    def update(self, name, email, gender, date_of_birth,
               height_cm, starting_weight_kg, activity_level, bio):
        profile = {
            'name':               name or 'Uživatel',
            'email':              email or '',
            'gender':             gender or 'male',
            'date_of_birth':      date_of_birth or None,
            'height_cm':          int(height_cm) if height_cm not in (None, '') else None,
            'starting_weight_kg': float(starting_weight_kg) if starting_weight_kg not in (None, '') else None,
            'activity_level':     activity_level or 'moderate',
            'bio':                bio or '',
        }
        db.write('profile', profile)
        return profile
