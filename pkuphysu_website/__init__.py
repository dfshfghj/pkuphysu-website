from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

from .config import settings

db = SQLAlchemy()


def create_app():
    app = Flask(__name__)
    app.config.update(settings.flask)

    from . import auth, dba, wechat
    from .api import blogs, eveparty, file_upload, images, portal

    app.register_blueprint(auth.bp)
    app.register_blueprint(wechat.bp)
    app.register_blueprint(images.bp)
    app.register_blueprint(dba.bp)
    app.register_blueprint(eveparty.bp)
    app.register_blueprint(portal.bp)
    app.register_blueprint(blogs.bp)
    app.register_blueprint(file_upload.bp)

    db.init_app(app)

    with app.app_context():
        db.create_all()

    CORS(app)
    return app
