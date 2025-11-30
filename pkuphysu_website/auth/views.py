import datetime
import os
import subprocess
from logging import getLogger

import jwt
from flask import Blueprint, request, send_from_directory

from pkuphysu_website.utils import respond_error, respond_success

from .models import Email, User, db
from .utils import JWT_SECRET_KEY, generate_token, get_info, token_required

current_dir = os.path.dirname(os.path.abspath(__file__))
logger = getLogger(__name__)
bp = Blueprint("auth", __name__)


@bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    username = data.get("username")
    password = data.get("password")

    if not all([username, password]):
        return respond_error(400, "ExchangeNoCode", "缺少必要字段")

    if len(password) < 6:
        return respond_error(400, "InvalidPassword", "密码至少6位")

    if User.query.filter_by(username=username).first():
        return respond_error(409, "ExsitedUsername", "用户名已存在")

    user = User(username=username)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    logger.info(f"User registered: {username}")
    return respond_success(message="注册成功")


@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return respond_error(400, "ExchangeNoCode", "用户名或密码不能为空")

    user = User.query.filter_by(username=username).first()

    if user is None or not user.check_password(password):
        return respond_error(401, "WrongCode", "账户或密码错误")

    logger.info(f"User logged in: {username}")
    return respond_success(
        message="登录成功", token=generate_token(user.id), username=user.username
    )


@bp.route("/users/list")
def user_list():
    users = User.query.all()
    return respond_success(
        data={
            "total": len(users),
            "users": [{"id": user.id, "username": user.username} for user in users],
        }
    )


@bp.route("/admins/list")
def admin_list():
    admins = User.query.filter_by(is_admin=1).all()
    return respond_success(
        data={
            "total": len(admins),
            "users": [{"id": user.id, "username": user.username} for user in admins],
        }
    )


@bp.route("/verify", methods=["POST"])
def verify():
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]

    if not token:
        return respond_error(401, "ExchangeNoToken")

    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        user_id = payload["user_id"]
        user = User.query.get(user_id)
        if user:
            return respond_success(user=user.to_dict())
        else:
            return respond_error(401, "ExchangeNoToken")
    except jwt.ExpiredSignatureError:
        return respond_error(401, "ExchangeExpiredToken")
    except jwt.InvalidTokenError:
        return respond_error(401, "ExchangeInvalidToken")


@bp.route("/auth", methods=["POST"])
@token_required
def auth_by_token(current_user):
    token = request.json["token"]
    info = get_info(token)
    if info["success"]:
        if User.query.filter_by(realname=info["userName"]).first():
            return respond_error(
                400, "RealNameExist", f"无法重复绑定：{info['userName']}"
            )
        user = User.query.filter_by(username=current_user.username).first()
        user.realname = info["userName"]
        user.real_id = info["userId"]
        user.verified = 1
        db.session.add(user)
        db.session.commit()

        return respond_success(
            success=True, realname=info["userName"], real_id=info["userId"]
        )
    else:
        return respond_error(400, "InvalidToken", "无效Token")


@bp.route("/user", methods=["GET"])
@token_required
def get_user(current_user):
    return respond_success(
        user={
            "id": current_user.id,
            "username": current_user.username,
            "bio": current_user.bio,
            "realname": current_user.realname,
            "real_id": current_user.real_id,
            "verified": current_user.verified,
            "is_admin": current_user.is_admin,
        }
    )


@bp.route("/user/profile", methods=["POST"])
@token_required
def update_profile(current_user):
    data = request.get_json()
    new_username = data.get("username")
    new_bio = data.get("bio")
    if new_username:
        username_success = User.update_username(current_user.username, new_username)
    else:
        username_success = True

    if new_bio:
        bio_success = User.update_bio(current_user.username, new_bio)
    else:
        bio_success = True

    if username_success and bio_success:
        return respond_success(message="更新成功")
    else:
        return respond_error(
            400,
            f"{'用户名不合法' if not username_success else ''}  {'简介不合法' if not bio_success else ''}",
        )


@bp.route("/upload-avatar", methods=["POST"])
@token_required
def upload_avatar(current_user):
    if "file" not in request.files:
        return respond_error(400, "ExchangeNoCode", "未选择文件")

    file = request.files["file"]
    ext = file.filename.rsplit(".", 1)[1].lower()
    if file.filename == "":
        return respond_error(400, "ExchangeNoCode", "未选择文件")

    if ext not in ["jpg", "png", "svg"]:
        return respond_error(400, "InvalidFile", "不支持的文件类型")

    filename = f"{current_user.username}.{ext}"
    final_filename = f"{current_user.username}.jpg"
    tmp_path = f"/tmp/{filename}"
    final_filepath = os.path.join(current_dir, "avatars", final_filename)

    try:
        file.save(tmp_path)
        cmd = [
            "ffmpeg",
            "-i",
            tmp_path,
            "-vf",
            (
                "scale='min(800,iw)':min'(800,ih)':force_original_aspect_ratio=decrease,"
                "pad=ceil(iw/2)*2:ceil(ih/2)*2:0:0:white"
            ),
            "-q:v",
            "10",
            "-f",
            "image2",
            "-y",
            final_filepath,
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=10)
        os.remove(tmp_path)
        if result.returncode != 0:
            error_msg = result.stderr.decode("utf-8")
            logger.error(f"Convert avatar failed: {error_msg}")
            return respond_error(
                500, "ConvertFailed", f"图像转换失败: {error_msg[:100]}"
            )
        avatar_url = f"/static/uploads/avatars/{final_filename}"
        logger.info(f"User {current_user.username} uploaded a new avatar")
        return respond_success(
            message="头像上传成功",
            avatarUrl=avatar_url,
            timestamp=datetime.datetime.utcnow().isoformat(),
        )

    except Exception as e:
        logger.error(f"Failed to save avatar: {str(e)}")
        return respond_error(500, "Failed", f"保存失败：{str(e)}")


@bp.route("/avatars/<username>")
def serve_avatar(username):
    avatar_path = os.path.join(current_dir, "avatars")
    if not os.path.exists(os.path.join(avatar_path, f"{username}.jpg")):
        from identicons import generate, save

        icon = generate(username)
        save(icon, os.path.join(avatar_path, f"{username}.jpg"), 500, 500)
    return send_from_directory(avatar_path, f"{username}.jpg")


@bp.route("/verify_email", methods=["GET", "POST"])
@token_required
def send_verify(current_user):
    if request.method == "GET":
        import random
        import re

        from pkuphysu_website.email import send_email

        email = request.args.get("email")
        if not re.match(r"^[a-zA-Z0-9._%+-]+@(?:stu\.)?pku\.edu\.cn$", email):
            return respond_error(400, "InvalidEmail", "邮箱无效, 请使用北京大学邮箱")
        code = random.randint(100000, 999999)
        Email.insert_email(current_user.id, email, str(code))
        send_email(email, "验证码", f"您正在使用邮箱注册。\n 您的验证码是：{code}")
        return respond_success(message="验证码已发送")
    elif request.method == "POST":
        code = request.args.get("code")
        email = request.args.get("email")
        if Email.verify(current_user.id, email, code):
            return respond_success(message="验证成功")
        else:
            return respond_error(400, "InvalidCode", "验证码错误")
