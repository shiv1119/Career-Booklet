from pydantic import BaseModel, Field
from typing import List, Optional

class NewProjectSkillInput(BaseModel):
    skill_name: List[str]

class ExistingProjectSkillInput(BaseModel):
    skill_id: List[int]


class UserSkillsCreate(BaseModel):
    skills: List[str]

class MediaMetadata(BaseModel):
    title: Optional[str] = Field(None, description="Title of the media file")
    description: Optional[str] = Field(None, description="Description of the media file")

class ProjectDeleteRequest(BaseModel):
    id: int