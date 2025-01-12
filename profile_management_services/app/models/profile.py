from sqlalchemy import Column, String, Integer, Boolean, Date, DateTime
from app.core.database import Base
from datetime import datetime, timezone

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    auth_user_id = Column(Integer, unique=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    additional_name = Column(String(255), nullable=True)
    pronouns = Column(String(100), nullable=True)
    profile_image = Column(String(255), nullable=True)
    profile_background_image = Column(String(255), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(50), nullable=True)
    country = Column(String(100), nullable=True)
    city = Column(String(150), nullable=True)
    full_address = Column(String, nullable=True)
    website = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "auth_user_id": self.auth_user_id,
            "full_name": self.full_name,
            "additional_name": self.additional_name,
            "pronouns": self.pronouns,
            "date_of_birth": self.date_of_birth.isoformat() if self.date_of_birth else None,
            "gender": self.gender,
            "country": self.country,
            "city": self.city,
            "full_address": self.full_address,
            "website": self.website,
            "profile_image": self.profile_image,
            "profile_background_image": self.profile_background_image,
        }

class AboutUser(Base):
    __tablename__ = "about_user"
    
    id = Column(Integer, primary_key=True, index=True)
    auth_user_id = Column(Integer, nullable=False)
    about = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class Skill(Base):
    __tablename__ = 'skills'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class UserSkill(Base):
    __tablename__ = 'user_skills'

    id = Column(Integer, primary_key=True, index=True)
    auth_user_id = Column(Integer, nullable=False)
    skill_id = Column(Integer, nullable=False)
    order = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))




