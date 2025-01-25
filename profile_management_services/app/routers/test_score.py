from fastapi import APIRouter, Depends, Form, HTTPException, status, Body
from typing import List, Optional, Union, Annotated, Dict, Any
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.profile import TestScore, TestScoreAssociation
from app.schemas.test_score import TestScoreDeleteRequest
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

@router.post("/test-score/", status_code=status.HTTP_201_CREATED)
async def create_test_score(
    db: db_dependency,
    auth_user_id: int = Form(...),
    title: str = Form(...),
    score: str = Form(...),
    test_date: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    associations: Optional[str] = Form(None)
):
    test_score_data = {
        "auth_user_id": auth_user_id,
        "title": title, 
        "score": score,
        "test_date": test_date,
        "description": description,
    }
    test_score_data = {k: v for k, v in test_score_data.items() if v is not None}
    test = TestScore(**test_score_data)
    db.add(test)
    db.commit()
    db.refresh(test)

    if associations:
        try:
            associations_data = json.load(associations)
            for associations in associations_data:
                new_association = TestScoreAssociation(
                    test_score_id= test.id,
                    associated_type=associations["associated_type"],
                    associated_id=associations["associated_id"]
                )
                db.add(new_association)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid association format. Must be a JSON array.")
    db.commit()

    return {"message": "Test score created successfully", "test_score_id": test.id}


@router.get("/test-score/", response_model=List[dict], status_code=status.HTTP_200_OK)
async def get_test_scores(auth_user_id: int, db: db_dependency):
    tests = db.query(TestScore).filter(TestScore.auth_user_id == auth_user_id).all()

    if not tests:
        raise HTTPException(status_code=404, detail="No test scores found for this user")
    response_data = []

    for test in tests:
        associations = db.query(TestScoreAssociation).filter(TestScoreAssociation.test_score_id == test.id).all()
        association_data = [{"associated_type": a.associated_type, "associated_id": a.associated_id} for a in associations]
        test_info = {
            "id": test.id,
            "title": test.title,
            "score": test.score,
            "test_date": test.test_date,
            "description": test.description,
            "associations": association_data,
            "created_at": test.created_at,
            "updated_at": test.updated_at,
        }

        response_data.append(test_info)
    
    return response_data

@router.patch("/test-score/", status_code=status.HTTP_200_OK)
async def update_test_score(
    db: db_dependency,
    test_score_id: int = Form(...),
    auth_user_id: int = Form(...),
    title: Optional[str] = Form(None),
    score: Optional[str] = Form(None),
    test_date: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    associations: Optional[str] = Form(None)
): 
    
    test = db.query(TestScore).filter(TestScore.id == test_score_id).first()

    if not test:
        raise HTTPException(status_code=404, detail="Test score not found")
    
    if test.auth_user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to update the test")
    
    if title:
        test.title = title
    if score:
        test.score = score
    if test_date:
        test.test_date = test_date
    if description:
        test.description = description
    
    db.commit()
    db.refresh(test)

    if associations:
        try:
            associations_data = json.loads(associations)
            if not associations_data:
                db.query(TestScoreAssociation).filter(TestScoreAssociation.test_score_id == test.id).delete()
                db.commit()
                return {"message": "Associations cleared."}
            existing_associations = db.query(TestScoreAssociation).filter(TestScoreAssociation.test_score_id == test.id).all()
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
                    new_association = TestScoreAssociation(
                        test_score_id=test.id,
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
    else:
        db.query(TestScoreAssociation).filter(TestScoreAssociation.test_score_id == test.id).delete()
        db.commit()

    return {"message": "Test Score updated successfully", "test_score_id": test.id}

@router.delete("/test-score/", status_code=status.HTTP_200_OK)
async def delete_test_score(db: db_dependency, auth_user_id: int, deleteRequest: TestScoreDeleteRequest):
    test = db.query(TestScore).filter(TestScore.id == deleteRequest.id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test score not found")
    if test.auth_user_id != auth_user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this test score")
    db.query(TestScoreAssociation).filter(TestScoreAssociation.test_score_id == deleteRequest.id).delete()
    db.delete(test)
    db.commit()

    return {"message": f"Test Score with ID {deleteRequest.id} and associated records deleted successfully"}