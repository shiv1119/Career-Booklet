from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Body
from typing import Annotated, Union
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.profile import UserProfile, AboutUser, Skill
from datetime import date
from pydantic import HttpUrl
from typing import Optional
from app.schemas.profile import UserProfileCreateRequest, UserProfileGetResponse, UserProfileUpdateRequest, AboutUserCreate, AboutUserUpdate, SkillCreate
from app.utils.helper import save_image, handle_image_update, remove_saved_image
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

@router.post("/profile/", status_code=status.HTTP_201_CREATED)
async def create_user_profile(
    db: db_dependency,
    auth_user_id: int = Form(...),  # individual field
    full_name: str = Form(...),
    additional_name: Optional[str] = Form(None),
    pronouns: Optional[str] = Form(None),
    date_of_birth: Optional[date] = Form(None),
    gender: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    full_address: Optional[str] = Form(None),
    website: Optional[HttpUrl] = Form(None),
    profile_image: Optional[UploadFile] = File(None),
    profile_background_image: Optional[UploadFile] = File(None),
):
    existing_profile = db.query(UserProfile).filter(UserProfile.auth_user_id == auth_user_id).first()
    if existing_profile:
        raise HTTPException(status_code=400, detail="Profile with this auth_user_id already exists.")

    profile_image_path = None
    profile_background_image_path = None

    if profile_image:
        filename = f"{uuid4().hex}_{profile_image.filename}"
        profile_image_path = os.path.join(UPLOAD_DIRECTORY, filename)
        os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)
        with open(profile_image_path, "wb") as f:
            f.write(profile_image.file.read())

    if profile_background_image:
        filename = f"{uuid4().hex}_{profile_background_image.filename}"
        profile_background_image_path = os.path.join(UPLOAD_DIRECTORY, filename)
        os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)
        with open(profile_background_image_path, "wb") as f:
            f.write(profile_background_image.file.read())

    new_profile = UserProfile(
        auth_user_id=auth_user_id,
        full_name=full_name,
        additional_name=additional_name,
        pronouns=pronouns,
        date_of_birth=date_of_birth,
        gender=gender,
        country=country,
        city=city,
        full_address=full_address,
        website=str(website) if website else None,
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
    profile_image: Optional[UploadFile] = File(None)
):
    user_profile = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    if not user_profile:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        updated_path = handle_image_update(db, user_profile, "profile_image", profile_image, "profile_image")
        db.commit()
        return {"message": "Profile image updated successfully", "profile_image": updated_path}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating profile image: {str(e)}")


@router.put("/update-background-image/{user_id}", status_code=status.HTTP_200_OK)
async def update_profile_background_image(
    db: db_dependency,
    user_id: int,
    profile_background_image: UploadFile = File(None)  # Allow null
):
    user_profile = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    if not user_profile:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        updated_path = handle_image_update(db, user_profile, "profile_background_image", profile_background_image, "profile_background_image")
        db.commit()
        return {"message": "Profile background image updated successfully", "profile_background_image": updated_path}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating profile background image: {str(e)}")


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


#User About Section
@router.post("/profile/about/", status_code=status.HTTP_201_CREATED)
async def create_about(db: db_dependency, about_user: AboutUserCreate):
    about_user_db = AboutUser(
        auth_user_id=about_user.auth_user_id,
        about=about_user.about
    )
    db.add(about_user_db)
    db.commit()
    db.refresh(about_user_db)
    return {"message": "About section created successfully", "about data": about_user_db}


@router.put("/profile/about/{about_id}", status_code=status.HTTP_200_OK)
async def update_about(db: db_dependency, auth_user_id: int, data: AboutUserUpdate):
    about_user = db.query(AboutUser).filter(AboutUser.auth_user_id==auth_user_id).first()
    if not about_user:
        raise HTTPException(status_code=404, detail="About section not found")

    about_user.about = data.about
    db.commit()
    db.refresh(about_user)
    return about_user

@router.get("/profile/about/{auth_user_id}",response_model=AboutUserUpdate,status_code=status.HTTP_200_OK)
async def get_about(db: db_dependency, auth_user_id: int):
    about_user = db.query(AboutUser).filter(AboutUser.auth_user_id==auth_user_id).first()
    if not about_user:
        raise HTTPException(status_code=404, detail="About section not found")

    return about_user


#skills section

@router.post("/skills", response_model=SkillCreate, status_code=status.HTTP_201_CREATED)
def create_skill(skill: SkillCreate, db: db_dependency):
    db_skill = db.query(Skill).filter(Skill.name == skill.name).first()
    if db_skill:
        raise HTTPException(status_code=400, detail="Skill already exists")

    new_skill = Skill(name=skill.name)
    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)
    return new_skill


# @router.put("/user/{auth_user_id}/skills", response_model=User)
# def update_user_skills(auth_user_id: int, skills_data: UserSkillsUpdate, db: Session = Depends(get_db)):
#     user = db.query(User).filter(User.id == auth_user_id).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
#
#     existing_skills = db.query(Skill).filter(Skill.id.in_(skills_data.skills)).all()
#     existing_skill_ids = {skill.id for skill in existing_skills}
#
#     new_skills = [Skill(name=skill_name) for skill_name in skills_data.skills if skill_name not in existing_skill_ids]
#     db.add_all(new_skills)
#     db.commit()
#     db.refresh(existing_skills)
#
#     user_skills = []
#     for idx, skill_id in enumerate(skills_data.skills):
#         skill = db.query(Skill).filter(Skill.id == skill_id).first()
#         if skill:
#             user_skill = UserSkill(
#                 auth_user_id=auth_user_id,
#                 skill_id=skill.id,
#                 order=skills_data.skill_order[idx]
#             )
#             user_skills.append(user_skill)
#
#     db.add_all(user_skills)
#     db.commit()
#     return {"status": "success", "message": "User skills updated"}
