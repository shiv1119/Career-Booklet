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

class LoginRequest(BaseModel):
    email_or_phone: str
    password: str

class OTPResponse(BaseModel):
    message: str

class EmailCheckRequest(BaseModel):
    email: str


class TokenValidationRequest(BaseModel):
    token: str

class RecoverAccountRequest(BaseModel):
    email: str
    otp: str

class LoginOTPRequest(BaseModel):
    email_or_phone: str
    otp: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str