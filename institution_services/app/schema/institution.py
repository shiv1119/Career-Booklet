from pydantic import BaseModel, HttpUrl, validator
from datetime import date
from fastapi import Form
from typing import Optional, List

class InstitutionGetResponse(BaseModel):
    name: str
    full_address: Optional[str] = None
    website: Optional[HttpUrl] = None
    logo: Optional[str] = None