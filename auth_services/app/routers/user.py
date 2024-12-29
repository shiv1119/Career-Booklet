from fastapi import  APIRouter, Depends, status, HTTPException, Path, Response
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from typing import Annotated, Union
from app.schemas.user import UserCreate, UserOut,UserActivate, AuthResponse, TokenOut, RefreshTokenRequest, LoginRequest, OTPResponse, EmailCheckRequest, TokenValidationRequest, RecoverAccountRequest
from app.utils.helpers import generate_otp, mask_email, generate_unique_old_email
from app.auth.jwt import create_access_token, create_refresh_token, verify_password, hash_password, get_current_user, refresh_access_token, oauth2_bearer, verify_token
from datetime import datetime, timezone, timedelta
from sqlalchemy.sql import func
from fastapi.responses import JSONResponse


router = APIRouter()

MAX_AGE=30 * 60
EXPIRES=None
SECURE=True
HTTP_ONLY=True
SAME_SITE="Strict"

MAX_AGE_REFRESH_TOKEN=1 * 24 * 60 * 60
EXPIRES_REFRESH_TOKEN=None

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(db: db_dependency, user: UserCreate):
    db_user = db.query(User).filter(User.email == user.email).first()

    if db_user and db_user.deleted_at:
        new_old_email = generate_unique_old_email(db_user.email, db)
        db_user.email = new_old_email
        db_user.phone_number = None
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    else:
        if db_user and db_user.is_active is False:
            raise HTTPException(status_code=400, detail="An account with this email is registered but not activated. Try activation")
        elif db_user:
            raise HTTPException(status_code=400, detail="Email is registered. Try logging it")


    exists_user = db.query(User).filter(User.phone_number == user.phone_number).first()
    if exists_user:
        email_masked = mask_email(exists_user.email)
        raise HTTPException(status_code=400, detail=f"This phone number is already registered with email{email_masked}")
    hashed_password = hash_password(user.password)
    new_user = User(
        email=user.email,
        phone_number=user.phone_number,
        password=hashed_password,
        roles=user.roles,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/user/activate", response_model=AuthResponse, status_code=status.HTTP_200_OK)
async def user_activation(db: db_dependency, user: UserActivate, response: Response):
    db_user = db.query(User).filter(User.email == user.email).first()
    
    if db_user is None:
        raise HTTPException(status_code=400, detail="Email is not registered")
    if db_user.is_active and not db_user.deleted_at:
        raise HTTPException(status_code=400, detail="The account is already active. Try logging in")

    if not verify_otp(db_user.id, user.otp, db):
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    db_user.is_active = True
    user.otp=None
    db.commit()
    db.refresh(db_user)

    generated_tokens = generate_tokens(db_user)
    access_token = generated_tokens.tokens.access_token
    if access_token:
        response.set_cookie(
            key="access_token",
            value=access_token,
            max_age=MAX_AGE,
            expires=EXPIRES,
            secure=SECURE,
            httponly=HTTP_ONLY,
            samesite=SAME_SITE
        )

    refresh_token = generated_tokens.tokens.refresh_token
    if refresh_token:
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            max_age=MAX_AGE_REFRESH_TOKEN,
            expires=EXPIRES_REFRESH_TOKEN,
            secure=SECURE,
            httponly=HTTP_ONLY,
            samesite=SAME_SITE,
        )

    return generated_tokens



@router.get("/user/{user_id}", status_code=status.HTTP_200_OK, response_model=UserOut) 
async def get_user(db: db_dependency, user_id: int = Path(gt=0)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if db_user.is_active == False:
        raise HTTPException(status_code=400, detail="User not found")
    
    if db_user.deleted_at:
        raise HTTPException(status_code=400, detail="User not found")
    
    return db_user



def generate_tokens(user: User) -> AuthResponse:
    user_data = {
        "id": user.id,
        "email": user.email,
        "phone_number": user.phone_number,
        "roles": user.roles,
    }

    tokens = TokenOut(
        access_token=create_access_token(user_data),
        refresh_token=create_refresh_token(user_data),
        token_type="bearer"
    )
    return AuthResponse(**user_data, tokens=tokens)


@router.post("/auth/login-password", response_model=Union[AuthResponse, OTPResponse], status_code=status.HTTP_200_OK)
async def login_with_password(login_request: LoginRequest, db: db_dependency, response: Response):
    email_or_phone = login_request.email_or_phone
    password = login_request.password
    user = db.query(User).filter(
        (User.email == email_or_phone) | (User.phone_number == email_or_phone)
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account is not active")

    if user.deleted_at:
        raise HTTPException(status_code=400, detail="User account not found")

    if not verify_password(password, user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if user.is_multi_factor:
        await send_otp(user.email, "multi_factor_login", db)
        return JSONResponse(content={
            "message": "This otp send for multi-factor verification",
            "multi-factor": True
        })

    generated_tokens = generate_tokens(user)
    access_token = generated_tokens.tokens.access_token
    if access_token:
        response.set_cookie(
            key="access_token",
            value=access_token,
            max_age=MAX_AGE,
            expires=EXPIRES,
            secure=SECURE,
            httponly=HTTP_ONLY,
            samesite=SAME_SITE
        )

    refresh_token = generated_tokens.tokens.refresh_token
    if refresh_token:
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            max_age=MAX_AGE_REFRESH_TOKEN,
            expires=EXPIRES_REFRESH_TOKEN,
            secure=SECURE,
            httponly=HTTP_ONLY,
            samesite=SAME_SITE,
        )

    return generated_tokens


def verify_otp(user_id: id, otp: str, db: Session):
    user = db.query(User).filter(User.id==user_id).first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    
    if user.otp_expiry:
        user_otp_expiry_aware = user.otp_expiry.astimezone(timezone.utc)
    else:
        user_otp_expiry_aware = None

    current_time = datetime.now(timezone.utc)
    if user_otp_expiry_aware and user_otp_expiry_aware < current_time:
        user.otp = None
        db.commit()
        raise HTTPException(status_code=400, detail="OTP has expired")    

    if user.otp != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    return True


@router.post("/auth/login-otp", response_model=AuthResponse, status_code=status.HTTP_200_OK)
async def login_with_otp(email_or_phone: str, otp: str, db: db_dependency, response: Response):
    user = db.query(User).filter(
        (User.email == email_or_phone) | (User.phone_number == email_or_phone)
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account is not active")
    
    if user.deleted_at:
        raise HTTPException(status_code=400, detail="User account not found")

    if not verify_otp(user.id, otp, db):
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    user.otp=None
    user.otp_expiry=None
    db.commit()

    generated_tokens = generate_tokens(user)
    access_token = generated_tokens.tokens.access_token
    if access_token:
        response.set_cookie(
            key="access_token",
            value=access_token,
            max_age=MAX_AGE,
            expires=EXPIRES,
            secure=SECURE,
            httponly=HTTP_ONLY,
            samesite=SAME_SITE
        )

    refresh_token = generated_tokens.tokens.refresh_token
    if refresh_token:
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            max_age=MAX_AGE_REFRESH_TOKEN,
            expires=EXPIRES_REFRESH_TOKEN,
            secure=SECURE,
            httponly=HTTP_ONLY,
            samesite=SAME_SITE,
        )

    return generated_tokens



@router.post("/auth/send-otp", status_code=status.HTTP_200_OK)
async def send_otp(email_or_phone: str, purpose: str, db: db_dependency):
    user = db.query(User).filter(
        (User.email == email_or_phone) | (User.phone_number == email_or_phone)
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    
    if user.deleted_at and purpose != "recover_account":
        raise HTTPException(status_code=400, detail="User not found")

    otp = generate_otp(6)
    user.otp = otp
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=3)
    user.otp_expiry = otp_expiry
    db.commit()
    db.refresh(user)
    
    if purpose == "login":
        print("OTP sent for login is", otp)

    elif purpose == "activation":
        if not user.is_active:
            print("OTP sent for activation is", otp)
        else:
            raise HTTPException(status_code=400, detail="Account already activated. You can not send otp")

    elif purpose == "reset_password":
        print("OTP sent for password reset is", otp)

    elif purpose == "delete_account":
        print("OTP sent for delete account is", otp)

    elif purpose == "deactivate_account":
        if user.is_active:
            print("OTP sent for account deactivation is", otp)
        else:
            raise HTTPException(status_code=400, detail="Account is already deactivated")

    elif purpose == "recover_account":
        print("OTP sent for recover account is", otp)

    elif purpose == "update_phone_number":
        print("OTP sent for update_phone_number is", otp)

    elif purpose == "multi_factor_login":
        print("OTP sent for Multi-factor login is", otp)

    else:
        raise HTTPException(status_code=400, detail="Invalid OTP purpose")

    return {"message": f"OTP sent successfully for {purpose}."}


@router.post("/auth/refresh-token")
async def refresh_token_view(refresh_token: RefreshTokenRequest):
    new_access_token= refresh_access_token(refresh_token.refresh_token)
    response = JSONResponse(content={"message": "Token refreshed"})
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=HTTP_ONLY,
        secure=SECURE,
        max_age=MAX_AGE,
        samesite="Strict",
    )
    print(response)
    return response


@router.post("/auth/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(user_id: int, otp: str, new_password: str, db: db_dependency):
    user = db.query(User).filter(
        (User.id == user_id)
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    
    if not verify_otp(user.id, otp, db):
        raise HTTPException(status_code=400, detail="Invalid OTP for reset password")
    
    user.password = hash_password(new_password)
    user.otp=None
    user.otp_expiry=None
    db.commit()

    return {"message": "Password has been successfully reset."}

@router.post("/auth/update-phone-number", status_code=status.HTTP_200_OK)
async def update_phone_number(user_id: int, otp: str, new_phone_number: str, db: db_dependency):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    
    if not verify_otp(user.id, otp, db):
        raise HTTPException(status_code=400, detail="Invalid OTP for reset password")
    
    user.phone_number=new_phone_number
    user.otp=None
    user.otp_expiry=None
    db.commit()

    return {"message": "Phone number has been successfully updated."}

@router.post("/auth/deactivate-account", status_code=status.HTTP_200_OK)
async def deactivate_account(user_id: int, otp: str, db: db_dependency):

    user = db.query(User).filter(
        User.id==user_id
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    
    if user.deleted_at:
        raise HTTPException(status_code=400, detail="User not found")
    
    if not verify_otp(user.id, otp, db):
        raise HTTPException(status_code=400, detail="Invalid OTP for deactivate account")
    
    user.is_active = False
    user.otp=None
    user.otp_expiry=None
    db.commit()
    db.refresh(user)

    return {"message": "Account deactivated successfully."}


@router.post("/auth/recover-account", status_code=status.HTTP_200_OK)
async def recover_account(recover_request: RecoverAccountRequest, db: db_dependency, response: Response):
    user = db.query(User).filter(User.email == recover_request.email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_otp(user.id, recover_request.otp, db):
        raise HTTPException(status_code=400, detail="Invalid OTP for delete account")
    
    user.is_active = True
    user.deleted_at = None
    db.add(user)
    db.commit()

    generated_tokens = generate_tokens(user)
    access_token = generated_tokens.tokens.access_token
    if access_token:
        response.set_cookie(
            key="access_token",
            value=access_token,
            max_age=MAX_AGE,
            expires=EXPIRES,
            secure=SECURE,
            httponly=HTTP_ONLY,
            samesite=SAME_SITE
        )

    refresh_token = generated_tokens.tokens.refresh_token
    if refresh_token:
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            max_age=MAX_AGE_REFRESH_TOKEN,
            expires=EXPIRES_REFRESH_TOKEN,
            secure=SECURE,
            httponly=HTTP_ONLY,
            samesite=SAME_SITE,
        )

    return generated_tokens


@router.delete("/auth/delete-account", status_code=status.HTTP_200_OK)
async def delete_account(user_id: int, otp: str, db: db_dependency):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_otp(user.id, otp, db):
        raise HTTPException(status_code=400, detail="Invalid OTP for delete account")
    
    user.is_active=False
    user.deleted_at = func.now()
    db.add(user)
    db.commit()

    return {"message": "Account deleted successfully."}


@router.post("/auth/enable-mfa", status_code=status.HTTP_200_OK)
async def enable_mfa(user_id: int, enable: bool, db: db_dependency):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.deleted_at:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.is_active:
        raise HTTPException(status_code=404, detail="User account is not activated")

    user.is_multi_factor = enable
    db.commit()
    status_message = "enabled" if enable else "disabled"
    return {"message": f"Multi-factor authentication {status_message}."}


@router.post("/auth/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response):
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")

    return {"message": "Logged out successfully."}


@router.post("/check-user", status_code=status.HTTP_200_OK)
async def check_user(email_data: EmailCheckRequest, db: db_dependency):
    user = db.query(User).filter(User.email == email_data.email).first()
    if user and user.deleted_at:
        return {
            "message": "Account exists. Do you want to recover?",
            "exists": True,
            "deleted": True
        }
    if user and not user.is_active:
        return {
            "message": "This email already exists, but the account is not activated",
            "exists": True,
            "activated": False
        }
    if user:
        return {
            "message": "Account exists with this email.",
            "exists": True,
            "activated": True
        }

    return {
        "message": "User does not exist",
        "exists": False
    }


@router.post("/validate-token")
async def validate_token(request: TokenValidationRequest, db:db_dependency):
    payload = verify_token(request.token)
    user_id = payload.get("id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user_id or not user:
        raise HTTPException(status_code=401, detail="Invalid token or user not found.")

    return {"user_id": user_id}





