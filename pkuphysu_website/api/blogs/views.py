from flask import Blueprint, request
from sqlalchemy.orm import joinedload

from pkuphysu_website.auth.utils import token_required
from pkuphysu_website.utils import respond_error, respond_success

from .data import TAG_DATA
from .models import Articles, Comments, Follow, Posts

bp = Blueprint("blogs", __name__, url_prefix="/blogs")


@bp.route("/tags")
def get_tags():
    return respond_success(data=TAG_DATA)


@bp.route("/articles/<path:id>")
def get_article(id):
    article = Articles.query.filter_by(id=id).first()
    if article:
        return respond_success(
            data={
                "id": article.id,
                "title": article.title,
                "author": article.author,
                "content": article.content,
                "timestamp": article.timestamp,
                "likenum": article.likenum,
                "reply": article.reply,
            }
        )
    else:
        return respond_error(404, "NotFound", "查找的文章不存在")


@bp.route("/posts")
@token_required
def get_posts(current_user):
    limit = int(request.args["limit"])
    page = int(request.args.get("page", 1))
    begin = request.args.get("begin")
    tag = request.args.get("tag", "")
    pid = request.args.get("pid", "")
    keyword = request.args.get("keyword", "").strip()

    if pid:
        posts = Posts.query.options(joinedload(Posts.user)).filter_by(id=pid).all()

    else:
        query = Posts.query.options(joinedload(Posts.user)).order_by(Posts.id.desc())
        if tag:
            query = query.filter_by(tag=tag)
        if keyword:
            query = query.filter(Posts.text.op('&@~')(keyword))
        if begin:
            begin = int(begin)
            query = query.filter(Posts.id < begin)
        else:
            query = query.offset((page - 1) * limit)

        posts = query.limit(limit).all()

    followed_post_ids = {
        pf.post_id
        for pf in Follow.query.filter(
            Follow.user_id == current_user.id, Follow.post_id.in_([p.id for p in posts])
        ).all()
    }

    data = [
        {
            "id": post.id,
            "text": post.text,
            "type": post.type,
            "timestamp": post.timestamp,
            "likenum": post.likenum,
            "reply": post.reply,
            "tag": post.tag,
            "is_follow": 1 if post.id in followed_post_ids else 0,
            "username": post.user.username
        }
        for post in posts
    ]

    return respond_success(data=data)


@bp.route("/follow/<path:id>", methods=["POST"])
@token_required
def follow(current_user, id):
    if Follow.query.filter_by(user_id=current_user.id, post_id=id).first():
        result = Follow.delete_follow(current_user.id, id)
        if result:
            return respond_success(message="取消关注成功")
    else:
        result = Follow.insert_follow(current_user.id, id)
        if result:
            return respond_success(message="关注成功")
    return respond_error(400, "")


@bp.route("/follow")
@token_required
def get_follows(current_user):
    limit = int(request.args["limit"])
    page = int(request.args.get("page", 1))
    begin = request.args.get("begin")

    query = Follow.query_follow(current_user.id).order_by(Posts.id.desc()).options(joinedload(Posts.user))
    if begin:
        begin = int(begin)
        query = query.filter(Posts.id < begin)
    else:
        query = query.offset((page - 1) * limit)

    posts = query.limit(limit).all()

    data = [
        {
            "id": post.id,
            "text": post.text,
            "type": post.type,
            "timestamp": post.timestamp,
            "likenum": post.likenum,
            "reply": post.reply,
            "tag": post.tag,
            "is_follow": 1,
            "username": post.user.username
        }
        for post in posts
    ]

    return respond_success(data=data)


@bp.route("/articles")
def get_articles():
    limit = int(request.args["limit"])
    page = int(request.args.get("page", 1))
    begin = request.args.get("begin")

    query = Articles.query.order_by(Articles.id.desc())
    if begin:
        begin = int(begin)
        query = query.filter(Articles.id < begin)
    else:
        query = query.offset((page - 1) * limit)

    articles = query.limit(limit).all()

    data = [
        {
            "id": article.id,
            "title": article.title,
            "author": article.author,
            "content": article.content,
            "timestamp": article.timestamp,
            "likenum": article.likenum,
            "reply": article.reply,
        }
        for article in articles
    ]

    return respond_success(data=data)


@bp.route("/comments/<path:id>")
@token_required
def get_comments(current_user, id):
    limit = int(request.args["limit"])
    sort = request.args.get("sort", "asc")
    page = int(request.args.get("page", 1))
    begin = request.args.get("begin")

    query = Comments.query.options(joinedload(Comments.user)).options(joinedload(Comments.quoted_comment)).filter_by(pid=id)

    order_func = Comments.cid.desc() if sort == "desc" else Comments.cid.asc()
    query = query.order_by(order_func)

    if begin:
        begin = int(begin)
        filter_condition = (
            Comments.cid < begin if sort == "desc" else Comments.cid > begin
        )
        query = query.filter(filter_condition)
    else:
        query = query.offset((page - 1) * limit)

    comments = query.limit(limit).all()

    data = [
        {
            "cid": comment.cid,
            "pid": comment.pid,
            "text": comment.text,
            "quote": {
                "cid": comment.quoted_comment.cid,
                "username": comment.quoted_comment.user.username,
                "text": comment.quoted_comment.text,
                } if comment.quoted_comment else None,
            "timestamp": comment.timestamp,
            "username": comment.user.username
        }
        for comment in comments
    ]

    return respond_success(data=data)


@bp.route("/comments", methods=["POST"])
@token_required
def submit_comments(current_user):
    data = request.get_json()
    result = Comments.insert_comment(
        current_user.id, data["pid"], data["text"], data["quote"]
    )
    if result:
        return respond_success(message="上传成功")
    else:
        return respond_error(400, "")


@bp.route("/submit", methods=["POST"])
@token_required
def submit(current_user):
    data = request.get_json()
    result = Posts.insert_post(current_user.id, data["text"], data["type"], data["tag"])
    if result:
        return respond_success(message="上传成功")
    else:
        return respond_error(400, "")


@bp.route("/submit/article", methods=["POST"])
@token_required
def submit_article(current_user):
    data = request.get_json()
    result = Articles.insert_article(
        current_user.username, data["title"], data["content"], data["tag"]
    )
    if result:
        return respond_success(message="上传成功")
    else:
        return respond_error(400, "")
