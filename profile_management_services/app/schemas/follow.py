from pydantic import BaseModel

class FollowRequest(BaseModel):
    following_id: int