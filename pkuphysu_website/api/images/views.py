import os
from logging import getLogger

from flask import Blueprint, send_from_directory

logger = getLogger(__name__)
bp = Blueprint("images_api", __name__, url_prefix="/images")


@bp.route("/<path:filename>")
def get_image(filename):
    logger.info(f"Get image {filename}")
    return send_from_directory(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "data"), filename
    )
