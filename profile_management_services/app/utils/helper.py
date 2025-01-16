from fastapi import UploadFile, HTTPException
from pathlib import Path
from datetime import datetime
import os


UPLOAD_DIR = Path("static/profile_images")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)  # Ensure the directory exists
BASE_URL = "http://127.0.0.1:9001"

def save_image(file: UploadFile, image_type: str):
    # Generate a unique filename
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    filename = f"{image_type}_{timestamp}_{file.filename}"
    file_path = UPLOAD_DIR / filename

    try:
        # Write the file in chunks to handle large files
        with file_path.open("wb") as f:
            for chunk in file.file:
                f.write(chunk)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving image: {str(e)}")

    # Return the URL of the uploaded image
    image_url = f"profile_images/{filename}"
    return image_url


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