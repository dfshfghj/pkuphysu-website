from flask import Blueprint

from pkuphysu_website import db

from . import tasks, wechat
from .api import eveparty, sfblessing, situation_puzzle

bp = Blueprint("pkuphysu_wechat", __name__, url_prefix="/wechat_server")

bp.register_blueprint(eveparty.bp)
bp.register_blueprint(situation_puzzle.bp)
bp.register_blueprint(sfblessing.bp)
bp.register_blueprint(tasks.bp)
bp.register_blueprint(wechat.bp)

__all__ = ["bp", "db"]
