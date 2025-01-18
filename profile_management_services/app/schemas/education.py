from pydantic import BaseModel
from typing import List

class NewEducationSkillInput(BaseModel):
    skill_name: List[str]

class ExistingEducationSkillInput(BaseModel):
    skill_id: List[int]

class UserSkillsCreate(BaseModel):
    skills: List[str]

class EducationDeleteRequest(BaseModel):
    id: int