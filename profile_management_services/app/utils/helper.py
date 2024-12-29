from fastapi import UploadFile, File, HTTPException
from datetime import datetime
import os

UPLOAD_DIR = "./uploaded_images/profile_images"

def save_image(file: UploadFile, image_type: str):
    filename = f"{image_type}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    try:
        with open(file_path, "wb") as f:
            f.write(file.file.read())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving image: {str(e)}")

    return file_path


def handle_image_update(
    db, user_profile, image_field: str, new_image: UploadFile, folder: str
):
    old_image_path = getattr(user_profile, image_field, None)

    if new_image:
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
    if os.path.exists(image_path):
        os.remove(image_path)