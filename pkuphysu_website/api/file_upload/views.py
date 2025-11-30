import os
import uuid
from logging import getLogger

from flask import Blueprint, jsonify, request, send_from_directory

from pkuphysu_website.config import settings

logger = getLogger(__name__)
bp = Blueprint("file_upload", __name__, url_prefix="/files")

base_dir = settings.share.BASE_DIR


@bp.route("/<path:filename>")
def get_file(filename):
    logger.info(f"Get file {filename}")
    return send_from_directory(base_dir, filename)


@bp.route("upload", methods=["POST"])
def upload_file():
    file = request.files["file"]
    file_extension = file.filename.rsplit(".", 1)[1] if "." in file.filename else ""
    unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
    file_path = os.path.join(base_dir, unique_filename)
    file.save(file_path)
    logger.info(f"Upload file {file.filename}, saved to {file_path}")

    return jsonify(
        {
            "url": f"/files/{unique_filename}",
            "ext": file_extension,
            "originalName": file.filename,
            "status": "success",
            "size": os.path.getsize(file_path),
            "id": unique_filename,
        }
    )
