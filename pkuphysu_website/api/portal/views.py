from flask import Blueprint, request
from .data import NEWS_DATA, ACTIVITY_DATA, MENU_DATA, POSTS_DATA

bp = Blueprint("portal", __name__, url_prefix='/api')

@bp.route('/news')
def get_news():
    return NEWS_DATA, 200

@bp.route('/activities')
def get_activities():
    return ACTIVITY_DATA, 200

@bp.route('/posts')
def get_posts():
    limit = int(request.args.get("limit", 10))
    page = int(request.args.get("page", 1))
    return {
        "data": POSTS_DATA[(page-1)*limit:page*limit],
        "total": len(POSTS_DATA)
    }, 200