from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime, Table, Date, event
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import date, datetime

from app.core.database import Base

blog_tag_association = Table(
    "blog_tags",
    Base.metadata,
    Column("blog_id", Integer, ForeignKey("blogs.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
)

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    subcategories = relationship("SubCategory", back_populates="category", cascade="all, delete-orphan")
    blogs = relationship("Blog", back_populates="category", cascade="all, delete-orphan")

class SubCategory(Base):
    __tablename__ = "subcategories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), index=True)
    category = relationship("Category", back_populates="subcategories")
    blogs = relationship("Blog", back_populates="subcategory", cascade="all, delete-orphan")

class Tag(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    blogs = relationship("Blog", secondary=blog_tag_association, back_populates="tags")

class BlogView(Base):
    __tablename__ = "blog_views"
    id = Column(Integer, primary_key=True, index=True)
    blog_id = Column(Integer, ForeignKey("blogs.id", ondelete="CASCADE"), nullable=False, index=True)
    view_date = Column(Date, default=date.today, nullable=False)
    view_count = Column(Integer, default=0)

    blog = relationship("Blog", back_populates="views")

class Blog(Base):
    __tablename__ = "blogs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
    author = Column(String(100), nullable=False)
    status = Column(String(20), nullable=False)
    # published_at = Column(DateTime, nullable=True)
    subcategory_id = Column(Integer, ForeignKey("subcategories.id", ondelete="CASCADE"), index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), index=True)
    total_views = Column(Integer, default=0, nullable=False)

    subcategory = relationship("SubCategory", back_populates="blogs")
    category = relationship("Category", back_populates="blogs")
    tags = relationship("Tag", secondary=blog_tag_association, back_populates="blogs")
    views = relationship("BlogView", back_populates="blog", cascade="all, delete-orphan")

@event.listens_for(BlogView, 'after_insert')
def update_blog_total_views(mapper, connection, target):
    blog = target.blog
    connection.execute(
        Blog.__table__.update()
        .where(Blog.id == blog.id)
        .values(total_views=Blog.total_views + target.view_count)
    )
