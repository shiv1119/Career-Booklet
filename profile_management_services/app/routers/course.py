from fastapi import APIRouter, Depends, Form, HTTPException, status, Body
from typing import List, Optional, Union, Annotated, Dict, Any
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.profile import Course, CourseAssociation
from app.schemas.course import CourseDeleteRequest
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

@router.post("/courses/", status_code=status.HTTP_201_CREATED)
async def create_course(
    db: db_dependency,
    auth_user_id: int = Form(...),
    name: str = Form(...),
    number: Optional[str] = Form(None),
    associations: Optional[str] = Form(None),
):
    course_data = {
        "auth_user_id": auth_user_id,
        "name": name,
        "number": number,
    }
    course_data = {k: v for k, v in course_data.items() if v is not None}
    course = Course(**course_data)
    db.add(course)
    db.commit()
    db.refresh(course)
    if associations:
        try:
            associations_data = json.loads(associations)
            for association in associations_data:
                new_association = CourseAssociation(
                    course_id=course.id,
                    associated_type=association["associated_type"],
                    associated_id=association["associated_id"]
                )
                db.add(new_association)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid associations format. Must be a JSON array.")

    db.commit()

    return {"message": "Course created successfully", "course_id": course.id}


@router.get("/courses/", response_model=List[dict], status_code=status.HTTP_200_OK)
async def get_user_courses(auth_user_id: int, db: db_dependency):
    courses = db.query(Course).filter(Course.auth_user_id == auth_user_id).all()

    if not courses:
        raise HTTPException(status_code=404, detail="No courses found for this user.")

    response_data = []
    for course in courses:
        associations = db.query(CourseAssociation).filter(CourseAssociation.course_id == course.id).all()
        association_data = [{"associated_type": a.associated_type, "associated_id": a.associated_id} for a in associations]
        course_info = {
            "id": course.id,
            "name": course.name,
            "number": course.number,
            "associations": association_data,
            "created_at": course.created_at,
            "updated_at": course.updated_at,
        }
        response_data.append(course_info)

    return response_data

@router.patch("/courses/", status_code=status.HTTP_200_OK)
async def update_course(
    db: db_dependency,
    course_id: int = Form(...),
    auth_user_id: int = Form(...),
    name: Optional[str] = Form(None),
    number: Optional[str] = Form(None),
    associations: Optional[str] = Form(None),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.auth_user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to update this course")
    if name:
        course.name = name
    if number:
        course.number = number

    db.commit()
    db.refresh(course)
    if associations:
        try:
            associations_data = json.loads(associations)
            db.query(CourseAssociation).filter(CourseAssociation.course_id == course.id).delete()
            db.commit()

            for association in associations_data:
                new_association = CourseAssociation(
                    course_id=course.id,
                    associated_type=association["associated_type"],
                    associated_id=association["associated_id"]
                )
                db.add(new_association)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid associations format. Must be a JSON array.")

    db.commit()

    return {"message": "Course updated successfully", "course_id": course.id}



@router.delete("/courses/", status_code=status.HTTP_200_OK)
async def delete_course(db: db_dependency, auth_user_id: int, deleteRequest: CourseDeleteRequest):
    course = db.query(Course).filter(Course.id == deleteRequest.id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.auth_user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this course")
    db.query(CourseAssociation).filter(CourseAssociation.course_id == deleteRequest.id).delete()
    db.delete(course)
    db.commit()

    return {"message": f"Course with ID {deleteRequest.id} and associated records deleted successfully"}