from logging import getLogger

from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.exceptions import HTTPException

from .config import settings
from .utils import CustomQuery, respond_error

db = SQLAlchemy(query_class=CustomQuery)


def create_app():
    app = Flask(__name__)
    logger = getLogger(__name__)
    logger.info(f"APP CONFIG : {settings.flask}")
    app.config.update(settings.flask)

    from . import auth, dba, pkuphysu_wechat, wechat
    from .api import blogs, eveparty, file_upload, images, portal

    app.register_blueprint(auth.bp)
    app.register_blueprint(wechat.bp)
    app.register_blueprint(images.bp)
    app.register_blueprint(dba.bp)
    app.register_blueprint(eveparty.bp)
    app.register_blueprint(portal.bp)
    app.register_blueprint(blogs.bp)
    app.register_blueprint(file_upload.bp)
    app.register_blueprint(pkuphysu_wechat.bp)

    app.register_error_handler(
        HTTPException, lambda e: respond_error(e.code, "GeneralError", e.description)
    )

    db.init_app(app)

    with app.app_context():
        db.create_all()

    CORS(app)
    return app
