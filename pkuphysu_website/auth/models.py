from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from datetime import datetime, timedelta
from pkuphysu_website import db

bcrypt = Bcrypt()


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    realname = db.Column(db.String(80), unique=True)
    real_id = db.Column(db.String(32), unique=True)
    password_hash = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Integer)
    verified = db.Column(db.Integer)

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'is_admin': True if self.is_admin else False
        }
    
class Email(db.Model):
    __tablename__ = 'emails'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    code = db.Column(db.String(6))
    verified = db.Column(db.Boolean, nullable=False, default=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    @classmethod
    def insert_email(cls, user_id, email, code, expiry_minutes=120):
        """
        为用户插入或更新邮箱记录，生成新验证码。
        - 如果该 email 已被其他用户 verified，拒绝操作。
        - 否则，删除所有未验证的旧记录（包括其他用户的），为当前用户创建新记录。
        """
        now = datetime.utcnow()
        expiry_threshold = now - timedelta(minutes=expiry_minutes)

        # 检查是否已被其他用户 verified
        existing_verified = cls.query.filter_by(email=email, verified=True).first()
        if existing_verified and existing_verified.user_id != user_id:
            return False  # 邮箱已被别人绑定

        # 删除该 email 所有未验证的记录（防止垃圾数据）
        cls.query.filter_by(email=email).filter(
            (cls.verified == False) | (cls.timestamp < expiry_threshold)
        ).delete()

        # 检查当前用户是否已有该邮箱（理论上已被删，但保险起见）
        item = cls.query.filter_by(user_id=user_id, email=email).first()
        if item:
            # 更新验证码和时间
            item.code = code
            item.verified = False
            item.timestamp = now
        else:
            # 创建新记录
            item = cls(
                user_id=user_id,
                email=email,
                code=code,
                verified=False,
                timestamp=now
            )
            db.session.add(item)

        db.session.commit()
        return True

    @classmethod
    def verify(cls, user_id, email, code, expiry_minutes=120):
        """
        验证邮箱验证码。
        - 验证码必须匹配且未过期。
        - 验证成功后设置 verified=True，并清除 code。
        """
        now = datetime.utcnow()
        expiry_threshold = now - timedelta(minutes=expiry_minutes)

        item = cls.query.filter_by(
            user_id=user_id,
            email=email,
            verified=False
        ).first()

        if not item:
            return False

        # 检查是否过期
        if item.timestamp < expiry_threshold:
            db.session.delete(item)
            db.session.commit()
            return False

        if item.code == str(code):  # 确保类型一致
            item.verified = True
            item.code = None
            item.timestamp = now  # 可选：更新为验证时间
            db.session.commit()
            return True
        else:
            # 验证码错误，可选择保留记录或删除（这里选择保留但清除 code）
            item.code = None
            db.session.commit()
            return False

    @classmethod
    def is_verified(cls, email):
        """检查邮箱是否已被任何用户 verified"""
        return cls.query.filter_by(email=email, verified=True).first() is not None

    @classmethod
    def get_user_emails(cls, user_id):
        records = cls.query.filter_by(user_id=user_id).order_by(cls.timestamp.desc()).all()
        return [
            {
                'email': record.email,
                'verified': record.verified,
                'timestamp': record.timestamp
            }
            for record in records
        ]
            
