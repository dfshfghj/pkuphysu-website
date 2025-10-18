from flask import request, Blueprint
from pkuphysu_website.auth.utils import token_required, admin_required
from pkuphysu_website.utils import respond_error, respond_success
from .models import CJParticipant
from .utils import get_user_investments, submit_data
from .data import PRIZE_DATA


bp = Blueprint("random_draw", __name__, url_prefix="/random_draw")

@bp.route('/config', methods=["POST"])
@token_required
def get_config(current_user):
    investment = get_user_investments(current_user.real_id)
    prizes = PRIZE_DATA
    for i in range(len(prizes)):
        prizes[i]["investment"] = investment[i]
    return respond_success(prizes=prizes)

@bp.route('/invest', methods=["POST"])
@token_required
def invest(current_user):
    if not current_user.realname:
        return respond_error(400, "Unauth", "未关联姓名")
    
    name = current_user.realname
    open_id = current_user.id
    stu_id = current_user.real_id
    prize_names = [prize['name'] for prize in PRIZE_DATA]
    data = request.get_json()
    try:
        investments = [data[prize_name] for prize_name in prize_names]
        if len(investments) != len(prize_names):
            return respond_error(400, "NotMatch")
        
        if not all(isinstance(n, int) for n in investments):
            return respond_error(400, "NotNumbers")
        
        if not all(value >= 0 for value in investments):
            return respond_error(400, "Invalid")
        
        if (sum(investments) < 0) or (sum(investments) > 99):
            return respond_error(400, "OutofRange")
        
        submit_data(open_id, stu_id, name, investments)
        return respond_success()
    
    except Exception as e:
        return respond_error(500, "Unexpected", f'{str(e)}')
    
@bp.route("/cj_json")
@admin_required
def get_cj_json(current_user):
    return respond_success(data=CJParticipant.to_cj_json())