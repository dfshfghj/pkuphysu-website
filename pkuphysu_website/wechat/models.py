from pkuphysu_website import db
from sqlalchemy import Index

class Post(db.Model):
    __tablename__ = 'posts'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    mp_name = db.Column(db.Text, nullable=False, index=True)
    url = db.Column(db.Text, unique=True, nullable=False)
    publish_time = db.Column(db.Integer, nullable=False)

    __table_args__ = (
    Index('idx_mp_time_id_asc', mp_name, publish_time.desc(), id.asc()),
    )

    @classmethod
    def merge_posts(cls, new_posts):
        for item in new_posts:
            post = cls.query.filter_by(url=item["url"]).first()

            if not post:
                new_post = cls(
                    url=item['url'],
                    title=item['title'],
                    description=item['description'],
                    mp_name=item['mp_name'],
                    publish_time=item['publish_time'],
                )
                db.session.add(new_post)
        db.session.commit()
