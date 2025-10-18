import os
from flask import Blueprint, send_from_directory

bp = Blueprint("images_api", __name__,  url_prefix="/images")

@bp.route("/<path:filename>")
def get_image(filename):
    print(filename)
    return send_from_directory(os.path.join(os.path.dirname(os.path.abspath(__file__)), "data"), filename)