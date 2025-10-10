from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask import Flask
from flask_cors import CORS
from .config import settings

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.update(settings.flask)

    from . import auth, dba
    from .api import eveparty, portal, images

    app.register_blueprint(auth.bp)
    app.register_blueprint(images.bp)
    app.register_blueprint(dba.bp)
    app.register_blueprint(eveparty.bp)
    app.register_blueprint(portal.bp)

    db.init_app(app)

    with app.app_context():
        db.create_all()
    
    
    @app.context_processor
    def context():
        return {'now': datetime.now()}
    CORS(app)
    return app