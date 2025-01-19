from fastapi import UploadFile, HTTPException
from pathlib import Path
from datetime import datetime
import os
from typing import List, Optional
from app.models.profile import EducationMedia, PositionMedia, CertificationMedia, ProjectMedia

UPLOAD_DIR = Path("static/profile_images")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
BASE_URL = "http://127.0.0.1:9001"


def save_image(file: UploadFile, image_type: str):
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No valid file provided.")

    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    filename = f"{image_type}_{timestamp}_{file.filename}"
    file_path = UPLOAD_DIR / filename

    try:
        with file_path.open("wb") as f:
            for chunk in file.file:
                f.write(chunk)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving image: {str(e)}")

    image_url = f"profile_images/{filename}"
    return image_url


def handle_image_update(
    db, user_profile, image_field: str, new_image: UploadFile = None, folder: str = "default"
):
    old_image_path = getattr(user_profile, image_field, None)

    if new_image and new_image.filename:
        image_path = save_image(new_image, folder)

        if old_image_path:
            remove_saved_image(old_image_path)

        setattr(user_profile, image_field, image_path)
        return image_path
    else:
        if old_image_path:
            remove_saved_image(old_image_path)
        setattr(user_profile, image_field, None)
        return None


def remove_saved_image(image_path: str):
    full_path = UPLOAD_DIR / Path(image_path).name
    if full_path.exists():
        full_path.unlink()


BASE_MEDIA_DIR = Path("static/education_media")

def save_education_media(file, education_id: int, media_data: Optional[dict] = None):
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    filename = f"{education_id}_{timestamp}_{file.filename}"
    file_path = BASE_MEDIA_DIR / filename
    file_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        with file_path.open("wb") as f:
            f.write(file.file.read())
    except Exception as e:
        raise Exception(f"Error saving file: {e}")

    normalized_file_url = str(file_path).replace("\\", "/") 

    file_url = normalized_file_url.replace(str(BASE_MEDIA_DIR), "/static/education_media")

    title = media_data.get("title", file.filename) if media_data else file.filename
    description = media_data.get("description", None) if media_data else None
    order = media_data.get("order", 0) if media_data else 0
    media = EducationMedia(
        education_id=education_id,
        title=title,
        description=description,
        file_url=file_url,
        order=order
    )

    return media


BASE_MEDIA_DIR = Path("static/position_media")

def save_position_media(file, position_id: int, media_data: Optional[dict] = None):
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    filename = f"{position_id}_{timestamp}_{file.filename}"
    file_path = BASE_MEDIA_DIR / filename
    file_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        with file_path.open("wb") as f:
            f.write(file.file.read())
    except Exception as e:
        raise Exception(f"Error saving file: {e}")

    normalized_file_url = str(file_path).replace("\\", "/") 

    file_url = normalized_file_url.replace(str(BASE_MEDIA_DIR), "/static/position_media")

    title = media_data.get("title", file.filename) if media_data else file.filename
    description = media_data.get("description", None) if media_data else None
    order = media_data.get("order", 0) if media_data else 0
    media = PositionMedia(
        position_id=position_id,
        title=title,
        description=description,
        file_url=file_url,
        order=order
    )

    return media

BASE_MEDIA_DIR = Path("static/certification_media")

def save_certification_media(file, certification_id: int, media_data: Optional[dict] = None):
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    filename = f"{certification_id}_{timestamp}_{file.filename}"
    file_path = BASE_MEDIA_DIR / filename
    file_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        with file_path.open("wb") as f:
            f.write(file.file.read())
    except Exception as e:
        raise Exception(f"Error saving file: {e}")
    normalized_file_url = str(file_path).replace("\\", "/")
    file_url = normalized_file_url.replace(str(BASE_MEDIA_DIR), "/static/certification_media")
    title = media_data.get("title", file.filename) if media_data else file.filename
    description = media_data.get("description", None) if media_data else None
    order = media_data.get("order", 0) if media_data else 0
    media = CertificationMedia(
        certification_id=certification_id,
        title=title,
        description=description,
        file_url=file_url,
        order=order
    )

    return media

BASE_MEDIA_DIR = Path("static/project_media")

def save_project_media(file, project_id: int, media_data: Optional[dict] = None):
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    filename = f"{project_id}_{timestamp}_{file.filename}"
    file_path = BASE_MEDIA_DIR / filename
    file_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        with file_path.open("wb") as f:
            f.write(file.file.read())
    except Exception as e:
        raise Exception(f"Error saving file: {e}")
    normalized_file_url = str(file_path).replace("\\", "/")
    file_url = normalized_file_url.replace(str(BASE_MEDIA_DIR), "/static/project_media")
    title = media_data.get("title", file.filename) if media_data else file.filename
    description = media_data.get("description", None) if media_data else None
    order = media_data.get("order", 0) if media_data else 0
    media = ProjectMedia(
        project_id=project_id,
        title=title,
        description=description,
        file_url=file_url,
        order=order
    )

    return media