from datetime import datetime, timedelta
from logging import getLogger

from flask_bcrypt import Bcrypt
from sqlalchemy.orm import backref, relationship

from pkuphysu_website import db

bcrypt = Bcrypt()
logger = getLogger(__name__)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    realname = db.Column(db.String(80), unique=True)
    real_id = db.Column(db.String(32), unique=True)
    password_hash = db.Column(db.String(200), nullable=False)
    bio = db.Column(db.String(100))
    is_admin = db.Column(db.Integer)
    verified = db.Column(db.Integer)

    emails = relationship(
        "Email",
        backref=backref("user", lazy="joined"),
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    @classmethod
    def update_username(cls, old_username, new_username):
        try:
            user = cls.query.filter_by(username=old_username).first()
            user.username = new_username
            db.session.commit()
            return True
        except Exception:
            logger.exception("Database operation failed")
            db.session.rollback()
            return False

    @classmethod
    def update_bio(cls, username, bio):
        try:
            user = cls.query.filter_by(username=username).first()
            user.bio = bio
            db.session.commit()
            return True
        except Exception:
            logger.exception("Database operation failed")
            db.session.rollback()
            return False

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "is_admin": True if self.is_admin else False,
            "emails": [email.email for email in self.emails if email.verified],
        }


class Email(db.Model):
    __tablename__ = "emails"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(6))
    verified = db.Column(db.Boolean, nullable=False, default=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    @classmethod
    def insert_email(cls, user_id, email, code, expiry_minutes=120):
        now = datetime.utcnow()
        expiry_threshold = now - timedelta(minutes=expiry_minutes)

        existing_verified = cls.query.filter_by(email=email, verified=True).first()
        if existing_verified and existing_verified.user_id != user_id:
            return False

        cls.query.filter_by(email=email).filter(
            (not cls.verified) or (cls.timestamp < expiry_threshold)
        ).delete()

        item = cls.query.filter_by(user_id=user_id, email=email).first()
        if item:
            item.code = code
            item.verified = False
            item.timestamp = now
        else:
            item = cls(
                user_id=user_id, email=email, code=code, verified=False, timestamp=now
            )
            db.session.add(item)

        db.session.commit()
        return True

    @classmethod
    def verify(cls, user_id, email, code, expiry_minutes=120):
        now = datetime.utcnow()
        expiry_threshold = now - timedelta(minutes=expiry_minutes)

        item = cls.query.filter_by(user_id=user_id, email=email, verified=False).first()

        if not item:
            return False

        if item.timestamp < expiry_threshold:
            db.session.delete(item)
            db.session.commit()
            return False

        if item.code == str(code):
            item.verified = True
            item.code = None
            item.timestamp = now
            db.session.commit()
            return True
        else:
            item.code = None
            db.session.commit()
            return False

    @classmethod
    def is_verified(cls, email):
        return cls.query.filter_by(email=email, verified=True).first() is not None

    @classmethod
    def get_user_emails(cls, user_id):
        records = (
            cls.query.filter_by(user_id=user_id).order_by(cls.timestamp.desc()).all()
        )
        return [
            {
                "email": record.email,
                "verified": record.verified,
                "timestamp": record.timestamp,
            }
            for record in records
        ]
