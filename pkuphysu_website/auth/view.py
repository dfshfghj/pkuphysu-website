from flask import render_template, request, redirect, url_for, flash, session, Blueprint

from .utils import get_name

bp = Blueprint("auth", __name__, url_prefix="/auth")

@bp.route("/login", methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        result = get_name(username, password)
        if result["success"]:

            session['user_id'] = result["userName"]
            flash('登录成功！')
            return redirect(url_for('random_draw.invest'))
        else:
            flash('用户名或密码错误')
    return render_template('login.html')