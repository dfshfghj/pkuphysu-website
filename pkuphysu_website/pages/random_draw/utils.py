from .models import db, CJParticipant
from sqlalchemy import func
from collections import defaultdict


def get_data(prize_type):
    return {
        user.user_id: user.content
        for user in CJParticipant.query.filter_by(tp=prize_type).all()
        }
def get_participants():
    cnt = db.session.query(func.count(func.distinct(CJParticipant.user_id))).scalar()
    if cnt:
        return int(cnt)
    return 0
    
def get_values(user_id):
    values = defaultdict(int)
    user_data = CJParticipant.query.filter_by(user_id=user_id).order_by(CJParticipant.timestamp.desc()).all()
    for item in user_data:
        values[item.tp] = item.content
    return values

def submit_data(user_id, form):
    values = get_values(user_id)
    new_values = values.copy()

    if not all(value.isdecimal() for value in form.values()) or not all(int(value) >= 0 for value in form.values()):
        {"success": False, "message": "invalid data"}

    for key, value in form.items():
        new_values[key] = int(value)
    
    if sum(new_values.values()) <= 99:
        for key, value in form.items():
            old_entry = CJParticipant.query.filter_by(user_id=user_id, tp=key).first()
            if old_entry:
                old_entry.content = int(value)
            else:
                entry = CJParticipant(content=int(value), tp=key, user_id=user_id)
                db.session.add(entry)
        db.session.commit()
        return {"success": True, "message": "投点成功，在投点时间结束前可更改投点。"}
    return {"success": False, "message": "点数总和应在0-99之间！"}
