from pkuphysu_website import db
from datetime import datetime

class Posts(db.Model):
    __tablename__ = "posts"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, nullable=False)
    text = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(32), nullable=False)
    timestamp = db.Column(db.Integer, nullable=False)
    reply = db.Column(db.Integer, default=0)
    likenum = db.Column(db.Integer, default=0)
    tag = db.Column(db.String(32), default='')

    @classmethod
    def insert_post(cls, user_id, text, type, tag):
        try:
            new_post = cls(
                user_id=user_id,
                text=text,
                type=type,
                timestamp=datetime.now().timestamp(),
                tag=tag
            )
            
            db.session.add(new_post)
            db.session.commit()
            return new_post
            
        except:
            db.session.rollback()
            return None
        
class Comments(db.Model):
    __tablename__ = "Comments"
    cid = db.Column(db.Integer, primary_key=True, autoincrement=True)
    pid = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, nullable=False)
    text = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.Integer, nullable=False)
    quote = db.Column(db.Integer)

    @classmethod
    def insert_comment(cls, user_id, pid, text, quote):
        try:
            post = Posts.query.filter_by(id=pid).first()
            if not post:
                print("Post not found")
                return None
            post.reply += 1

            new_comment = cls(
                user_id=user_id,
                pid=pid,
                text=text,
                quote=quote,
                timestamp=datetime.now().timestamp(),
            )
            
            db.session.add(new_comment)
            db.session.commit()
            return new_comment
            
        except Exception as e:
            print(e)
            db.session.rollback()
            return None
        
class Follow(db.Model):
    __tablename__ = "follow"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    timestamp = db.Column(db.Integer, nullable=False)

    __table_args__ = (db.UniqueConstraint('user_id', 'post_id', name='unique_user_post_follow'),)

    @classmethod
    def insert_follow(cls, user_id, post_id):
        try:
            post = Posts.query.filter_by(id=post_id).first()
            if not post:
                print("Post not found")
                return None
            post.likenum += 1

            new_follow = cls(
                user_id=user_id,
                post_id=post_id,
                timestamp=datetime.now().timestamp(),
            )
            
            db.session.add(new_follow)
            db.session.commit()
            return new_follow
            
        except:
            db.session.rollback()
            return None

    @classmethod
    def delete_follow(cls, user_id, post_id):
        try:
            post = Posts.query.filter_by(id=post_id).first()
            if not post:
                print("Post not found")
                return None
            post.likenum -= 1

            follow = cls.query.filter_by(user_id=user_id, post_id=post_id).first()
            if not follow:
                print("Follow not found")
                return None
            db.session.delete(follow)
            db.session.commit()
            return follow
            
        except:
            db.session.rollback()
            return None
        
    @classmethod
    def query_follow(cls, user_id):
        subquery = db.session.query(cls.post_id).filter(cls.user_id == user_id).subquery()
        return Posts.query.join(subquery, Posts.id == subquery.c.post_id)
        
class Articles(db.Model):
    __tablename__ = "articles"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.Text, nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.Integer, nullable=False)
    tag = db.Column(db.String(32), default='')
    author = db.Column(db.String(80), nullable=False)
    likenum = db.Column(db.Integer, default=0)
    reply = db.Column(db.Integer, default=0)

    @classmethod
    def insert_article(cls, author, title, content, tag):
        try:
            new_article = cls(
                author=author,
                title=title,
                content=content,
                timestamp=datetime.now().timestamp(),
                tag=tag
            )
            
            db.session.add(new_article)
            db.session.commit()
            return new_article
            
        except:
            db.session.rollback()
            return None
        
class Replies(db.Model):
    __tablename__ = "replies"
    rid = db.Column(db.Integer, primary_key=True, autoincrement=True)
    aid = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, nullable=False)
    text = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.Integer, nullable=False)
    quote = db.Column(db.Integer)

    @classmethod
    def insert_comment(cls, user_id, pid, text, quote):
        try:
            new_comment = cls(
                user_id=user_id,
                pid=pid,
                text=text,
                quote=quote,
                timestamp=datetime.now().timestamp(),
            )
            
            db.session.add(new_comment)
            db.session.commit()
            return new_comment
            
        except:
            db.session.rollback()
            return None