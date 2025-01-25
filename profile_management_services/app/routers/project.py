from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, Body
from typing import List, Optional, Union, Annotated, Dict, Any
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.profile import UserSkill, Skill, Project, ProjectAssociation, ProjectMedia, ProjectSkill, Contributor
from app.schemas.project import ExistingProjectSkillInput, NewProjectSkillInput, MediaMetadata, ProjectDeleteRequest, UserSkillsCreate
from app.utils.helper import save_project_media
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

@router.post("/projects/", status_code=status.HTTP_201_CREATED)
async def create_project(
    db: db_dependency,
    auth_user_id: int = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    start_date: str = Form(...),
    end_date: Optional[str] = Form(None),
    technologies: Optional[str] = Form(None),
    role: Optional[str] = Form(None),
    contributors: Optional[str] = Form(None),
    associations: Optional[str] = Form(None),
    existing_skills: Optional[str] = Form(None),
    new_skills: Optional[str] = Form(None),
    media_files: Optional[List[UploadFile]] = File(None),
    media_metadata: Optional[str] = Form(None),
    links: Optional[str] = Form(None),
):
    project_data = {
        "auth_user_id": auth_user_id,
        "title": title,
        "description": description,
        "start_date": start_date,
        "end_date": end_date,
        "technologies": technologies,
        "role": role,
    }
    project_data = {k: v for k, v in project_data.items() if v is not None}
    project = Project(**project_data)
    db.add(project)
    db.commit()
    db.refresh(project)

    if contributors:
        try:
            contributors_data = json.loads(contributors)
            for contributor in contributors_data:
                new_contributor = Contributor(
                    project_id=project.id,
                    user_id=contributor["user_id"],
                    role=contributor.get("role", "Contributor")
                )
                db.add(new_contributor)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid contributors format. Must be a JSON array.")

    if associations:
        try:
            associations_data = json.loads(associations)
            for association in associations_data:
                new_association = ProjectAssociation(
                    project_id=project.id,
                    associated_type=association["associated_type"],
                    associated_id=association["associated_id"]
                )
                db.add(new_association)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid associations format. Must be a JSON array.")

    if existing_skills:
        try:
            existing_skills_data = ExistingProjectSkillInput.model_validate_json(existing_skills)
            for skill_id in existing_skills_data.skill_id:
                project_skill = ProjectSkill(project_id=project.id, skill_id=skill_id)
                db.add(project_skill)
        except ValidationError as e:
            raise HTTPException(status_code=400, detail=f"Invalid existing_skills format: {e}")

    if new_skills:
        try:
            new_skills_data = NewProjectSkillInput.model_validate_json(new_skills)
            user_skills_data = UserSkillsCreate(skills=new_skills_data.skill_name)
            user_skills_response = create_user_skills(auth_user_id, user_skills_data, db)

            for skill_name in user_skills_response.skills:
                skill = db.query(Skill).filter(Skill.name == skill_name).first()
                project_skill = ProjectSkill(project_id=project.id, skill_id=skill.id)
                db.add(project_skill)
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
                media_instance = save_project_media(
                    file=file,
                    project_id=project.id,
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
                media_instance = ProjectMedia(
                    project_id=project.id,
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

    return {"message": "Project created successfully", "project_id": project.id}


@router.get("/projects/", response_model=List[dict], status_code=status.HTTP_200_OK)
async def get_user_projects(auth_user_id: int, db: db_dependency):
    projects = db.query(Project).filter(Project.auth_user_id == auth_user_id).all()
    
    if not projects:
        raise HTTPException(status_code=404, detail="No projects found for this user.")

    response_data = []
    for project in projects:
        contributors = db.query(Contributor).filter(Contributor.project_id == project.id).all()
        contributor_data = [{"user_id": c.user_id, "role": c.role} for c in contributors]
        associations = db.query(ProjectAssociation).filter(ProjectAssociation.project_id == project.id).all()
        association_data = [{"associated_type": a.associated_type, "associated_id": a.associated_id} for a in associations]

        skills = db.query(Skill).join(ProjectSkill).filter(ProjectSkill.project_id == project.id).all()
        skill_names = [skill.name for skill in skills]

        media_files = db.query(ProjectMedia).filter(ProjectMedia.project_id == project.id).all()
        media_data = []
        link_data = []

        for media in media_files:
            if media.file_url.startswith("http://") or media.file_url.startswith("https://"):
                link_data.append({
                    "title": media.title,
                    "description": media.description,
                    "file_url": media.file_url,
                    "order": media.order,
                })
            else:
                media_data.append({
                    "title": media.title,
                    "description": media.description,
                    "file_url": f"http://127.0.0.1:8000/{media.file_url}",
                    "uploaded_at": media.uploaded_at,
                    "order": media.order,
                })

        project_info = {
            "id": project.id,
            "title": project.title,
            "description": project.description,
            "start_date": project.start_date,
            "end_date": project.end_date,
            "technologies": project.technologies,
            "role": project.role,
            "contributors": contributor_data,
            "associations": association_data,
            "skills": skill_names,
            "media_files": media_data,
            "links": link_data,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
        }
        response_data.append(project_info)

    return response_data

@router.patch("/projects/", status_code=status.HTTP_200_OK)
async def update_project(
    db: db_dependency,
    project_id: int = Form(...),
    auth_user_id: int = Form(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    start_date: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
    technologies: Optional[str] = Form(None),
    role: Optional[str] = Form(None),
    contributors: Optional[str] = Form(None),
    associations: Optional[str] = Form(None),
    existing_skills: Optional[str] = Form(None),
    new_skills: Optional[str] = Form(None),
    media_files: Optional[List[UploadFile]] = File(None),
    media_metadata: Optional[str] = Form(None),
    links: Optional[str] = Form(None),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.auth_user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to update this project")

    if title:
        project.title = title
    if description:
        project.description = description
    if start_date:
        project.start_date = start_date
    if end_date:
        project.end_date = end_date
    if technologies:
        project.technologies = technologies
    if role:
        project.role = role

    db.commit()
    db.refresh(project)

    if contributors:
        try:
            contributors_data = json.loads(contributors)

            if not contributors_data:
                db.query(Contributor).filter(Contributor.project_id == project.id).delete()
                db.commit()
                return {"message": "Contributors cleared."}

            existing_contributors = db.query(Contributor).filter(Contributor.project_id == project.id).all()
            existing_contributors_set = {(contrib.user_id, contrib.role) for contrib in existing_contributors}

            for contributor in contributors_data:
                if "user_id" not in contributor or "role" not in contributor:
                    raise HTTPException(
                        status_code=400, 
                        detail="Each contributor must contain 'user_id' and 'role'."
                    )
                if (contributor["user_id"], contributor["role"]) not in existing_contributors_set:
                    new_contributor = Contributor(
                        project_id=project.id,
                        user_id=contributor["user_id"],
                        role=contributor["role"]
                    )
                    db.add(new_contributor)

            input_contributors_set = {(contributor["user_id"], contributor["role"]) for contributor in contributors_data}
            contributors_to_remove = [
                contrib for contrib in existing_contributors
                if (contrib.user_id, contrib.role) not in input_contributors_set
            ]

            for contrib in contributors_to_remove:
                db.delete(contrib)

            db.commit()

        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid contributors format. Must be a JSON array.")

    if associations:
        try:
            associations_data = json.loads(associations)
            if not associations_data:
                db.query(ProjectAssociation).filter(ProjectAssociation.project_id == project.id).delete()
                db.commit()
                return {"message": "Associations cleared."}

            existing_associations = db.query(ProjectAssociation).filter(ProjectAssociation.project_id == project.id).all()
            existing_associations_set = {
                (assoc.associated_type, assoc.associated_id) for assoc in existing_associations
            }

            for association in associations_data:
                if "associated_type" not in association or "associated_id" not in association:
                    raise HTTPException(
                        status_code=400, 
                        detail="Each association must contain 'associated_type' and 'associated_id'."
                    )
                if (association["associated_type"], association["associated_id"]) not in existing_associations_set:
                    new_association = ProjectAssociation(
                        project_id=project.id,
                        associated_type=association["associated_type"],
                        associated_id=association["associated_id"]
                    )
                    db.add(new_association)

            input_associations_set = {
                (assoc["associated_type"], assoc["associated_id"]) for assoc in associations_data
            }
            associations_to_remove = [
                assoc for assoc in existing_associations 
                if (assoc.associated_type, assoc.associated_id) not in input_associations_set
            ]
            for assoc in associations_to_remove:
                db.delete(assoc)

            db.commit()

        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid associations format. Must be a JSON array.")

    if existing_skills:
        try:
            existing_skills_data = ExistingProjectSkillInput.model_validate_json(existing_skills)
            current_skills = db.query(ProjectSkill).filter(ProjectSkill.project_id == project_id).all()
            current_skill_ids = {skill.skill_id for skill in current_skills}
            skills_to_add = set(existing_skills_data.skill_id) - current_skill_ids
            skills_to_remove = current_skill_ids - set(existing_skills_data.skill_id)

            if skills_to_remove:
                db.query(ProjectSkill).filter(
                    ProjectSkill.project_id == project_id,
                    ProjectSkill.skill_id.in_(skills_to_remove)
                ).delete()

            for skill_id in skills_to_add:
                project_skill = ProjectSkill(project_id=project.id, skill_id=skill_id)
                db.add(project_skill)

            db.commit()

        except ValidationError as e:
            raise HTTPException(status_code=400, detail=f"Invalid existing_skills format: {e}")

    if new_skills:
        try:
            new_skills_data = NewProjectSkillInput.model_validate_json(new_skills)
            user_skills_data = UserSkillsCreate(skills=new_skills_data.skill_name)
            user_skills_response = create_user_skills(auth_user_id, user_skills_data, db)

            for skill_name in user_skills_response.skills:
                skill = db.query(Skill).filter(Skill.name == skill_name).first()
                project_skill = ProjectSkill(project_id=project.id, skill_id=skill.id)
                db.add(project_skill)

            db.commit()

        except ValidationError as e:
            raise HTTPException(status_code=400, detail=f"Invalid new_skills format: {e}")

    if media_files is None:
        db.query(ProjectMedia).filter(ProjectMedia.project_id == project_id).delete()
    elif media_files:
        try:
            metadata_list = json.loads(media_metadata) if media_metadata else []
            if len(metadata_list) != len(media_files):
                raise HTTPException(status_code=400, detail="Metadata count must match the number of media files.")
            
            current_media_files = db.query(ProjectMedia).filter(ProjectMedia.project_id == project_id).all()
            current_media_file_urls = {media.file_url for media in current_media_files}
            
            files_to_add = {file.filename for file in media_files} - current_media_file_urls
            files_to_remove = current_media_file_urls - {file.filename for file in media_files}

            if files_to_remove:
                db.query(ProjectMedia).filter(
                    ProjectMedia.project_id == project_id,
                    ProjectMedia.file_url.in_(files_to_remove)
                ).delete()

            for idx, file in enumerate(media_files):
                if file.filename in files_to_add:
                    metadata = metadata_list[idx] if metadata_list else {}
                    media_instance = save_project_media(
                        file=file,
                        project_id=project.id,
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
            current_links = db.query(ProjectMedia).filter(ProjectMedia.project_id == project_id, ProjectMedia.file_url != None).all()
            current_link_urls = {link.file_url for link in current_links}

            links_to_add = {link_data.get("link") for link_data in link_list} - current_link_urls
            links_to_remove = current_link_urls - {link_data.get("link") for link_data in link_list}

            if links_to_remove:
                db.query(ProjectMedia).filter(
                    ProjectMedia.project_id == project_id,
                    ProjectMedia.file_url.in_(links_to_remove)
                ).delete()

            for idx, link_data in enumerate(link_list):
                if link_data.get("link") in links_to_add:
                    media_instance = ProjectMedia(
                        project_id=project.id,
                        title=link_data.get("title", f"Link {idx}"),
                        description=link_data.get("description", ""),
                        file_url=link_data.get("link"),
                        order=idx,
                    )
                    db.add(media_instance)

            db.commit()

        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid links format. Must be a JSON array.")

    return {"message": "Project updated successfully", "project_id": project.id}

@router.delete("/projects/", status_code=status.HTTP_200_OK)
async def delete_project(auth_user_id: int, deleteRequest: ProjectDeleteRequest, db: db_dependency):
    project = db.query(Project).filter(Project.id == deleteRequest.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.auth_user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this project")
    db.query(ProjectSkill).filter(ProjectSkill.project_id == deleteRequest.id).delete()

    db.query(ProjectMedia).filter(ProjectMedia.project_id == deleteRequest.id).delete()
    db.query(Contributor).filter(Contributor.project_id == deleteRequest.id).delete()

    db.query(ProjectAssociation).filter(ProjectAssociation.project_id == deleteRequest.id).delete()
    db.delete(project)
    db.commit()

    return {"message": f"Project with ID {deleteRequest.id} and related records deleted successfully"}