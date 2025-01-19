from pydantic import BaseModel, Field
from typing import List, Optional

class NewCertificationSkillInput(BaseModel):
    skill_name: List[str]

class ExistingCertificationSkillInput(BaseModel):
    skill_id: List[int]


class UserSkillsCreate(BaseModel):
    skills: List[str]

class MediaMetadata(BaseModel):
    title: Optional[str] = Field(None, description="Title of the media file")
    description: Optional[str] = Field(None, description="Description of the media file")

class CertificationDeleteRequest(BaseModel):
    id: int