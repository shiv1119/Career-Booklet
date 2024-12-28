from fastapi import UploadFile, File
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