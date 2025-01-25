from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Body
from typing import List, Optional, Union, Annotated, Dict, Any
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.profile import UserSkill, Skill, Position, PositionMedia, PositionSkill
from app.schemas.position import ExistingPositionSkillInput, NewPositionSkillInput, UserSkillsCreate, PositionDeleteRequest
from app.utils.helper import save_position_media
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

@router.post("/position/", status_code=status.HTTP_201_CREATED)
async def create_position(
    db: db_dependency,
    auth_user_id: int = Form(...),
    company_id: Optional[int] = Form(None),
    title: str = Form(...),
    employment_type: Optional[str] = Form(None),
    start_date: str = Form(...),
    end_date: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    location_type: Optional[str] = Form(None),
    profile_headline: Optional[str] = Form(None),
    found_platform: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    existing_skills: Optional[str] = Form(None),
    new_skills: Optional[str] = Form(None),
    media_files: Optional[List[UploadFile]] = File(None),
    media_metadata: Optional[str] = Form(None),
    links: Optional[str] = Form(None),
):
    position_data = {
        "auth_user_id": auth_user_id,
        "company_id": company_id,
        "title": title,
        "employment_type": employment_type,
        "start_date": start_date,
        "end_date": end_date,
        "location": location,
        "location_type": location_type,
        "profile_headline": profile_headline,
        "found_platform": found_platform,
        "description": description,
    }
    position_data = {k: v for k, v in position_data.items() if v is not None}
    position = Position(**position_data)
    db.add(position)
    db.commit()
    db.refresh(position)
    if existing_skills:
        try:
            existing_skills_data = ExistingPositionSkillInput.model_validate_json(existing_skills)
            for skill_id in existing_skills_data.skill_id:
                position_skill = PositionSkill(position_id=position.id, skill_id=skill_id)
                db.add(position_skill)
        except ValidationError as e:
            raise HTTPException(status_code=400, detail=f"Invalid existing_skills format: {e}")
    if new_skills:
        try:
            new_skills_data = NewPositionSkillInput.model_validate_json(new_skills)
            user_skills_data = UserSkillsCreate(skills=new_skills_data.skill_name)
            user_skills_response = create_user_skills(auth_user_id, user_skills_data, db)

            for skill_name in user_skills_response.skills:
                skill = db.query(Skill).filter(Skill.name == skill_name).first()
                position_skill = PositionSkill(position_id=position.id, skill_id=skill.id)
                db.add(position_skill)
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
                media_instance = save_position_media(
                    file=file,
                    position_id=position.id,
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
                media_instance = PositionMedia(
                    position_id=position.id,
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

    return {"message": "Position created successfully", "position_id": position.id}


@router.get("/position/", response_model=List[dict], status_code=status.HTTP_200_OK)
async def get_user_position(auth_user_id: int, db: db_dependency):
    position_entries = db.query(Position).filter(Position.auth_user_id == auth_user_id).all()
    
    if not position_entries:
        raise HTTPException(status_code=404, detail="No position entries found for this user.")
    
    response_data = []

    for position in position_entries:
        skills = db.query(Skill).join(PositionSkill).filter(PositionSkill.position_id == position.id).all()
        skill_names = [skill.name for skill in skills]
        media_files = db.query(PositionMedia).filter(PositionMedia.position_id == position.id).all()
        
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
        
        position_info = {
            "id": position.id,
            "title": position.title,
            "employment_type": position.employment_type,
            "start_date": position.start_date,
            "end_date": position.end_date,
            "location": position.location,
            "location_type": position.location_type,
            "profile_headline": position.profile_headline,
            "found_platform": position.found_platform,
            "description": position.description,
            "skills": skill_names,
            "media_files": media_data,
            "links": link_data,
            "created_at": position.created_at,
            "updated_at": position.updated_at
        }
        
        response_data.append(position_info)

    return response_data


@router.patch("/position/", status_code=status.HTTP_200_OK)
async def update_position(
    db: db_dependency,
    position_id: int = Form(...),
    auth_user_id: int = Form(...),
    company_id: Optional[int] = Form(None),
    title: Optional[str] = Form(None),
    employment_type: Optional[str] = Form(None),
    start_date: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    location_type: Optional[str] = Form(None),
    profile_headline: Optional[str] = Form(None),
    found_platform: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    existing_skills: Optional[str] = Form(None),
    new_skills: Optional[str] = Form(None),
    media_files: Optional[List[UploadFile]] = File(None),
    media_metadata: Optional[str] = Form(None),
    links: Optional[str] = Form(None),
):
    position = db.query(Position).filter(Position.id == position_id).first()
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")

    if position.auth_user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to update this position entry")

    if company_id:
        position.company_id = company_id
    if title:
        position.title = title
    if employment_type:
        position.employment_type = employment_type
    if start_date:
        position.start_date = start_date
    if end_date:
        position.end_date = end_date
    if location:
        position.location = location
    if location_type:
        position.location_type = location_type
    if profile_headline:
        position.profile_headline = profile_headline
    if found_platform:
        position.found_platform = found_platform
    if description:
        position.description = description

    db.commit()
    db.refresh(position)

    if existing_skills:
        try:
            existing_skills_data = ExistingPositionSkillInput.model_validate_json(existing_skills)
            current_skills = db.query(PositionSkill).filter(PositionSkill.position_id == position_id).all()
            current_skill_ids = {skill.skill_id for skill in current_skills}
            skills_to_add = set(existing_skills_data.skill_id) - current_skill_ids
            skills_to_remove = current_skill_ids - set(existing_skills_data.skill_id)

            if skills_to_remove:
                db.query(PositionSkill).filter(
                    PositionSkill.position_id == position_id,
                    PositionSkill.skill_id.in_(skills_to_remove)
                ).delete()

            for skill_id in skills_to_add:
                position_skill = PositionSkill(position_id=position.id, skill_id=skill_id)
                db.add(position_skill)

            db.commit()

        except ValidationError as e:
            raise HTTPException(status_code=400, detail=f"Invalid existing_skills format: {e}")

    if new_skills:
        try:
            new_skills_data = NewPositionSkillInput.model_validate_json(new_skills)
            user_skills_data = UserSkillsCreate(skills=new_skills_data.skill_name)
            user_skills_response = create_user_skills(auth_user_id, user_skills_data, db)

            for skill_name in user_skills_response.skills:
                skill = db.query(Skill).filter(Skill.name == skill_name).first()
                position_skill = PositionSkill(position_id=position.id, skill_id=skill.id)
                db.add(position_skill)

            db.commit()

        except ValidationError as e:
            raise HTTPException(status_code=400, detail=f"Invalid new_skills format: {e}")

    if media_files is None:
        db.query(PositionMedia).filter(PositionMedia.position_id == position_id).delete()
        db.commit()
    elif media_files:
        try:
            metadata_list = json.loads(media_metadata) if media_metadata else []
            if len(metadata_list) != len(media_files):
                raise HTTPException(status_code=400, detail="Metadata count must match the number of media files.")

            current_media = db.query(PositionMedia).filter(PositionMedia.position_id == position_id).all()
            current_media_files = {media.file_url for media in current_media if media.file_url}
            files_to_add = {file.filename for file in media_files} - current_media_files
            files_to_remove = current_media_files - {file.filename for file in media_files}

            if files_to_remove:
                db.query(PositionMedia).filter(
                    PositionMedia.position_id == position_id,
                    PositionMedia.file_url.in_(files_to_remove)
                ).delete()

            for idx, file in enumerate(media_files):
                if file.filename in files_to_add:
                    metadata = metadata_list[idx]
                    media_instance = save_position_media(
                        file=file,
                        position_id=position.id,
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
            current_links = db.query(PositionMedia).filter(PositionMedia.position_id == position_id, PositionMedia.file_url != None).all()
            current_link_urls = {link.file_url for link in current_links}

            links_to_add = {link_data.get("link") for link_data in link_list} - current_link_urls
            links_to_remove = current_link_urls - {link_data.get("link") for link_data in link_list}

            if links_to_remove:
                db.query(PositionMedia).filter(
                    PositionMedia.position_id == position_id,
                    PositionMedia.file_url.in_(links_to_remove)
                ).delete()

            for idx, link_data in enumerate(link_list):
                if link_data.get("link") in links_to_add:
                    media_instance = PositionMedia(
                        position_id=position.id,
                        title=link_data.get("title", f"Link {idx}"),
                        description=link_data.get("description", ""),
                        file_url=link_data.get("link"),
                        order=idx,
                    )
                    db.add(media_instance)

            db.commit()

        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid links format. Must be a JSON array.")

    return {"message": "Position updated successfully", "position_id": position.id}


@router.delete("/position/", status_code=status.HTTP_200_OK)
async def delete_position(auth_user_id: int, deleteRequest: PositionDeleteRequest, db: db_dependency):
    position = db.query(Position).filter(Position.id == deleteRequest.id).first()
    if position.auth_user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this position entry")
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")

    db.query(PositionSkill).filter(PositionSkill.position_id == deleteRequest.id).delete()
    db.query(PositionMedia).filter(PositionMedia.position_id == deleteRequest.id).delete()
    db.delete(position)

    db.commit()

    return {"message": f"Position with ID {deleteRequest.id} and related records deleted successfully"}
