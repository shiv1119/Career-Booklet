from pydantic import BaseModel

class TestScoreDeleteRequest(BaseModel):
    id: int