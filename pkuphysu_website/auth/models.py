from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
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