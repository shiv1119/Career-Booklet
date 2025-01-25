from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Body
from typing import List, Optional, Union, Annotated, Dict, Any
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.profile import UserSkill, Skill, Certification, CertificationMedia, CertificationSkill
from app.schemas.certification import ExistingCertificationSkillInput, NewCertificationSkillInput, UserSkillsCreate, MediaMetadata, UserSkillsCreate, CertificationDeleteRequest
from app.utils.helper import save_certification_media
from app.routers.profile import create_user_skills
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

@router.post("/certification/", status_code=status.HTTP_201_CREATED)
async def create_certification(
    db: db_dependency,
    auth_user_id: int = Form(...),
    name: str = Form(...),
    organization_id: Optional[int] = Form(None),
    issue_date: str = Form(...),
    expiration_date: Optional[str] = Form(None),
    credential_id: Optional[str] = Form(None),
    credential_url: Optional[str] = Form(None),
    existing_skills: Optional[str] = Form(None),
    new_skills: Optional[str] = Form(None),
    media_files: Optional[List[UploadFile]] = File(None),
    media_metadata: Optional[str] = Form(None),
    links: Optional[str] = Form(None),
):
    certification_data = {
        "auth_user_id": auth_user_id,
        "name": name,
        "organization_id": organization_id,
        "issue_date": issue_date,
        "expiration_date": expiration_date,
        "credential_id": credential_id,
        "credential_url": credential_url
    }
    certification_data = {k: v for k, v in certification_data.items() if v is not None}
    certification = Certification(**certification_data)
    db.add(certification)
    db.commit()
    db.refresh(certification)

    if existing_skills:
        try:
            existing_skills_data = ExistingCertificationSkillInput.model_validate_json(existing_skills)
            for skill_id in existing_skills_data.skill_id:
                certification_skill = CertificationSkill(certification_id=certification.id, skill_id=skill_id)
                db.add(certification_skill)
        except ValidationError as e:
            raise HTTPException(status_code=400, detail=f"Invalid existing_skills format: {e}")
    if new_skills:
        try:
            new_skills_data = NewCertificationSkillInput.model_validate_json(new_skills)
            user_skills_data = UserSkillsCreate(skills=new_skills_data.skill_name)
            user_skills_response = create_user_skills(auth_user_id, user_skills_data, db)

            for skill_name in user_skills_response.skills:
                skill = db.query(Skill).filter(Skill.name == skill_name).first()
                certification_skill = CertificationSkill(certification_id=certification.id, skill_id=skill.id)
                db.add(certification_skill)
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
                media_instance = save_certification_media(
                    file=file,
                    certification_id=certification.id,
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
                media_instance = CertificationMedia(
                    certification_id=certification.id,
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

    return {"message": "Certification created successfully", "certification_id": certification.id}

@router.get("/certification/", response_model=List[dict], status_code=status.HTTP_200_OK)
async def get_user_certifications(auth_user_id: int, db: db_dependency):
    certification_entries = db.query(Certification).filter(Certification.auth_user_id == auth_user_id).all()
    
    if not certification_entries:
        raise HTTPException(status_code=404, detail="No certification entries found for this user.")
    
    response_data = []

    for certification in certification_entries:
        skills = db.query(Skill).join(CertificationSkill).filter(CertificationSkill.certification_id == certification.id).all()
        skill_names = [skill.name for skill in skills]
        media_files = db.query(CertificationMedia).filter(CertificationMedia.certification_id == certification.id).all()
        
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
        certification_info = {
            "id": certification.id,
            "name": certification.name,
            "organization_id": certification.organization_id,
            "issue_date": certification.issue_date,
            "expiration_date": certification.expiration_date,
            "credential_id": certification.credential_id,
            "credential_url": certification.credential_url,
            "skills": skill_names,
            "media_files": media_data,
            "links": link_data,
            "created_at": certification.created_at,
            "updated_at": certification.updated_at
        }
        
        response_data.append(certification_info)

    return response_data

@router.patch("/certification/", status_code=status.HTTP_200_OK)
async def update_certification(
    db: db_dependency,
    certification_id: int = Form(...),
    auth_user_id: int = Form(...),
    name: Optional[str] = Form(None),
    organization_id: Optional[int] = Form(None),
    issue_date: Optional[str] = Form(None),
    expiration_date: Optional[str] = Form(None),
    credential_id: Optional[str] = Form(None),
    credential_url: Optional[str] = Form(None),
    existing_skills: Optional[str] = Form(None),
    new_skills: Optional[str] = Form(None),
    media_files: Optional[List[UploadFile]] = File(None),
    media_metadata: Optional[str] = Form(None),
    links: Optional[str] = Form(None),
):
    certification = db.query(Certification).filter(Certification.id == certification_id).first()
    if not certification:
        raise HTTPException(status_code=404, detail="Certification not found")

    if certification.auth_user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to update this certification entry")

    if name:
        certification.name = name
    if organization_id:
        certification.organization_id = organization_id
    if issue_date:
        certification.issue_date = issue_date
    if expiration_date:
        certification.expiration_date = expiration_date
    if credential_id:
        certification.credential_id = credential_id
    if credential_url:
        certification.credential_url = credential_url

    db.commit()
    db.refresh(certification)

    if existing_skills:
        try:
            existing_skills_data = ExistingCertificationSkillInput.model_validate_json(existing_skills)
            current_skills = db.query(CertificationSkill).filter(CertificationSkill.certification_id == certification_id).all()
            current_skill_ids = {skill.skill_id for skill in current_skills}
            skills_to_add = set(existing_skills_data.skill_id) - current_skill_ids
            skills_to_remove = current_skill_ids - set(existing_skills_data.skill_id)

            if skills_to_remove:
                db.query(CertificationSkill).filter(
                    CertificationSkill.certification_id == certification_id,
                    CertificationSkill.skill_id.in_(skills_to_remove)
                ).delete()

            for skill_id in skills_to_add:
                certification_skill = CertificationSkill(certification_id=certification.id, skill_id=skill_id)
                db.add(certification_skill)

            db.commit()

        except ValidationError as e:
            raise HTTPException(status_code=400, detail=f"Invalid existing_skills format: {e}")

    if new_skills:
        try:
            new_skills_data = NewCertificationSkillInput.model_validate_json(new_skills)
            user_skills_data = UserSkillsCreate(skills=new_skills_data.skill_name)
            user_skills_response = create_user_skills(auth_user_id, user_skills_data, db)

            for skill_name in user_skills_response.skills:
                skill = db.query(Skill).filter(Skill.name == skill_name).first()
                certification_skill = CertificationSkill(certification_id=certification.id, skill_id=skill.id)
                db.add(certification_skill)

            db.commit()

        except ValidationError as e:
            raise HTTPException(status_code=400, detail=f"Invalid new_skills format: {e}")

    if media_files is None:
        db.query(CertificationMedia).filter(CertificationMedia.certification_id == certification_id).delete()
        db.commit()
    elif media_files:
        try:
            metadata_list = json.loads(media_metadata) if media_metadata else []
            if len(metadata_list) != len(media_files):
                raise HTTPException(status_code=400, detail="Metadata count must match the number of media files.")

            current_media = db.query(CertificationMedia).filter(CertificationMedia.certification_id == certification_id).all()
            current_media_files = {media.file_url for media in current_media if media.file_url}
            files_to_add = {file.filename for file in media_files} - current_media_files
            files_to_remove = current_media_files - {file.filename for file in media_files}

            if files_to_remove:
                db.query(CertificationMedia).filter(
                    CertificationMedia.certification_id == certification_id,
                    CertificationMedia.file_url.in_(files_to_remove)
                ).delete()

            for idx, file in enumerate(media_files):
                if file.filename in files_to_add:
                    metadata = metadata_list[idx]
                    media_instance = save_certification_media(
                        file=file,
                        certification_id=certification.id,
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
            current_links = db.query(CertificationMedia).filter(CertificationMedia.certification_id == certification_id, CertificationMedia.file_url != None).all()
            current_link_urls = {link.file_url for link in current_links}

            links_to_add = {link_data.get("link") for link_data in link_list} - current_link_urls
            links_to_remove = current_link_urls - {link_data.get("link") for link_data in link_list}

            if links_to_remove:
                db.query(CertificationMedia).filter(
                    CertificationMedia.certification_id == certification_id,
                    CertificationMedia.file_url.in_(links_to_remove)
                ).delete()

            for idx, link_data in enumerate(link_list):
                if link_data.get("link") in links_to_add:
                    media_instance = CertificationMedia(
                        certification_id=certification.id,
                        title=link_data.get("title", f"Link {idx}"),
                        description=link_data.get("description", ""),
                        file_url=link_data.get("link"),
                        order=idx,
                    )
                    db.add(media_instance)

            db.commit()

        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid links format. Must be a JSON array.")

    return {"message": "Certification updated successfully", "certification_id": certification.id}


@router.delete("/certification/", status_code=status.HTTP_200_OK)
async def delete_certification(auth_user_id: int, deleteRequest: CertificationDeleteRequest, db: db_dependency):
    certification = db.query(Certification).filter(Certification.id == deleteRequest.id).first()

    if not certification:
        raise HTTPException(status_code=404, detail="Certification not found")

    if certification.auth_user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this certification entry")
    db.query(CertificationSkill).filter(CertificationSkill.certification_id == deleteRequest.id).delete()
    db.query(CertificationMedia).filter(CertificationMedia.certification_id == deleteRequest.id).delete()
    db.delete(certification)
    db.commit()

    return {"message": f"Certification with ID {deleteRequest.id} and related records deleted successfully"}
