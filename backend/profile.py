import eel
from .managers import ProfileManager

_profile = ProfileManager()


@eel.expose
def get_profile():
    return _profile.get()


@eel.expose
def update_profile(name, email, gender, date_of_birth,
                   height_cm, starting_weight_kg, activity_level, bio):
    return _profile.update(name, email, gender, date_of_birth,
                           height_cm, starting_weight_kg, activity_level, bio)
