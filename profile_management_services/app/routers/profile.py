from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Body, Request, FastAPI
from typing import Annotated, Union
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.profile import UserProfile, AboutUser, Skill, UserSkill, Language, UserLanguage, Cause
from datetime import date
from pydantic import HttpUrl
from typing import Optional
from app.schemas.profile import UserProfileGetResponse, UserProfileUpdateRequest, AboutUserCreate, AboutUserUpdate, SkillCreate, UserProfileCreateRequest, AboutUserGetRequest, SkillGet, UserSkillsUpdate, UserSkillsResponse, UserSkillsCreate, LanguageCreate, LanguageResponse, LanguageCreate, UserLanguageCreate, UserLanguageUpdate, UserLanguageResponse, UserLanguageDelete, CauseCreate
from app.utils.helper import save_image, handle_image_update, remove_saved_image
from uuid import uuid4
import os
from fastapi.encoders import jsonable_encoder
import os
from fastapi.responses import JSONResponse
from sqlalchemy.sql import case
from typing import List


router = APIRouter()



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]
app = FastAPI()

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
            state=empty_string_to_none(user_profile.state),
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
    if user_profile.profile_background_image:
        user_profile.profile_background_image = user_profile.profile_background_image.replace("\\", "/")
    if user_profile.profile_background_image:
        user_profile.profile_background_image = user_profile.profile_background_image.replace("./", "")
    if user_profile.profile_background_image:
        user_profile.profile_background_image = (
            f"http://127.0.0.1:9001/static/{user_profile.profile_background_image}"
        )
    if user_profile.profile_image:
        user_profile.profile_image = user_profile.profile_image.replace("\\", "/")
    if user_profile.profile_image:
        user_profile.profile_image = user_profile.profile_image.replace("./", "")
    if user_profile.profile_image:
        user_profile.profile_image = (
            f"http://127.0.0.1:9001/static/{user_profile.profile_image}"
        )
    return user_profile


@router.put("/profile/", response_model=UserProfileGetResponse, status_code=status.HTTP_200_OK)
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
    if user_profile_data.state is not None:
        user_profile.state = user_profile_data.state
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

@router.post("/user/{auth_user_id}/skills", response_model=UserSkillsResponse, status_code=status.HTTP_201_CREATED)
def create_user_skills(auth_user_id: int, skills_data: UserSkillsCreate, db: db_dependency):
    existing_skills = db.query(Skill).filter(Skill.name.in_(skills_data.skills)).all()
    existing_skills_map = {skill.name: skill.id for skill in existing_skills}

    new_skills = [skill_name for skill_name in skills_data.skills if skill_name not in existing_skills_map]

    new_skill_objects = [Skill(name=skill_name) for skill_name in new_skills]
    db.add_all(new_skill_objects)
    db.commit()

    for skill in new_skill_objects:
        db.refresh(skill)
        existing_skills_map[skill.name] = skill.id

    skill_ids = list(existing_skills_map.values())

    existing_user_skills = db.query(UserSkill).filter(UserSkill.auth_user_id == auth_user_id).all()
    existing_skill_ids = {us.skill_id for us in existing_user_skills}
    next_order = len(existing_user_skills)

    new_user_skills = [
        UserSkill(auth_user_id=auth_user_id, skill_id=skill_id, order=next_order + idx)
        for idx, skill_id in enumerate(skill_ids)
        if skill_id not in existing_skill_ids
    ]

    db.add_all(new_user_skills)
    db.commit()

    updated_skills = db.query(Skill).filter(Skill.id.in_(skill_ids)).all()
    return UserSkillsResponse(
        auth_user_id=auth_user_id,
        skills=[skill.name for skill in updated_skills],
    )


@router.put("/user/{auth_user_id}/skills", response_model=UserSkillsResponse, status_code=status.HTTP_200_OK)
def update_user_skills(auth_user_id: int, skills_data: UserSkillsUpdate, db: db_dependency):
    skill_ids = skills_data.skills

    existing_skills = db.query(Skill).filter(Skill.id.in_(skill_ids)).all()
    existing_skill_ids = {skill.id for skill in existing_skills}

    invalid_ids = set(skill_ids) - existing_skill_ids
    if invalid_ids:
        raise HTTPException(status_code=400, detail=f"Invalid skill IDs: {invalid_ids}")

    db.query(UserSkill).filter(UserSkill.auth_user_id == auth_user_id).delete()
    db.commit()

    new_user_skills = [
        UserSkill(auth_user_id=auth_user_id, skill_id=skill_id, order=idx)
        for idx, skill_id in enumerate(skill_ids)
    ]
    db.add_all(new_user_skills)
    db.commit()

    order_case = case(*[(Skill.id == skill_id, idx) for idx, skill_id in enumerate(skill_ids)])
    updated_skills = db.query(Skill).filter(Skill.id.in_(skill_ids)).order_by(order_case).all()

    return UserSkillsResponse(
        auth_user_id=auth_user_id,
        skills=[skill.name for skill in updated_skills],
    )

@router.get("/user/{auth_user_id}/skills", response_model=UserSkillsResponse, status_code=status.HTTP_200_OK)
def get_user_skills(auth_user_id: int, db: db_dependency):
    user_skills = (
        db.query(UserSkill)
        .filter(UserSkill.auth_user_id == auth_user_id)
        .order_by(UserSkill.order)
        .all()
    )

    if not user_skills:
        raise HTTPException(status_code=404, detail="User not found or no skills found for the user")

    skill_ids = [user_skill.skill_id for user_skill in user_skills]
    skills = (
        db.query(Skill)
        .filter(Skill.id.in_(skill_ids))
        .all()
    )

    skill_map = {skill.id: skill.name for skill in skills}
    ordered_skill_names = [skill_map[skill_id] for skill_id in skill_ids]

    return UserSkillsResponse(
        auth_user_id=auth_user_id,
        skills=ordered_skill_names,
    )

@router.delete("/user/{auth_user_id}/skills", status_code=status.HTTP_200_OK)
def delete_user_skills(auth_user_id: int, delete_data: UserSkillsUpdate, db: db_dependency):

    if not all(isinstance(skill, int) for skill in delete_data.skills):
        raise HTTPException(status_code=400, detail="Skills should be provided as integers (IDs)")

    delete_count = db.query(UserSkill).filter(
        UserSkill.auth_user_id == auth_user_id,
        UserSkill.skill_id.in_(delete_data.skills)
    ).delete(synchronize_session=False)

    if delete_count == 0:
        raise HTTPException(status_code=404, detail="No skills found for the user to delete")

    db.commit()

    return {"status": "success", "message": f"{delete_count} skills deleted for user {auth_user_id}"}

@router.post("/languages/", response_model=LanguageResponse)
def create_language(language_create: LanguageCreate, db: db_dependency):
    db_language = db.query(Language).filter(Language.name == language_create.name).first()
    if db_language:
        raise HTTPException(status_code=400, detail="Language already exists")
    
    new_language = Language(name=language_create.name)

    db.add(new_language)
    db.commit()
    db.refresh(new_language)
    return new_language


@router.post("/users/{auth_user_id}/languages/", status_code=status.HTTP_201_CREATED)
def create_language_for_user(auth_user_id: int, language_create: LanguageCreate, db: db_dependency):
    db_language = db.query(Language).filter(Language.name == language_create.name).first()
    
    if not db_language:
        db_language = Language(name=language_create.name)
        db.add(db_language)
        db.commit()
        db.refresh(db_language)
    
    db_user_language = db.query(UserLanguage).filter(
        UserLanguage.auth_user_id == auth_user_id,
        UserLanguage.language_id == db_language.id
    ).first()

    if db_user_language:
        raise HTTPException(status_code=400, detail="User already has this language")

    user_language = UserLanguage(
        auth_user_id=auth_user_id,
        language_id=db_language.id,
        proficiency=language_create.proficiency
    )
    
    db.add(user_language)
    db.commit()
    db.refresh(user_language)
    
    return {"message": "Language added"}


@router.put("/users/{auth_user_id}/languages/{language_id}", status_code=status.HTTP_200_OK)
def update_language_for_user(
    auth_user_id: int, 
    user_language_update: UserLanguageUpdate,
    db: db_dependency
):

    db_user_language = db.query(UserLanguage).filter(
        UserLanguage.auth_user_id == auth_user_id,
        UserLanguage.language_id == user_language_update.language_id
    ).first()
    
    if not db_user_language:
        raise HTTPException(status_code=404, detail="User does not have this language")

    if user_language_update.proficiency:
        db_user_language.proficiency = user_language_update.proficiency

    db.commit()
    db.refresh(db_user_language)
    
    return {"message": "The language updated successfully"}

@router.get("/users/{auth_user_id}/languages", response_model=List[UserLanguageResponse], status_code=status.HTTP_200_OK)
def get_languages_for_user(auth_user_id: int, db: db_dependency):
    user_languages = db.query(UserLanguage).filter(UserLanguage.auth_user_id == auth_user_id).all()
    
    if not user_languages:
        raise HTTPException(status_code=404, detail="No languages found for this user")
    
    language_details = []
    for user_language in user_languages:
        language = db.query(Language).filter(Language.id == user_language.language_id).first()
        if language:
            language_details.append({
                "language_name": language.name,
                "proficiency": user_language.proficiency
            })
    
    return language_details


@router.delete("/users/{auth_user_id}/languages/{language_id}", response_model=dict, status_code=status.HTTP_200_OK)
def delete_language_for_user(auth_user_id: int, language_delete: UserLanguageDelete, db: db_dependency):
    user_language = db.query(UserLanguage).filter(
        UserLanguage.auth_user_id == auth_user_id,
        UserLanguage.language_id == language_delete.language_id
    ).first()

    if not user_language:
        raise HTTPException(status_code=404, detail="Language not found for the user")
    db.delete(user_language)
    db.commit()

    return {"status": "success", "message": f"Language with ID {language_delete.language_id} has been deleted for user {auth_user_id}"}

@router.post("/users/{auth_user_id}/causes/", response_model=dict)
def create_or_update_causes_for_user(
    auth_user_id: int, 
    causes_request: CauseCreate,
    db: db_dependency
):
    if causes_request.causes is None:
        db.query(Cause).filter(Cause.auth_user_id == auth_user_id).delete()
        db.commit()
        return {"status": "success", "message": f"All causes have been deleted for user {auth_user_id}"}
    existing_causes = db.query(Cause).filter(Cause.auth_user_id == auth_user_id).all()

    existing_cause_names = {cause.cause_name for cause in existing_causes}

    causes_to_add = [cause for cause in causes_request.causes if cause not in existing_cause_names]
    causes_to_remove = [cause for cause in existing_causes if cause.cause_name not in causes_request.causes]

    for cause_name in causes_to_add:
        new_cause = Cause(auth_user_id=auth_user_id, cause_name=cause_name)
        db.add(new_cause)

    for cause in causes_to_remove:
        db.delete(cause)
    db.commit()

    return {"status": "success", "message": f"Causes have been updated for user {auth_user_id}"}


@router.get("/users/{auth_user_id}/causes/", response_model=List[str], status_code=status.HTTP_200_OK)
def get_causes_for_user(auth_user_id: int, db: db_dependency):
    causes = db.query(Cause.cause_name).filter(Cause.auth_user_id == auth_user_id).all()
    
    if not causes:
        raise HTTPException(status_code=404, detail="No causes found for this user")
    return [cause[0] for cause in causes]