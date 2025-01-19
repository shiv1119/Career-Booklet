from pydantic import BaseModel

class CourseDeleteRequest(BaseModel):
    id: int