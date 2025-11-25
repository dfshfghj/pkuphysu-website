from logging import getLogger

from werobot.messages.messages import TextMessage

from pkuphysu_website.pkuphysu_wechat.wechat.core import wechat_mgr

from .models import Data

logger = getLogger(__name__)
wechat_mgr.command_reg.mark_default_closed("bullet_hell")


@wechat_mgr.command(keywords=["弹幕", "bullet hell"], groups=["bullet_hell"])
def get(payload: str, message: TextMessage):
    """
    输入“弹幕 你想输入的内容”来互动吧
    """
    word = payload
    if len(word) > 11:
        return "字数太多啦"
    Data.add(word)
    return "输入成功，快看大屏幕吧"
