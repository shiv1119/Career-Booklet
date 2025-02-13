from sqlalchemy import Column, String, Integer, Boolean, Date, DateTime, ForeignKey, Text, UniqueConstraint
from app.core.database import Base
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from sqlalchemy.sql import func

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
    state = Column(String(100), nullable=True)
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
            "state": self.state,
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

    education_skills = relationship("EducationSkill", back_populates="skill")
    position_skills = relationship("PositionSkill", back_populates="skill")
    certification_skills = relationship("CertificationSkill", back_populates="skill")
    project_skills = relationship("ProjectSkill", back_populates="skill")

class UserSkill(Base):
    __tablename__ = 'user_skills'

    id = Column(Integer, primary_key=True, index=True)
    auth_user_id = Column(Integer, nullable=False)
    skill_id = Column(Integer, nullable=False)
    order = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class Language(Base):
    __tablename__ = 'languages'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    user_languages = relationship("UserLanguage", back_populates="language")

class UserLanguage(Base):
    __tablename__ = 'user_languages'
    
    id = Column(Integer, primary_key=True, index=True)
    auth_user_id = Column(Integer, index=True)
    language_id = Column(Integer, ForeignKey('languages.id'))
    proficiency = Column(String)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    language = relationship('Language', back_populates="user_languages")


class Cause(Base):
    __tablename__ = 'causes'

    id = Column(Integer, primary_key=True, index=True)
    auth_user_id = Column(Integer, index=True)
    cause_name = Column(String, index=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Education(Base):
    __tablename__ = 'education'

    id = Column(Integer, primary_key=True, index=True)
    auth_user_id = Column(Integer, index=True)
    institution_id = Column(Integer, index=True)
    degree = Column(String)
    field_of_study = Column(String)
    start_date = Column(DateTime)
    end_date = Column(DateTime, nullable=True)
    grade = Column(String, nullable=True)
    activities_societies = Column(String, nullable=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    education_skills = relationship("EducationSkill", back_populates="education", cascade="all, delete-orphan")
    education_media = relationship("EducationMedia", back_populates="education", cascade="all, delete-orphan")


class EducationMedia(Base):
    __tablename__ = 'education_media'

    id = Column(Integer, primary_key=True, index=True)
    education_id = Column(Integer, ForeignKey('education.id'), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    file_url = Column(String, nullable=True)
    order = Column(Integer, default=0, index=True)
    thumbnail_url = Column(String, nullable=True)
    uploaded_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    education = relationship("Education", back_populates="education_media")


class EducationSkill(Base):
    __tablename__ = 'education_skills'

    id = Column(Integer, primary_key=True, index=True)
    education_id = Column(Integer, ForeignKey('education.id'), nullable=False)
    skill_id = Column(Integer, ForeignKey('skills.id'), nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    education = relationship("Education", back_populates="education_skills")
    skill = relationship("Skill", back_populates="education_skills")


class Position(Base):
    __tablename__ = 'position'

    id = Column(Integer, primary_key=True, index=True)
    auth_user_id = Column(Integer, index=True)
    company_id = Column(Integer, index=True)
    title = Column(String)
    employment_type = Column(String, nullable=True)
    start_date = Column(DateTime)
    end_date = Column(DateTime, nullable=True)
    location = Column(String, nullable=True)
    location_type = Column(String, nullable=True)
    profile_headline = Column(String, nullable=True)
    found_platform = Column(String, nullable=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    position_skills = relationship("PositionSkill", back_populates="position", cascade="all, delete-orphan")
    position_media = relationship("PositionMedia", back_populates="position", cascade="all, delete-orphan")


class PositionMedia(Base):
    __tablename__ = 'position_media'

    id = Column(Integer, primary_key=True, index=True)
    position_id = Column(Integer, ForeignKey('position.id'), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    file_url = Column(String, nullable=True)
    order = Column(Integer, default=0, index=True)
    thumbnail_url = Column(String, nullable=True)
    uploaded_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    position = relationship("Position", back_populates="position_media")


class PositionSkill(Base):
    __tablename__ = 'position_skills'

    id = Column(Integer, primary_key=True, index=True)
    position_id = Column(Integer, ForeignKey('position.id'), nullable=False)
    skill_id = Column(Integer, ForeignKey('skills.id'), nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    position = relationship("Position", back_populates="position_skills")
    skill = relationship("Skill", back_populates="position_skills")


class Certification(Base):
    __tablename__ = 'certification'

    id = Column(Integer, primary_key=True, index=True)
    auth_user_id = Column(Integer, index=True)
    name = Column(String, nullable=False)
    organization_id = Column(Integer, index=True)
    issue_date = Column(DateTime, nullable=False)
    expiration_date = Column(DateTime, nullable=True)
    credential_id = Column(String, nullable=True)
    credential_url = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    certification_skills = relationship("CertificationSkill", back_populates="certification", cascade="all, delete-orphan")
    certification_media = relationship("CertificationMedia", back_populates="certification", cascade="all, delete-orphan")


class CertificationMedia(Base):
    __tablename__ = 'certification_media'

    id = Column(Integer, primary_key=True, index=True)
    certification_id = Column(Integer, ForeignKey('certification.id'), nullable=False)  # Corrected FK
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    file_url = Column(String, nullable=True)
    order = Column(Integer, default=0, index=True)
    thumbnail_url = Column(String, nullable=True)
    uploaded_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    certification = relationship("Certification", back_populates="certification_media")


class CertificationSkill(Base):
    __tablename__ = 'certification_skills'

    id = Column(Integer, primary_key=True, index=True)
    certification_id = Column(Integer, ForeignKey('certification.id'), nullable=False)  # Corrected FK
    skill_id = Column(Integer, ForeignKey('skills.id'), nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    certification = relationship("Certification", back_populates="certification_skills")
    skill = relationship("Skill", back_populates="certification_skills")


class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    auth_user_id = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime, nullable=True) 
    end_date = Column(DateTime, nullable=True)
    technologies = Column(Text, nullable=True)
    role = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    project_media = relationship("ProjectMedia", back_populates="project", cascade="all, delete")
    project_skills = relationship("ProjectSkill", back_populates="project", cascade="all, delete")
    contributors = relationship("Contributor", back_populates="project", cascade="all, delete")
    associations = relationship("ProjectAssociation", back_populates="project", cascade="all, delete")

class ProjectMedia(Base):
    __tablename__ = "project_media"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    file_url = Column(String, nullable=False)
    order = Column(Integer, default=0)
    uploaded_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    project = relationship("Project", back_populates="project_media")

class ProjectSkill(Base):
    __tablename__ = "project_skills"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('projects.id', ondelete="CASCADE"), nullable=False)
    skill_id = Column(Integer, ForeignKey('skills.id', ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="project_skills")
    skill = relationship("Skill", back_populates="project_skills")


class Contributor(Base):
    __tablename__ = "contributors"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    user_id = Column(Integer, nullable=False)
    role = Column(String, nullable=True) 
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="contributors")


class ProjectAssociation(Base):
    __tablename__ = "project_associations"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    associated_type = Column(String, nullable=False)
    associated_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    project = relationship("Project", back_populates="associations")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    auth_user_id = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    number = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    associations = relationship("CourseAssociation", back_populates="course", cascade="all, delete-orphan")

class CourseAssociation(Base):
    __tablename__ = "course_associations"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))
    associated_type = Column(String, nullable=False)
    associated_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    course = relationship("Course", back_populates="associations")

class TestScore(Base):
    __tablename__ = "test_scores"

    id = Column(Integer, primary_key=True, index=True)
    auth_user_id = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    score = Column(String, nullable=False)
    test_date = Column(DateTime, nullable=True) 
    description = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    associations = relationship("TestScoreAssociation", back_populates="test_score", cascade="all, delete-orphan")

class TestScoreAssociation(Base):
    __tablename__ = "test_score_associations"

    id = Column(Integer, primary_key=True, index=True)
    test_score_id = Column(Integer, ForeignKey("test_scores.id", ondelete="CASCADE"))
    associated_type = Column(String, nullable=False)
    associated_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    test_score = relationship("TestScore", back_populates="associations")



#followers table

class Follow(Base):
    __tablename__ = "follows"

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, nullable=False)
    following_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=func.now())
    is_active = Column(Boolean, default=True)

    __table_args__ = (UniqueConstraint("follower_id", "following_id", name="unique_follow"),)


