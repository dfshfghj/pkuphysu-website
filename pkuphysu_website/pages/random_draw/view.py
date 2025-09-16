from flask import render_template, request, redirect, url_for, flash, session, Blueprint, jsonify
from pkuphysu_website.config import settings
from .utils import get_participants, get_values, submit_data, get_data
from .data import PRIZE_DATA

bp = Blueprint("random_draw", __name__, url_prefix="/random_draw")


@bp.route('/invest', methods=['GET', 'POST'])
def invest():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))

    if request.method == 'POST':
        response = submit_data(user_id=session["user_id"], form=request.form)
        flash(response["message"],
              "success" if response["success"] else "error")

        return redirect(url_for("random_draw.invest"))

    values = get_values(session["user_id"])
    return render_template('invest.html', prize_data=PRIZE_DATA, username=session['user_id'], values=values, current_participants=get_participants())


@bp.route('/admin')
def choujiang():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    elif session['user_id'] not in settings.MASTER_IDS:
        return jsonify({
            "error": "Unauthorized",
            "userName": session['user_id']
        }), 401
    return render_template('admin.html', prize_data=PRIZE_DATA, username=session['user_id'])


@bp.route('/choujiang')
def random_draw():
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
    elif session['user_id'] not in settings.MASTER_IDS:
        return jsonify({
            "error": "Unauthorized",
            "userName": session['user_id']
        }), 401
    prize_type = request.args.get("prize_type")
    data = get_data(prize_type)
    print(data)
    return render_template("random_draw.html", prize_type=prize_type, data=data)
