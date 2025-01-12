import os
from uuid import uuid4
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import shutil
from typing import Optional
from app.core.database import SessionLocal
from app.schema.institution import InstitutionGetResponse
from app.models.institution import Institution

router = APIRouter()

UPLOAD_DIRECTORY = "./uploaded_images/institution_logos"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/institutions", status_code=status.HTTP_201_CREATED)
def create_institution(
    db: Session = Depends(get_db),
    name: str = Form(...),
    full_address: str | None = Form(None),
    website: str | None = Form(None),
    logo: Optional[UploadFile] = File(None),
):
    existing_institution = db.query(Institution).filter(Institution.name == name).first()
    if existing_institution:
        raise HTTPException(status_code=400, detail="Institution with this name already exists.")

    logo_path = None
    if logo:
        try:
            unique_filename = f"{uuid4()}_{logo.filename}"
            logo_path = os.path.join(UPLOAD_DIRECTORY, unique_filename)
            with open(logo_path, "wb") as buffer:
                shutil.copyfileobj(logo.file, buffer)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload logo: {str(e)}")

    new_institution = Institution(
        name=name,
        full_address=full_address,
        website=website,
        logo=logo_path,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(new_institution)
    db.commit()
    db.refresh(new_institution)

    return {
        "message": "Institution created successfully."
    }


@router.get("/institutions/{institution_id}", response_model=InstitutionGetResponse, status_code=status.HTTP_200_OK)
def get_institution(institution_id: int, db: Session = Depends(get_db)):
    institution = db.query(Institution).filter(Institution.id == institution_id).first()

    if not institution:
        raise HTTPException(status_code=404, detail=f"Institution with id {institution_id} does not exists.")
    
    return institution

@router.get("/institutions/", response_model=InstitutionGetResponse, status_code=status.HTTP_200_OK)
def get_institution_by_name(institution_name: str, db: Session = Depends(get_db)):
    institution = db.query(Institution).filter(Institution.name == institution_name).first()

    if not institution:
        raise HTTPException(status_code=404, detail=f"Institution with id {institution_name} does not exists.")
    
    return institution
