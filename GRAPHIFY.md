# GRAPHIFY — pg_fitapp Eel Architecture Blueprint

## System Overview
Single-user desktop fitness app. Python + Eel + HTML/CSS/JS.
No authentication. Data stored as JSON files in /data/.

## Communication Pattern
```
JS (web/) ──eel.function(params)──▶ Python (backend/) ──read/write──▶ JSON (data/)
                                           │
                                     return value
                                           │
JS renders DOM ◀──────────────────────────┘
```

## Directory Structure
```
pg_app_v2/
├── GRAPHIFY.md          ← this file
├── main.py              ← Eel entry point
├── requirements_eel.txt
├── data/                ← JSON storage
│   ├── workouts.json
│   ├── exercises.json
│   ├── presets.json
│   ├── food_items.json
│   ├── food_log.json
│   ├── nutrition_goal.json
│   ├── goals.json
│   ├── body_metrics.json
│   └── profile.json
├── backend/             ← Python logic (@eel.expose functions)
│   ├── __init__.py
│   ├── db.py
│   ├── workouts.py
│   ├── nutrition.py
│   ├── goals.py
│   └── profile.py
└── web/                 ← Frontend
    ├── dashboard.html
    ├── workouts.html
    ├── workout_detail.html
    ├── exercise_catalog.html
    ├── preset_list.html
    ├── nutrition.html
    ├── food_log_add.html
    ├── calculator.html
    ├── goals.html
    ├── body_metrics.html
    ├── body_metrics_form.html
    ├── goal_form.html
    ├── profile.html
    └── assets/
        ├── style.css    ← same visual style as original Django app
        ├── app.js       ← shared utils (sidebar active state, formatDate, showAlert)
        ├── workouts.js
        ├── nutrition.js
        └── goals.js
```

---

## Data Structures

### Workout
```json
{
  "id": 1,
  "name": "Push Day",
  "date": "2024-01-15",
  "duration_minutes": null,
  "workout_type": "custom",
  "notes": "",
  "created_at": "2024-01-15T10:00:00",
  "exercises": [
    {
      "id": 1,
      "exercise_id": 3,
      "order": 0,
      "sets": [
        { "id": 1, "set_number": 1, "reps": 10, "weight_kg": 80.0, "duration_seconds": null, "notes": "" }
      ]
    }
  ]
}
```

### Exercise
```json
{ "id": 1, "name": "Bench Press", "muscle_group": "chest", "description": "...", "is_preset": true }
```

### PresetWorkout
```json
{ "id": 1, "name": "Push Day", "description": "...", "muscle_focus": "chest", "difficulty": "intermediate", "exercise_ids": [1, 2, 7, 11] }
```

### FoodItem
```json
{ "id": 1, "name": "Kuřecí prso", "calories_per_100g": 165, "protein_per_100g": 31, "carbs_per_100g": 0, "fat_per_100g": 3.6, "is_custom": false }
```

### FoodLog
```json
{ "id": 1, "food_item_id": 1, "date": "2024-01-15", "meal_type": "breakfast", "amount_grams": 200 }
```

### NutritionGoal (single object, not array)
```json
{ "daily_calories": 2500, "daily_protein": 180, "daily_carbs": 250, "daily_fat": 70 }
```

### UserGoal
```json
{ "id": 1, "goal_type": "lose_weight", "target_weight_kg": 80.0, "target_date": "2024-06-01", "description": "...", "is_active": true, "created_at": "..." }
```

### BodyMetrics
```json
{ "id": 1, "date": "2024-01-15", "weight_kg": 85.0, "body_fat_pct": 18.5, "chest_cm": 100.0, "waist_cm": 85.0, "hips_cm": 95.0, "bicep_cm": 35.0, "thigh_cm": 55.0, "notes": "" }
```

### Profile (single object, not array)
```json
{ "name": "Uživatel", "email": "", "gender": "male", "date_of_birth": null, "height_cm": null, "starting_weight_kg": null, "activity_level": "moderate", "bio": "" }
```

---

## Backend API (@eel.expose functions)

### backend/db.py
| Function | Args | Returns |
|----------|------|---------|
| read(key) | key: str | list or dict |
| write(key, data) | key, data | None |
| next_id(data_list) | list | int |
| next_exercise_id() | — | int (globally unique across all workout exercises) |
| next_set_id() | — | int (globally unique across all sets) |

### backend/workouts.py
| Function | Args | Returns |
|----------|------|---------|
| get_dashboard_stats() | — | {total_workouts, this_week, recent_workouts, latest_weight} |
| get_workouts() | — | list of workouts (sorted by date desc) |
| get_workout(workout_id) | int | workout with enriched exercise data |
| create_workout(name, date_str, notes, workout_type, duration_minutes) | — | workout |
| delete_workout(workout_id) | int | bool |
| add_exercise_to_workout(workout_id, exercise_id) | int, int | workout_exercise |
| delete_exercise_from_workout(workout_id, we_id) | int, int | bool |
| add_set(workout_id, we_id, reps, weight_kg, duration_seconds, notes) | — | set |
| edit_set(workout_id, we_id, set_id, reps, weight_kg) | — | set |
| delete_set(workout_id, we_id, set_id) | — | bool |
| get_exercises(muscle_group) | str or None | list |
| get_presets() | — | list with exercises_detail enriched |
| start_preset(preset_id) | int | new workout |

### backend/nutrition.py
| Function | Args | Returns |
|----------|------|---------|
| get_food_log(date_str) | str or None | list (enriched with food data + calculated macros) |
| add_food_log(food_item_id, date_str, meal_type, amount_grams) | — | log entry |
| delete_food_log(log_id) | int | bool |
| get_food_items(query) | str or None | list |
| get_nutrition_goal() | — | dict |
| set_nutrition_goal(daily_calories, daily_protein, daily_carbs, daily_fat) | — | dict |
| calculate_bmr(weight_kg, height_cm, age, gender) | — | int |
| calculate_tdee(bmr, activity_level) | — | int |

### backend/goals.py
| Function | Args | Returns |
|----------|------|---------|
| get_goals() | — | list |
| add_goal(goal_type, description, target_weight_kg, target_date) | — | goal |
| complete_goal(goal_id) | int | bool |
| get_body_metrics() | — | list (sorted date desc) |
| add_body_metrics(date_str, weight_kg, body_fat_pct, chest_cm, waist_cm, hips_cm, bicep_cm, thigh_cm, notes) | — | bool |

### backend/profile.py
| Function | Args | Returns |
|----------|------|---------|
| get_profile() | — | dict |
| update_profile(name, email, gender, date_of_birth, height_cm, starting_weight_kg, activity_level, bio) | — | dict |

---

## Frontend Pages

| HTML | JS | data-page | Eel calls used |
|------|----|-----------|----------------|
| dashboard.html | app.js (inline) | dashboard | get_dashboard_stats |
| workouts.html | workouts.js | workouts | get_workouts, create_workout, delete_workout |
| workout_detail.html?id=X | workouts.js | workouts | get_workout, add_exercise_to_workout, delete_exercise_from_workout, add_set, edit_set, delete_set, get_exercises |
| exercise_catalog.html | workouts.js | exercises | get_exercises |
| preset_list.html | workouts.js | presets | get_presets, start_preset |
| nutrition.html | nutrition.js | nutrition | get_food_log, delete_food_log, get_nutrition_goal, set_nutrition_goal |
| food_log_add.html | nutrition.js | nutrition | get_food_items, add_food_log |
| calculator.html | inline | calculator | calculate_bmr, calculate_tdee |
| goals.html | goals.js | goals | get_goals, complete_goal, get_body_metrics |
| body_metrics.html | goals.js | body_metrics | get_body_metrics |
| body_metrics_form.html | goals.js | body_metrics | add_body_metrics |
| goal_form.html | goals.js | goals | add_goal |
| profile.html | inline | profile | get_profile, update_profile |

---

## Navigation / Sidebar active state
`app.js` reads `window.location.pathname` filename, maps to `data-page` attribute on nav links.
Sidebar links use `data-page="dashboard"` etc. — JS adds `active` class on match.

"Nový trénink" sidebar link → `workouts.html?new=1` → JS auto-opens the modal.

## ID Generation
- Top-level: `max(item['id'] for item in list) + 1`, default 1
- Nested (workout_exercise, set): scan all workouts for max nested ID + 1

## Enumerations
- Muscle groups: chest, back, shoulders, biceps, triceps, legs, glutes, abs, cardio, full_body
- Meal types: breakfast, lunch, dinner, snack
- Goal types: lose_weight, gain_muscle, maintain, improve_endurance, other
- Activity levels: sedentary (×1.2), light (×1.375), moderate (×1.55), active (×1.725), very_active (×1.9)

## BMR Formula (Harris-Benedict)
- Male:   88.362 + (13.397 × kg) + (4.799 × cm) − (5.677 × age)
- Female: 447.593 + (9.247 × kg) + (3.098 × cm) − (4.330 × age)
- TDEE = BMR × activity_factor
