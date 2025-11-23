from flask import Blueprint, Response, request
from pkuphysu_website.utils import respond_error, respond_success
from pkuphysu_website.auth.utils import admin_required
from .utils import wx, get_state, get_token, load_posts, update_posts
import io
import json
import os
import requests
import re
from datetime import datetime

current_dir = os.path.dirname(os.path.abspath(__file__))
state_dir=os.path.join(current_dir, "data")

bp = Blueprint("wechat", __name__, url_prefix="/wechat")
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

@bp.route("/posts")
def get_posts():
    limit = int(request.args.get("limit", 10))
    page = int(request.args.get("page", 1))
    posts = load_posts((page-1)*limit, limit)
    return respond_success(data=posts["data"], count=posts["count"])


@bp.route("/")
@admin_required
def _(current_user):
    token, session = get_token()
    if token:
        return respond_success(success=True)
    else:
        return respond_error(400, "TokenExpired", "token已失效")

@bp.route("/refresh-login")
@admin_required
def refresh_login(current_user):
    if not wx.running:
        wx.start_thread()
    
    return {"message": "start wechat engine, please wait"}, 200

@bp.route("/update-posts")
@admin_required
def update(current_user):
    begin = request.args.get("begin", 0)
    count = request.args.get("count", 10)

    posts = update_posts(begin, count)

    if posts is None:
        return respond_error(400, "TokenExpired")
    return respond_success(data=posts)

@bp.route("/cgi-bin/scanloginqrcode")
@admin_required
def get_qrcode(current_user):
    if os.path.exists(os.path.join(state_dir, "qrcode.png")):
        with open(os.path.join(state_dir, "qrcode.png"), mode="rb") as qrcode:
            qrcode_io = io.BytesIO(qrcode.read())

        return Response(
                qrcode_io.read(),
                mimetype='image/png',
                headers={
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            )
    
    else:
        return {"message": "not found"}, 404


    
@bp.route("/cgi-bin/appmsgpublish")
@admin_required
def get_msg(current_user):
    token, session = get_token()
    begin = request.args.get("begin", 0)
    count = request.args.get("count", 10)

    if not token:
        return {"message": "UnAuthorized"}, 403
    
    api_url = f"https://mp.weixin.qq.com/cgi-bin/appmsgpublish?sub=list&begin={begin}&count={count}&token={token}&lang=zh_CN&f=json"
    response = session.get(api_url, headers=headers)
    if response.ok:
        data = response.json()
        posts = []
        data = json.loads(data["publish_page"])["publish_list"]
        for item in data:
            item["publish_info"] = json.loads(item["publish_info"])
            for sub_item in item["publish_info"]["appmsg_info"]:
                post = {
                    "title": sub_item["title"],
                    "description": sub_item["digest"],
                    "mp_name": "物院学生会",
                    "url": sub_item["content_url"],
                    "publish_time": sub_item["line_info"]["send_time"]

                }
                posts.append(post)
        return posts, 200
    else:
        return {"message": "UnKnown"}, 400
    
@bp.route("/check-health")
def check():
    state = get_state()
    if not state:
        return {"expire": -1}, 400
    
    expires = [
        cookie["expires"]
        for cookie in state.get("cookies", [])
        if cookie["expires"] > 0
    ]

    return {"expire": min(expires)}, 200
