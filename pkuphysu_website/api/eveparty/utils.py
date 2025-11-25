import json
from collections import defaultdict

from .models import CJParticipant, db

"""
def get_participants():
    cnt = db.session.query(func.count(func.distinct(CJParticipant.user_id))).scalar()
    if cnt:
        return int(cnt)
    return 0
"""


def get_user_investments(stu_id):
    investments = defaultdict(int)
    user_data = CJParticipant.query.filter_by(stu_id=stu_id).all()
    if user_data:
        investment = json.loads(user_data[0].investment)
        for i in range(len(investment)):
            investments[i] = investment[i]
    return investments


def submit_data(open_id, stu_id, name, investments):
    user = CJParticipant(
        event="eveparty",
        open_id=open_id,
        stu_id=stu_id,
        name=name,
        investment=json.dumps(investments),
    )
    db.session.merge(user)
    db.session.commit()
