from datetime import datetime
from pkuphysu_website import db

class CJParticipant(db.Model):
    __tablename__ = "CJParticipant"
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Integer, nullable=False)
    tp = db.Column(db.String(20), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.now)
    user_id = db.Column(db.Integer, nullable=False)