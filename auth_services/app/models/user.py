from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.core.database import Base
from sqlalchemy.sql import func
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    phone_number = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    otp = Column(String, nullable=True)
    otp_expiry = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=False)
    roles = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True)

