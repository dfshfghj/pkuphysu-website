from logging import getLogger

from flask import Blueprint, request
from werobot.contrib.flask import make_view

from . import commands, fallback, handlers  # noqa
from .core import wechat_client, wechat_command_reg, wechat_mgr, wechat_robot
from .utils import master

logger = getLogger(__name__)
bp = Blueprint("wechat", __name__)
__all__ = [
    "bp",
    "master",
    "wechat_robot",
    "wechat_mgr",
    "wechat_client",
    "wechat_command_reg",
]


bp.add_url_rule(
    rule="/wechat",
    endpoint="wechat",
    view_func=make_view(wechat_robot),
    methods=["GET", "POST"],
)


@bp.route("/dev", methods=["GET"])
def dev():
    import requests

    appid = request.args.get("appid")
    secret = request.args.get("secret")
    response = requests.get(
        f"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={appid}&secret={secret}"
    )
    try:
        return response.json()
    except Exception:
        logger.exception("Failed to get token")
        return {}
