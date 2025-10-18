from flask import Blueprint
from .utils import data_manager, news_data, activity_data, menu_data

bp = Blueprint("portal", __name__)

@bp.route('/news')
def get_news():
    return news_data(), 200

@bp.route('/activities')
def get_activities():
    return activity_data(), 200

@bp.route('/update-news')
def update_news():
    data_manager.fetch_news_data()
    return {"success": True}, 200