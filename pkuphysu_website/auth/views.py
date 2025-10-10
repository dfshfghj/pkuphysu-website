from flask import send_from_directory, request, Blueprint
from pkuphysu_website.utils import respond_error, respond_success
from pkuphysu_website.config import settings
from .models import db, User
from .utils import generate_token, token_required, get_info
import jwt
import datetime
import os
import subprocess

JWT_SECRET_KEY = settings.jwt.JWT_SECRET_KEY
JWT_EXPIRATION_HOURS = settings.jwt.JWT_EXPIRATION_HOURS
current_dir = os.path.dirname(os.path.abspath(__file__))

bp = Blueprint("auth", __name__, url_prefix="/api")

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    username = data.get('username')
    password = data.get('password')

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
    
    return respond_success(message="注册成功")


@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return respond_error(400, "ExchangeNoCode", "用户名或密码不能为空")

    user = User.query.filter_by(username=username).first()

    if user is None or not user.check_password(password):
        return respond_error(401, "WrongCode", "账户或密码错误")

    return respond_success(message="登录成功", token=generate_token(user.id), username=user.username)

@bp.route('/admin/list')
def admin_list():
    admins = User.query.filter_by(is_admin=1).all()
    return respond_success(data={
        'total': len(admins),
            'admins': [
                {
                    'id': user.id,
                    'username': user.username
                }
                for user in admins
            ]
    })

@bp.route('/verify', methods=['POST'])
def verify():
    token = None
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(" ")[1]

    if not token:
        return respond_error(401, "ExchangeNoToken")

    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
        user_id = payload['user_id']
        user = User.query.get(user_id)
        if user:
            return respond_success(user=user.to_dict())
        else:
            return respond_error(401, "ExchangeNoToken")
    except jwt.ExpiredSignatureError:
        return respond_error(401, "ExchangeExpiredToken")
    except jwt.InvalidTokenError:
        return respond_error(401, "ExchangeInvalidToken")

@bp.route('/auth', methods=['POST'])
@token_required
def auth_by_token(current_user):
    token = request.json["token"]
    info = get_info(token)
    if info["success"]:
        if User.query.filter_by(realname=info['userName']).first():
            return respond_error(400, "RealNameExist", f"无法重复绑定：{info['userName']}")
        user = User.query.filter_by(username=current_user.username).first()
        user.realname = info['userName']
        user.real_id = info['userId']
        user.verified = 1
        db.session.add(user)
        db.session.commit()

        return respond_success(success=True, realname=info['userName'], real_id=info['userId'])
    else:
        return respond_error(400, "InvalidToken", "无效Token")

@bp.route('/user', methods=['GET'])
@token_required
def get_user(current_user):
    return respond_success(user={
        'id': current_user.id,
        'username': current_user.username,
        'realname': current_user.realname,
        'real_id': current_user.real_id,
        'verified': current_user.verified
    })

@bp.route('/upload-avatar', methods=['POST'])
@token_required
def upload_avatar(current_user):
    
    print(request.files)
    
    if 'file' not in request.files:
        return respond_error(400, "ExchangeNoCode", "未选择文件")

    file = request.files['file']
    name = file.filename.rsplit('.', 1)[0]
    ext = file.filename.rsplit('.', 1)[1].lower()
    if file.filename == '':
        return respond_error(400, "ExchangeNoCode", "未选择文件")

    if ext not in ["jpg", "png", "svg"]:
        return respond_error(400, "InvalidFile", "不支持的文件类型")

    filename = f"{current_user.username}.{ext}"
    final_filename = f"{current_user.username}.jpg"
    tmp_path = f"/tmp/{filename}"
    final_filepath = os.path.join(current_dir, 'avatars', final_filename)

    try:
        file.save(tmp_path)
        print(tmp_path, final_filepath)
        cmd = [
            'ffmpeg',
            '-i', tmp_path,
            '-vf', (
                "scale='min(800,iw)':min'(800,ih)':force_original_aspect_ratio=decrease,"  # 缩放保持比例
                "pad=ceil(iw/2)*2:ceil(ih/2)*2:0:0:white"                                   # 补白解决 odd width/height
            ),
            '-q:v', '10',                         # JPG 质量 (2~5 是高质量, 10+ 更小体积)
            '-f', 'image2',                     # 输出格式
            '-y',                                # 覆盖输出
            final_filepath                       # 输出路径
        ]
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=10
        )
        os.remove(tmp_path)
        if result.returncode != 0:
            error_msg = result.stderr.decode('utf-8')
            print("FFmpeg 错误:", error_msg)
            return respond_error(500, "ConvertFailed", f"图像转换失败: {error_msg[:100]}")
        avatar_url = f"/static/uploads/avatars/{final_filename}"
        return respond_success(message="头像上传成功", avatarUrl=avatar_url, timestamp=datetime.datetime.utcnow().isoformat())

    except Exception as e:
        return respond_error(500, "Failed", f"保存失败：{str(e)}")
    
@bp.route('/avatars/<username>')
def serve_avatar(username):
    print(username)
    return send_from_directory(os.path.join(current_dir, 'avatars'), f"{username}.jpg")