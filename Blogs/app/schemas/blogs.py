from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, date,timezone

class BlogCreateSchema(BaseModel):
    title: str = Field(..., max_length=300)
    content: str
    status: str
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    tags: str
    new_category: Optional[str] = None
    new_subcategory: Optional[str] = None

class BlogResponseSchema(BaseModel):
    id: int
    title: str
    content: str
    author: int
    author_name: str
    author_profile_image: Optional[str]
    status: str
    category: Optional[str]
    subcategory: Optional[str]
    category_id: Optional[int]
    subcategory_id: Optional[int]
    created_at: str
    updated_at: str
    tags: List[str]
    total_views: int
    total_likes: int
    total_saves: int

    class Config:
        from_attributes = True

class SubCategorySchema(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class CategorySchema(BaseModel):
    id: int
    name: str
    subcategories: List[SubCategorySchema] = []

    class Config:
        from_attributes = True

class TagResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True



