import eel
from . import db


@eel.expose
def get_profile():
    profile = db.read('profile')
    if not profile:
        profile = {
            'name': 'Uživatel',
            'email': '',
            'gender': 'male',
            'date_of_birth': None,
            'height_cm': None,
            'starting_weight_kg': None,
            'activity_level': 'moderate',
            'bio': '',
        }
        db.write('profile', profile)
    return profile


@eel.expose
def update_profile(name, email, gender, date_of_birth,
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
