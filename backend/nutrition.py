import eel
from . import db
from .managers import NutritionManager

_nutrition = NutritionManager()


@eel.expose
def get_food_log(date_str=None):
    return _nutrition.get_by_date(date_str)


@eel.expose
def add_food_log(food_item_id, date_str, meal_type, amount_grams):
    return _nutrition.add_entry(food_item_id, date_str, meal_type, amount_grams)


@eel.expose
def delete_food_log(log_id):
    return _nutrition.delete_by_id(log_id)


@eel.expose
def get_food_items(query=None):
    items = db.read('food_items')
    if query:
        items = [i for i in items if query.lower() in i['name'].lower()]
    return sorted(items, key=lambda x: x['name'])


@eel.expose
def get_nutrition_goal():
    goal = db.read('nutrition_goal')
    if not goal:
        goal = {'daily_calories': 2500, 'daily_protein': 180, 'daily_carbs': 250, 'daily_fat': 70}
        db.write('nutrition_goal', goal)
    return goal


@eel.expose
def set_nutrition_goal(daily_calories, daily_protein, daily_carbs, daily_fat):
    goal = {
        'daily_calories': int(daily_calories),
        'daily_protein':  int(daily_protein),
        'daily_carbs':    int(daily_carbs),
        'daily_fat':      int(daily_fat),
    }
    db.write('nutrition_goal', goal)
    return goal


@eel.expose
def calculate_bmr(weight_kg, height_cm, age, gender):
    w, h, a = float(weight_kg), float(height_cm), int(age)
    if gender == 'male':
        bmr = 88.362 + (13.397 * w) + (4.799 * h) - (5.677 * a)
    else:
        bmr = 447.593 + (9.247 * w) + (3.098 * h) - (4.330 * a)
    return round(bmr)


@eel.expose
def calculate_tdee(bmr, activity_level):
    factors = {
        'sedentary':   1.2,
        'light':       1.375,
        'moderate':    1.55,
        'active':      1.725,
        'very_active': 1.9,
    }
    return round(int(bmr) * factors.get(activity_level, 1.55))
