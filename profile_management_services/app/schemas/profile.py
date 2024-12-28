from pydantic import BaseModel, HttpUrl, validator
from datetime import date
from fastapi import Form
from typing import Optional

class UserProfileCreateRequest(BaseModel):
    auth_user_id: int
    full_name: str
    additional_name: str | None = None
    pronouns: str | None = None
    date_of_birth: Optional[date] = None
    gender: str | None = None
    country: str | None = None
    city: str | None = None
    full_address: str | None = None
    website: Optional[HttpUrl] = None

    @validator("website", pre=True, always=True)
    def validate_website(cls, value):
        if value and not value.startswith(("http://", "https://")):
            raise ValueError("Website must be a valid URL starting with http:// or https://")
        return value

    @classmethod
    def as_form(
            cls,
            auth_user_id: int = Form(...),
            full_name: str = Form(...),
            additional_name: str | None = Form(None),
            pronouns: str | None = Form(None),
            date_of_birth: date | None = Form(None),
            gender: str | None = Form(None),
            country: str | None = Form(None),
            city: str | None = Form(None),
            full_address: str | None = Form(None),
            website: str | None = Form(None)
    ):
        return cls(
            auth_user_id=auth_user_id,
            full_name=full_name,
            additional_name=additional_name,
            pronouns=pronouns,
            date_of_birth=date_of_birth,
            gender=gender,
            country=country,
            city=city,
            full_address=full_address,
            website=website
        )

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


