import eel
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

import backend.workouts
import backend.nutrition
import backend.goals
import backend.profile

eel.init(os.path.join(os.path.dirname(__file__), 'web'))

if __name__ == '__main__':
    try:
        eel.start('dashboard.html', size=(1280, 820), mode='chrome-app')
    except EnvironmentError:
        eel.start('dashboard.html', size=(1280, 820), mode='default')
