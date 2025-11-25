import json

from pkuphysu_website import db
from pkuphysu_website.config import settings


class CJParticipant(db.Model):
    __tablename__ = "CJParticipant"
    event = db.Column(db.String(32), default="eveparty", primary_key=True)
    open_id = db.Column(db.String(32), primary_key=True)
    name = db.Column(db.String(16), nullable=False)
    stu_id = db.Column(db.String(32), nullable=False)
    investment = db.Column(db.String(32), nullable=False)

    @classmethod
    def to_cj_json(cls):
        return {
            user.name: json.loads(user.investment)
            for user in cls.query.filter(cls.event == settings.eveparty.EVENT).all()
        }
