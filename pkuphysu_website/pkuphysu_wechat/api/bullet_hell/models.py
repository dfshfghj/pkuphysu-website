from pkuphysu_website import db


class Data(db.Model):
    __tablename__ = "Data"
    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.String(32), nullable=False)

    @classmethod
    def clear(cls):  # 清空
        all_cols = cls.query.all()
        for col in all_cols:
            db.session.delete(cls.query.get(col.id))
        db.session.commit()

    @classmethod  # 加入
    def add(cls, word: str):
        col = cls(word=word)
        db.session.add(col)
        db.session.commit()
