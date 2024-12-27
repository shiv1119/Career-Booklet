from fastapi import  APIRouter, Depends, status, HTTPException, Path
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from typing import Annotated
from app.schemas.user import UserCreate, UserOut,UserActivate, AuthResponse, TokenOut, RefreshTokenRequest, LoginRequest
from app.utils.helpers import generate_otp, mask_email
from app.auth.jwt import create_access_token, create_refresh_token, verify_password, hash_password, get_current_user, refresh_access_token
from datetime import datetime, timezone, timedelta
from sqlalchemy.sql import func

router = APIRouter()

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
async def user_activation(db: db_dependency, user: UserActivate):
    db_user = db.query(User).filter(User.email == user.email).first()
    
    if db_user is None:
        raise HTTPException(status_code=400, detail="Email is not registered")
    if db_user.is_active and not db_user.deleted_at:
        raise HTTPException(status_code=400, detail="The account is already active. Try logging in")

    if not verify_otp(user.email, user.otp, db):
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    db_user.is_active = True
    user.otp=None
    db.commit()
    db.refresh(db_user)
    
    return generate_tokens(db_user)



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
        "is_active": user.is_active
    }
    
    tokens = TokenOut(
        access_token=create_access_token(user_data),
        refresh_token=create_refresh_token(user_data),
        token_type="bearer"
    )
    
    return AuthResponse(**user_data, tokens=tokens)



@router.post("/auth/login-password", response_model=AuthResponse, status_code=status.HTTP_200_OK)
def login_with_password(login_request: LoginRequest, db: db_dependency):
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

    return generate_tokens(user)


def verify_otp(email_or_phone: str, otp: str, db: Session):
    user = db.query(User).filter(
        (User.email == email_or_phone) | (User.phone_number == email_or_phone)
    ).first()

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
def login_with_otp(email_or_phone: str, otp: str, db: db_dependency):
    user = db.query(User).filter(
        (User.email == email_or_phone) | (User.phone_number == email_or_phone)
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account is not active")
    
    if user.deleted_at:
        raise HTTPException(status_code=400, detail="User account not found")

    if not verify_otp(email_or_phone, otp, db): 
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    user.otp=None
    user.otp_expiry=None
    db.commit()

    return generate_tokens(user)



@router.post("/auth/send-otp", status_code=status.HTTP_200_OK)
def send_otp(email_or_phone: str, purpose: str, db: db_dependency):
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
    else:
        raise HTTPException(status_code=400, detail="Invalid OTP purpose")

    return {"message": f"OTP sent successfully for {purpose}."}


@router.post("/auth/refresh-token")
def refresh_token_view(refresh_token: RefreshTokenRequest):
    return {"access_token": refresh_access_token(refresh_token.refresh_token)}


@router.post("/auth/reset-password", status_code=status.HTTP_200_OK)
def reset_password(email_or_phone: str, otp: str, new_password: str, db: db_dependency):
    user = db.query(User).filter(
        (User.email == email_or_phone) | (User.phone_number == email_or_phone)
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    
    if not verify_otp(email_or_phone, otp, db):
        raise HTTPException(status_code=400, detail="Invalid OTP for reset password")
    
    user.password = hash_password(new_password)
    user.otp=None
    user.otp_expiry=None
    db.commit()

    return {"message": "Password has been successfully reset."}

@router.post("/auth/update-phone-number", status_code=status.HTTP_200_OK)
def update_phone_number(email: str, otp: str, new_phone_number: str, db: db_dependency):
    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    
    if not verify_otp(email, otp, db):
        raise HTTPException(status_code=400, detail="Invalid OTP for reset password")
    
    user.phone_number=new_phone_number
    user.otp=None
    user.otp_expiry=None
    db.commit()

    return {"message": "Phone number has been successfully updated."}

@router.post("/auth/deactivate-account", status_code=status.HTTP_200_OK)
def deactivate_account(email_or_phone: str, otp: str, db: db_dependency):

    user = db.query(User).filter(
        (User.email == email_or_phone) | (User.phone_number == email_or_phone)
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    
    if user.deleted_at:
        raise HTTPException(status_code=400, detail="User not found")
    
    if not verify_otp(email_or_phone, otp, db):
        raise HTTPException(status_code=400, detail="Invalid OTP for deactivate account")
    
    user.is_active = False
    user.otp=None
    user.otp_expiry=None
    db.commit()
    db.refresh(user)

    return {"message": "Account deactivated successfully."}


@router.post("/auth/recover-account", status_code=status.HTTP_200_OK)
def recover_account(email: str, otp: str, db: db_dependency):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_otp(email, otp, db):
        raise HTTPException(status_code=400, detail="Invalid OTP for delete account")
    
    user.is_active = True
    user.deleted_at = None
    db.add(user)
    db.commit()

    return generate_tokens(user)


@router.delete("/auth/delete-account", status_code=status.HTTP_200_OK)
def delete_account(email: str, otp: str, db: db_dependency):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_otp(email, otp, db):
        raise HTTPException(status_code=400, detail="Invalid OTP for delete account")
    
    user.is_active=False
    user.deleted_at = func.now()
    db.add(user)
    db.commit()

    return {"message": "Account deleted successfully."}







