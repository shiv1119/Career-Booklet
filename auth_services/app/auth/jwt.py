from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
import os

load_dotenv(verbose=True)
SECRET_KEY = 'c0d91c42f8aac2ab9103fc265ee21ecaa995f78cdaf0e08044f3ccbe8ece679d'
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_MINUTES = 1440

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_bearer = OAuth2PasswordBearer(tokenUrl="auth/token")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(user_data: dict) -> str:
    to_encode = user_data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(user_data: dict) -> str:
    to_encode = user_data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token or token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

def refresh_access_token(refresh_token: str) -> str:
    payload = verify_token(refresh_token)
    if not payload.get("email"):
        raise HTTPException(status_code=403, detail="Invalid refresh token.")
    return create_access_token(payload)

def get_current_user(token: str = Depends(oauth2_bearer)):
    payload = verify_token(token)
    if not payload.get("email") or not payload.get("is_active"):
        raise HTTPException(status_code=401, detail="Invalid token.")
    return payload
