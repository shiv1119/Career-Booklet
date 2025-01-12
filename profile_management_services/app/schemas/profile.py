from pydantic import BaseModel, HttpUrl, validator
from datetime import date
from fastapi import Form
from typing import Optional, List

class UserProfileCreateRequest(BaseModel):
    full_name: str
    additional_name: Optional[str] = None
    pronouns: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    full_address: Optional[str] = None
    website: Optional[HttpUrl] = None
    class Config:
        from_attributes = True

class UserProfileGetResponse(BaseModel):
    auth_user_id: int
    full_name: str
    additional_name: Optional[str] = None
    pronouns: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    full_address: Optional[str] = None
    website: Optional[HttpUrl] = None
    profile_image: Optional[str] = None
    profile_background_image: Optional[str] = None

    class Config:
        from_attributes = True


class UserProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    additional_name: Optional[str] = None
    pronouns: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    full_address: Optional[str] = None
    website: Optional[str] = None

class AboutUserCreate(BaseModel):
    about: Optional[str] = None

    class Config:
        from_attributes = True

class AboutUserUpdate(BaseModel):
    about: Optional[str] = None

    class Config:
        from_attributes = True

class AboutUserGetRequest(BaseModel):
    id: int
    about: Optional[str] = None

    class Config:
        from_attributes = True

class SkillCreate(BaseModel):
    name: str

    class Config:
        from_attributes = True

class SkillGet(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class UserSkillsUpdate(BaseModel):
    skills: List[int]
    skill_order: List[int]

    class Config:
        from_attributes = True


