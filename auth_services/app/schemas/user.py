from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: EmailStr
    phone_number: str
    roles: str

    class Config:
        from_attributes = True

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class UserActivate(BaseModel):
    email: EmailStr
    otp: str

class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class AuthResponse(UserOut):
    tokens: TokenOut

class RefreshTokenRequest(BaseModel):
    refresh_token: str

