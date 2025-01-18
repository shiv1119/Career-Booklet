from pydantic import BaseModel, Field
from typing import List, Optional

class NewPositionSkillInput(BaseModel):
    skill_name: List[str]

class ExistingPositionSkillInput(BaseModel):
    skill_id: List[int]


class UserSkillsCreate(BaseModel):
    skills: List[str]

class MediaMetadata(BaseModel):
    title: Optional[str] = Field(None, description="Title of the media file")
    description: Optional[str] = Field(None, description="Description of the media file")

class PositionDeleteRequest(BaseModel):
    id: int