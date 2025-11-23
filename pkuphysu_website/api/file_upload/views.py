import os
import uuid
from flask import Blueprint, send_from_directory, request, jsonify
from werkzeug.utils import secure_filename
from pkuphysu_website.config import settings

bp = Blueprint("file_upload", __name__,  url_prefix="/files")

base_dir = settings.share.BASE_DIR

@bp.route("/<path:filename>")
def get_file(filename):
    print(filename)
    return send_from_directory(base_dir, filename)


@bp.route("upload", methods=["POST"])
def upload_file():
    file = request.files['file']
    filename = secure_filename(file.filename)
    file_extension = file.filename.rsplit('.', 1)[1] if '.' in file.filename else ''
    unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
    file_path = os.path.join(base_dir, unique_filename)
    file.save(file_path)

    return jsonify({
        'url': f'/files/{unique_filename}',
        'ext': file_extension,
        'originalName': file.filename,
        'status': 'success',
        'size': os.path.getsize(file_path),
        'id': unique_filename
    })
