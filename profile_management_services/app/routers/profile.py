from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from typing import Annotated, Union
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.profile import UserProfile
from app.schemas.profile import UserProfileCreateRequest, UserProfileGetResponse, UserProfileUpdateRequest
from app.utils.helper import save_image
from uuid import uuid4
import os

router = APIRouter()

UPLOAD_DIRECTORY = "./uploaded_images/profile_images"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

@router.get("/")
async def hello():
    return {"message": "hello world"}

@router.post("/profiles/", status_code=status.HTTP_201_CREATED)
async def create_user_profile(
    db: db_dependency,
    user_data: UserProfileCreateRequest = Depends(UserProfileCreateRequest.as_form),
    profile_image: UploadFile | None = File(None),
    profile_background_image: UploadFile | None = File(None)
):
    existing_profile = db.query(UserProfile).filter(UserProfile.auth_user_id == user_data.auth_user_id).first()
    if existing_profile:
        raise HTTPException(status_code=400, detail="Profile with this auth_user_id already exists.")

    profile_image_path = None
    profile_background_image_path = None

    if profile_image:
        filename = f"{uuid4().hex}_{profile_image.filename}"
        profile_image_path = os.path.join(UPLOAD_DIRECTORY, filename)
        with open(profile_image_path, "wb") as f:
            f.write(profile_image.file.read())

    if profile_background_image:
        filename = f"{uuid4().hex}_{profile_background_image.filename}"
        profile_background_image_path = os.path.join(UPLOAD_DIRECTORY, filename)
        with open(profile_background_image_path, "wb") as f:
            f.write(profile_background_image.file.read())

    new_profile = UserProfile(
        auth_user_id=user_data.auth_user_id,
        full_name=user_data.full_name,
        additional_name=user_data.additional_name,
        pronouns=user_data.pronouns,
        date_of_birth=user_data.date_of_birth,
        gender=user_data.gender,
        country=user_data.country,
        city=user_data.city,
        full_address=user_data.full_address,
        website=str(user_data.website) if user_data.website else None,
        profile_image=profile_image_path,
        profile_background_image=profile_background_image_path,
    )

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return {"message": "Profile created successfully", "profile": new_profile}


@router.put("/update-profile-image/{user_id}", status_code=status.HTTP_200_OK)
async def update_profile_image(
    db: db_dependency,
    user_id: int,
    profile_image: UploadFile = File(...)
):
    user_profile = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    if not user_profile:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        image_path = save_image(profile_image, "profile_image")
        user_profile.profile_image = image_path
        db.commit()
        return {"message": "Profile image updated successfully", "profile_image": image_path}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error saving profile image: {str(e)}")

@router.put("/update-background-image/{user_id}", status_code=status.HTTP_200_OK)
async def update_profile_background_image(
    db: db_dependency,
    user_id: int,
    profile_background_image: UploadFile = File(...)
):
    user_profile = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    if not user_profile:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        image_path = save_image(profile_background_image, "profile_background_image")
        user_profile.profile_background_image = image_path
        db.commit()
        return {"message": "Profile background image updated successfully", "profile_background_image": image_path}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error saving profile background image: {str(e)}")


@router.get("/profile/{auth_user_id}", response_model=UserProfileGetResponse, status_code=status.HTTP_200_OK)
async def get_user_profile(auth_user_id: int, db: db_dependency):
    user_profile = db.query(UserProfile).filter(UserProfile.auth_user_id == auth_user_id).first()

    if user_profile is None:
        raise HTTPException(status_code=404, detail="User profile not found")

    return user_profile


@router.put("/profile/{auth_user_id}", response_model=UserProfileGetResponse, status_code=status.HTTP_200_OK)
async def update_user_profile(
        db: db_dependency,
        auth_user_id: int,
        user_profile_data: UserProfileUpdateRequest,
):
    user_profile = db.query(UserProfile).filter(UserProfile.auth_user_id == auth_user_id).first()

    if user_profile is None:
        raise HTTPException(status_code=404, detail="User profile not found")

    if user_profile_data.full_name is not None:
        user_profile.full_name = user_profile_data.full_name
    if user_profile_data.additional_name is not None:
        user_profile.additional_name = user_profile_data.additional_name
    if user_profile_data.pronouns is not None:
        user_profile.pronouns = user_profile_data.pronouns
    if user_profile_data.date_of_birth is not None:
        user_profile.date_of_birth = user_profile_data.date_of_birth
    if user_profile_data.gender is not None:
        user_profile.gender = user_profile_data.gender
    if user_profile_data.country is not None:
        user_profile.country = user_profile_data.country
    if user_profile_data.city is not None:
        user_profile.city = user_profile_data.city
    if user_profile_data.full_address is not None:
        user_profile.full_address = user_profile_data.full_address
    if user_profile_data.website is not None:
        user_profile.website = user_profile_data.website

    db.commit()
    db.refresh(user_profile)

    return user_profile