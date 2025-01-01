from sqlalchemy import Column, String, Integer, Boolean, Date, DateTime, ForeignKey
from app.core.database import Base
from datetime import datetime, timezone
from sqlalchemy.orm import relationship

class Institution(Base):
    __tablename__="institution"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    full_address = Column(String(1000), nullable=True)
    logo = Column(String(255), nullable=True)
    website = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc), nullable=False)
    deleted_at = Column(DateTime, nullable=True)


