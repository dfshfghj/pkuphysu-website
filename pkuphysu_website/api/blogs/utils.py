from .models import Posts, Comments
from pkuphysu_website.utils import respond_error, respond_success

def get_comments(id, page, limit):
    comments = Comments.query.filter_by(pid=id).order_by(Comments.cid.desc()).offset((page-1)*limit).limit(limit).all()

    data = [
        {
            "cid": comment.cid,
            "pid": comment.pid,
            "text": comment.text,
            "quote": comment.quote,
            "timestamp": comment.timestamp
        }
        for comment in comments
    ]

    return respond_success(data=data)

def submit_comments(user_id, pid, text, quote=None):
    result = Comments.insert_comment(user_id, pid, text, quote)

    if result:
        return respond_success(message="上传成功")
    else:
        return respond_error(400, "")
    