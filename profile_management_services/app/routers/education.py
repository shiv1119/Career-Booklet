from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Body
from typing import List, Optional, Union, Annotated, Dict, Any
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.profile import UserSkill, Skill, EducationMedia, Education, EducationSkill
from app.schemas.education import NewEducationSkillInput, ExistingEducationSkillInput, UserSkillsCreate,EducationDeleteRequest
from app.utils.helper import save_education_media
from app.routers.profile import create_user_skills
from fastapi.encoders import jsonable_encoder
from pydantic import ValidationError
import json
router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]

@router.post("/education/", status_code=status.HTTP_201_CREATED)
async def create_education(
    db: db_dependency,
    auth_user_id: int = Form(...),
    institution_id: Optional[int] = Form(None),
    degree: Optional[str] = Form(None),
    field_of_study: Optional[str] = Form(None),
    start_date: str = Form(...),
    end_date: Optional[str] = Form(None),
    grade: Optional[str] = Form(None),
    activities_societies: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    existing_skills: Optional[str] = Form(None),
    new_skills: Optional[str] = Form(None),
    media_files: Optional[List[UploadFile]] = File(None),
    media_metadata: Optional[str] = Form(None),
    links: Optional[str] = Form(None),
):
    education_data = {
        "auth_user_id": auth_user_id,
        "institution_id": institution_id,
        "degree": degree,
        "field_of_study": field_of_study,
        "start_date": start_date,
        "end_date": end_date,
        "grade": grade,
        "activities_societies": activities_societies,
        "description": description,
    }
    education_data = {k: v for k, v in education_data.items() if v is not None}
    education = Education(**education_data)
    db.add(education)
    db.commit()
    db.refresh(education)

    if existing_skills:
        try:
            existing_skills_data = ExistingEducationSkillInput.model_validate_json(existing_skills)
            for skill_id in existing_skills_data.skill_id:
                education_skill = EducationSkill(education_id=education.id, skill_id=skill_id)
                db.add(education_skill)
        except ValidationError as e:
            raise HTTPException(status_code=400, detail=f"Invalid existing_skills format: {e}")

    if new_skills:
        try:
            new_skills_data = NewEducationSkillInput.model_validate_json(new_skills)
            user_skills_data = UserSkillsCreate(skills=new_skills_data.skill_name)
            user_skills_response = create_user_skills(auth_user_id, user_skills_data, db)

            for skill_name in user_skills_response.skills:
                skill = db.query(Skill).filter(Skill.name == skill_name).first()
                education_skill = EducationSkill(education_id=education.id, skill_id=skill.id)
                db.add(education_skill)
        except ValidationError as e:
            raise HTTPException(status_code=400, detail=f"Invalid new_skills format: {e}")

    order = 0 
    if media_files:
        try:
            metadata_list = json.loads(media_metadata) if media_metadata else []
            if len(metadata_list) != len(media_files):
                raise HTTPException(status_code=400, detail="Metadata count must match the number of media files.")

            for idx, file in enumerate(media_files):
                metadata = metadata_list[idx]
                media_instance = save_education_media(
                    file=file,
                    education_id=education.id,
                    media_data={
                        "title": metadata.get("title", f"File {order}"),
                        "description": metadata.get("description", f"Uploaded file {file.filename}"),
                        "order": order,
                    },
                )
                db.add(media_instance)
                order += 1
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid media_metadata format. Must be a JSON array.")

    if links:
        try:
            link_list = json.loads(links)
            for idx, link_data in enumerate(link_list):
                media_instance = EducationMedia(
                    education_id=education.id,
                    title=link_data.get("title", f"Link {order}"),
                    description=link_data.get("description", ""),
                    file_url=link_data.get("link"),
                    order=order,
                )
                db.add(media_instance)
                order += 1
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid links format. Must be a JSON array.")

    db.commit()

    return {"message": "Education created successfully", "education_id": education.id}

@router.get("/education/", response_model=List[dict], status_code=status.HTTP_200_OK)
async def get_user_education(auth_user_id: int, db: db_dependency):
    education_entries = db.query(Education).filter(Education.auth_user_id == auth_user_id).all()
    
    if not education_entries:
        raise HTTPException(status_code=404, detail="No education entries found for this user.")
    response_data = []

    for education in education_entries:
        skills = db.query(Skill).join(EducationSkill).filter(EducationSkill.education_id == education.id).all()
        skill_names = [skill.name for skill in skills]
        media_files = db.query(EducationMedia).filter(EducationMedia.education_id == education.id).all()
        
        media_data = []
        link_data = []
        
        for media in media_files:
            if media.file_url.startswith('http://') or media.file_url.startswith('https://'):
                link_data.append({
                    "title": media.title,
                    "description": media.description,
                    "file_url": media.file_url,
                    "order": media.order
                })
            else:
                media_data.append({
                    "title": media.title,
                    "description": media.description,
                    "file_url": f"http://127.0.0.1:8000/{media.file_url}",
                    "thumbnail_url": media.thumbnail_url,
                    "uploaded_at": media.uploaded_at,
                    "order": media.order
                })
        
        education_info = {
            "id": education.id,
            "degree": education.degree,
            "field_of_study": education.field_of_study,
            "institution_id": education.institution_id,
            "start_date": education.start_date,
            "end_date": education.end_date,
            "grade": education.grade,
            "activities_societies": education.activities_societies,
            "description": education.description,
            "skills": skill_names,
            "media_files": media_data,
            "links": link_data,
            "created_at": education.created_at,
            "updated_at": education.updated_at
        }
        
        response_data.append(education_info)

    return response_data

@router.patch("/education/", status_code=status.HTTP_200_OK)
async def update_education(
    db: db_dependency,
    education_id: int = Form(...),
    auth_user_id: int = Form(...),
    institution_id: Optional[int] = Form(None),
    degree: Optional[str] = Form(None),
    field_of_study: Optional[str] = Form(None),
    start_date: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
    grade: Optional[str] = Form(None),
    activities_societies: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    existing_skills: Optional[str] = Form(None),
    new_skills: Optional[str] = Form(None),
    media_files: Optional[List[UploadFile]] = File(None),
    media_metadata: Optional[str] = Form(None),
    links: Optional[str] = Form(None),
):
    education = db.query(Education).filter(Education.id == education_id).first()
    if not education:
        raise HTTPException(status_code=404, detail="Education not found")

    if education.auth_user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to update this education entry")
    if institution_id:
        education.institution_id = institution_id
    if degree:
        education.degree = degree
    if field_of_study:
        education.field_of_study = field_of_study
    if start_date:
        education.start_date = start_date
    if end_date:
        education.end_date = end_date
    if grade:
        education.grade = grade
    if activities_societies:
        education.activities_societies = activities_societies
    if description:
        education.description = description

    db.commit()
    db.refresh(education)

    if existing_skills:
        try:
            existing_skills_data = ExistingEducationSkillInput.model_validate_json(existing_skills)
            if not existing_skills_data.skill_id:
                db.query(EducationSkill).filter(EducationSkill.education_id == education_id).delete()
            else:
                current_skills = db.query(EducationSkill).filter(EducationSkill.education_id == education_id).all()
                current_skill_ids = {skill.skill_id for skill in current_skills}
                skills_to_add = set(existing_skills_data.skill_id) - current_skill_ids
                skills_to_remove = current_skill_ids - set(existing_skills_data.skill_id)
                if skills_to_remove:
                    db.query(EducationSkill).filter(
                        EducationSkill.education_id == education_id,
                        EducationSkill.skill_id.in_(skills_to_remove)
                    ).delete()
                for skill_id in skills_to_add:
                    education_skill = EducationSkill(education_id=education.id, skill_id=skill_id)
                    db.add(education_skill)
            db.commit()

        except ValidationError as e:
            raise HTTPException(status_code=400, detail=f"Invalid existing_skills format: {e}")

    if new_skills:
        try:
            new_skills_data = NewEducationSkillInput.model_validate_json(new_skills)
            user_skills_data = UserSkillsCreate(skills=new_skills_data.skill_name)
            user_skills_response = create_user_skills(auth_user_id, user_skills_data, db)

            for skill_name in user_skills_response.skills:
                skill = db.query(Skill).filter(Skill.name == skill_name).first()
                education_skill = EducationSkill(education_id=education.id, skill_id=skill.id)
                db.add(education_skill)
        except ValidationError as e:
            raise HTTPException(status_code=400, detail=f"Invalid new_skills format: {e}")

    if media_files:
        try:
            metadata_list = json.loads(media_metadata) if media_metadata else []
        
            if len(metadata_list) != len(media_files):
                raise HTTPException(status_code=400, detail="Metadata count must match the number of media files.")
            current_media = db.query(EducationMedia).filter(EducationMedia.education_id == education_id).all()
            current_media_files = {media.file_url for media in current_media if media.file_url}  # Existing files
            files_to_add = {file.filename for file in media_files} - current_media_files
            files_to_remove = current_media_files - {file.filename for file in media_files}
            if files_to_remove:
                db.query(EducationMedia).filter(
                    EducationMedia.education_id == education_id,
                    EducationMedia.file_url.in_(files_to_remove)
                ).delete()
            for idx, file in enumerate(media_files):
                metadata = metadata_list[idx]
                if file.filename in files_to_add:
                    media_instance = save_education_media(
                        file=file,
                        education_id=education.id,
                        media_data={
                            "title": metadata.get("title", f"File {idx}"),
                            "description": metadata.get("description", f"Uploaded file {file.filename}"),
                            "order": idx,
                        },
                    )
                    db.add(media_instance)
            
            db.commit()

        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid media_metadata format. Must be a JSON array.")
    if links:
        try:
            link_list = json.loads(links)
            current_links = db.query(EducationMedia).filter(EducationMedia.education_id == education_id, EducationMedia.file_url != None).all()
            current_link_urls = {link.file_url for link in current_links}
            links_to_add = {link_data.get("link") for link_data in link_list} - current_link_urls
            links_to_remove = current_link_urls - {link_data.get("link") for link_data in link_list}
            if links_to_remove:
                db.query(EducationMedia).filter(
                    EducationMedia.education_id == education_id,
                    EducationMedia.file_url.in_(links_to_remove)
                ).delete()

            for idx, link_data in enumerate(link_list):
                if link_data.get("link") in links_to_add:
                    media_instance = EducationMedia(
                        education_id=education.id,
                        title=link_data.get("title", f"Link {idx}"),
                        description=link_data.get("description", ""),
                        file_url=link_data.get("link"),
                        order=idx,
                    )
                    db.add(media_instance)

            db.commit()

        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid links format. Must be a JSON array.")

    return {"message": "Education updated successfully", "education_id": education.id}


@router.delete("/education/", status_code=status.HTTP_200_OK)
async def delete_education(auth_user_id: int, deleteRequest: EducationDeleteRequest, db: db_dependency):
    education = db.query(Education).filter(Education.id == deleteRequest.id).first()
    if education.auth_user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to update this education entry")
    if not education:
        raise HTTPException(status_code=404, detail="Education not found")
    db.query(EducationSkill).filter(EducationSkill.education_id == deleteRequest.id).delete()
    db.query(EducationMedia).filter(EducationMedia.education_id == deleteRequest.id).delete()
    db.delete(education)

    db.commit()

    return {"message": f"Education with ID {deleteRequest.id} and related records deleted successfully"}

