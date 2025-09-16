from flask import render_template, request, redirect, url_for, flash, session, Blueprint
from datetime import datetime
from .data import ACTIVITY_DATA, MENU_DATA

bp = Blueprint("portal", __name__)

@bp.route('/')
def portal():
    return render_template('portal.html', activities = ACTIVITY_DATA, menu=MENU_DATA)