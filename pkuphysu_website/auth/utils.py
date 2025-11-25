import datetime
import random
from functools import wraps

import jwt
import requests
from flask import g, jsonify, request

from pkuphysu_website.config import settings

from .models import User

JWT_SECRET_KEY = settings.jwt.JWT_SECRET_KEY
JWT_EXPIRATION_HOURS = settings.jwt.JWT_EXPIRATION_HOURS


def generate_token(user_id):
    payload = {
        "user_id": user_id,
        "exp": datetime.datetime.utcnow()
        + datetime.timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"code": 401, "message": "缺少认证Token"}), 401

        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
            current_user_id = payload["user_id"]
            current_user = User.query.get(current_user_id)
            if not current_user:
                return jsonify({"code": 401, "message": "用户不存在"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"code": 401, "message": "Token已过期"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"code": 401, "message": "无效的Token"}), 401

        return f(current_user, *args, **kwargs)

    return decorated


def admin_required(f):
    @wraps(f)
    @token_required
    def wrapper(current_user, *args, **kwargs):
        if not current_user.is_admin:
            return jsonify({"code": 403, "message": "拒绝访问：需要管理员权限"}), 403
        return f(current_user, *args, **kwargs)

    return wrapper


def master_before_request():
    if request.method == "OPTIONS":
        return "", 204
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]

    if not token:
        return jsonify({"code": 401, "message": "缺少认证Token"}), 401

    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        current_user_id = payload["user_id"]
        current_user = User.query.get(current_user_id)
        print(current_user.username, current_user.is_admin)
        if not current_user:
            return jsonify({"code": 401, "message": "用户不存在"}), 401
        g.current_user = current_user
    except jwt.ExpiredSignatureError:
        return jsonify({"code": 401, "message": "Token已过期"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"code": 401, "message": "无效的Token"}), 401

    if not current_user.is_admin:
        return jsonify({"code": 403, "message": "拒绝访问：需要管理员权限"}), 403


def get_name(username, password):
    session = requests.Session()
    response = session.post(
        "https://iaaa.pku.edu.cn/iaaa/oauthlogin.do",
        data={
            "appid": "portal2017",
            "userName": username,
            "password": password,
            "randCode": "",
            "smsCode": "",
            "otpCode": "",
            "redirUrl": "https://portal.pku.edu.cn/portal2017/ssoLogin.do",
        },
    )
    if response.json()["success"]:
        token = response.json()["token"]
        rand = str(random.random())
        response = session.get(
            "https://portal.pku.edu.cn/portal2017/ssoLogin.do",
            params={"_rand": rand, "token": token},
        )
        response = session.post("https://portal.pku.edu.cn/portal2017/isUserLogged.do")
        return response.json()

    return {"success": False}


def get_info(token):
    session = requests.Session()
    response = session.post(
        "https://portal.pku.edu.cn/portal2017/isUserLogged.do",
        cookies={"SESSION": token},
    )
    return response.json()
