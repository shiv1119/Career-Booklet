from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Body, Request, FastAPI
from typing import Annotated, Union
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.profile import UserProfile, AboutUser, Skill
from datetime import date
from pydantic import HttpUrl
from typing import Optional
from app.schemas.profile import UserProfileGetResponse, UserProfileUpdateRequest, AboutUserCreate, AboutUserUpdate, SkillCreate, UserProfileCreateRequest, AboutUserGetRequest
from app.utils.helper import save_image, handle_image_update, remove_saved_image
from uuid import uuid4
import os
from fastapi.encoders import jsonable_encoder
import os
from fastapi.responses import JSONResponse

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
app = FastAPI()
@app.middleware("http")
async def extract_user_id_middleware(request: Request, call_next):
    user_id = request.headers.get("x-user-id")
    print(user_id)
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID not found in headers")
    request.state.user_id = user_id
    response = await call_next(request)
    return response

@router.get("/")
async def hello():
    return {"message": "hello world"}


@router.post("/profile/", status_code=status.HTTP_201_CREATED)
async def create_user_profile(
    user_profile: UserProfileCreateRequest,
    db: db_dependency,
    request: Request
):
    user_id = request.headers.get("x-user-id")
    print(user_id)
    existing_profile = db.query(UserProfile).filter(UserProfile.auth_user_id == user_id).first()
    if existing_profile:
        raise HTTPException(status_code=400, detail="Profile with this auth_user_id already exists.")
    
    def empty_string_to_none(value: str):
        return None if value == '' else value

    try:
        new_profile = UserProfile(
            auth_user_id=user_id,
            full_name=empty_string_to_none(user_profile.full_name),
            additional_name=empty_string_to_none(user_profile.additional_name),
            pronouns=empty_string_to_none(user_profile.pronouns),
            date_of_birth=empty_string_to_none(user_profile.date_of_birth),
            gender=empty_string_to_none(user_profile.gender),
            country=empty_string_to_none(user_profile.country),
            city=empty_string_to_none(user_profile.city),
            full_address=empty_string_to_none(user_profile.full_address),
            website=str(user_profile.website) if user_profile.website else None,
        )

        db.add(new_profile)
        db.commit()
        db.refresh(new_profile)

        return JSONResponse(content=jsonable_encoder({"message": "Profile created successfully", "profile": new_profile}))
    
    except Exception as e:
        print(f"Error creating profile: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error creating profile: {str(e)}")


@router.put("/update-profile-image/", status_code=status.HTTP_200_OK)
async def update_profile_image(
    db: db_dependency,
    request: Request,
    profile_image: Optional[UploadFile] = File(None)
):
    user_id = request.headers.get("x-user-id")
    print(user_id)
    user_profile = db.query(UserProfile).filter(UserProfile.auth_user_id == user_id).first()
    if not user_profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    try:
        updated_path = handle_image_update(db, user_profile, "profile_image", profile_image, "profile_image")
        db.commit()
        return {"message": "Profile image updated successfully", "profile_image": updated_path}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating profile image: {str(e)}")


@router.put("/update-background-image/", status_code=status.HTTP_200_OK)
async def update_profile_background_image(
    db: db_dependency,
    request: Request,
    profile_background_image:Optional[UploadFile] = File(None) 
):
    user_id = request.headers.get("x-user-id")
    print(user_id)
    user_profile = db.query(UserProfile).filter(UserProfile.auth_user_id == user_id).first()
    if not user_profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    try:
        updated_path = handle_image_update(db, user_profile, "profile_background_image", profile_background_image, "profile_background_image")
        db.commit()
        return {"message": "Profile background image updated successfully", "profile_background_image": updated_path}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating profile background image: {str(e)}")


@router.get("/profile/", response_model=UserProfileGetResponse, status_code=status.HTTP_200_OK)
async def get_user_profile(db: db_dependency, request: Request):
    user_id = request.headers.get("x-user-id")
    user_profile = db.query(UserProfile).filter(UserProfile.auth_user_id == user_id).first()

    if user_profile is None:
        raise HTTPException(status_code=404, detail="User profile not found")

    return user_profile


@router.put("/profile/{auth_user_id}", response_model=UserProfileGetResponse, status_code=status.HTTP_200_OK)
async def update_user_profile(
        db: db_dependency,
        user_profile_data: UserProfileUpdateRequest,
        request: Request
):
    user_id = request.headers.get("x-user-id")
    user_profile = db.query(UserProfile).filter(UserProfile.auth_user_id == user_id).first()

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
async def create_about(db: db_dependency, about_user: AboutUserCreate, request: Request):
    user_id = request.headers.get("x-user-id")
    about_user_db = AboutUser(
        auth_user_id=user_id,
        about=about_user.about
    )
    db.add(about_user_db)
    db.commit()
    db.refresh(about_user_db)
    return {"message": "About section created successfully", "about data": about_user_db}


@router.put("/profile/about/{about_id}", status_code=status.HTTP_200_OK)
async def update_about(db: db_dependency, data: AboutUserUpdate, request: Request):
    user_id = request.headers.get("x-user-id")
    about_user = db.query(AboutUser).filter(AboutUser.auth_user_id==user_id).first()
    if not about_user:
        raise HTTPException(status_code=404, detail="About section not found")

    about_user.about = data.about
    db.commit()
    db.refresh(about_user)
    return about_user

@router.get("/profile/about/{auth_user_id}",response_model=AboutUserGetRequest,status_code=status.HTTP_200_OK)
async def get_about(db: db_dependency, request: Request):
    user_id = request.headers.get("x-user-id")
    about_user = db.query(AboutUser).filter(AboutUser.auth_user_id==user_id).first()
    if not about_user:
        raise HTTPException(status_code=404, detail="About section not found")

    return about_user


#skills section

# @router.post("/skills", response_model=SkillCreate, status_code=status.HTTP_201_CREATED)
# def create_skill(skill: SkillCreate, db: db_dependency):
#     db_skill = db.query(Skill).filter(Skill.name == skill.name).first()
#     if db_skill:
#         raise HTTPException(status_code=400, detail="Skill already exists")

#     new_skill = Skill(name=skill.name)
#     db.add(new_skill)
#     db.commit()
#     db.refresh(new_skill)
#     return new_skill


# @router.put("/user/{auth_user_id}/skills", response_model=User)
# def update_user_skills(auth_user_id: int, skills_data: UserSkillsUpdate, db: Session = Depends(get_db)):
#     user = db.query(User).filter(User.id == auth_user_id).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     existing_skills = db.query(Skill).filter(Skill.id.in_(skills_data.skills)).all()
#     existing_skill_ids = {skill.id for skill in existing_skills}

#     new_skills = [Skill(name=skill_name) for skill_name in skills_data.skills if skill_name not in existing_skill_ids]
#     db.add_all(new_skills)
#     db.commit()
#     db.refresh(existing_skills)

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

#     db.add_all(user_skills)
#     db.commit()
#     return {"status": "success", "message": "User skills updated"}
