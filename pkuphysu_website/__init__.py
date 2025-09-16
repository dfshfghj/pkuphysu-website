from flask_sqlalchemy import SQLAlchemy
import os
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, flash, session
import json
from .config import settings

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.update(settings.flask)

    from . import auth
    from .pages import random_draw, portal

    app.register_blueprint(auth.bp)
    app.register_blueprint(random_draw.bp)
    app.register_blueprint(portal.bp)

    db.init_app(app)

    with app.app_context():
        db.create_all()
    
    
    @app.context_processor
    def context():
        return {'now': datetime.now()}

    return app