from fastapi import  APIRouter, Depends, status, HTTPException, Query, File, UploadFile, Request
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from typing import Annotated, List, Optional, Dict, Any, cast
from app.models.blogs import Tag, Category, SubCategory, Blog, BlogView, blog_tag_association, UserSavedBlogs, BlogLikes
from app.schemas.blogs import BlogCreateSchema, BlogResponseSchema, CategorySchema, SubCategorySchema, TagResponse
from datetime import datetime, timedelta, timezone
from sqlalchemy.sql import func, extract
from sqlalchemy.orm import joinedload
from sqlalchemy import func, or_, text
import httpx
from dotenv import load_dotenv
import os

load_dotenv()


PROFILE_SERVICE: str = os.environ.get("PROFILE_SERVICE")

router = APIRouter()
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

async def fetch_user_info(user_id: int):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{PROFILE_SERVICE}/api/profile/user_info/", params={"user_id": user_id})
            if response.status_code == 200:
                return response.json()
            return None
        except httpx.HTTPError as e:
            print(f"Error fetching user info: {e}")
            return None
        
async def get_total_likes(blog_id: int, db: db_dependency):
        total_likes = db.query(BlogLikes).filter(BlogLikes.blog_id == blog_id).count()
        return total_likes

async def get_total_saves(blog_id: int, db: db_dependency):
        total_saves = db.query(UserSavedBlogs).filter(UserSavedBlogs.blog_id == blog_id).count()
        return total_saves


async def format_blogs_response(blogs: List, db: db_dependency):
    blog_responses = []

    for blog in blogs:
        author_info = await fetch_user_info(blog.author)
        total_likes = await get_total_likes(blog.id, db)
        total_saves = await get_total_saves(blog.id, db)
        blog_responses.append(
            BlogResponseSchema(
                id=blog.id,
                title=blog.title,
                content=blog.content,
                author=blog.author,
                author_name=author_info["full_name"] if author_info else "Unknown",
                author_profile_image=author_info["profile_image"] if author_info else None,
                status=blog.status,
                category=blog.category.name if blog.category else None,
                subcategory=blog.subcategory.name if blog.subcategory else None,
                category_id=blog.category_id,
                subcategory_id=blog.subcategory_id,
                created_at=blog.created_at.isoformat(),  
                updated_at=blog.updated_at.isoformat(),
                tags=[tag.name for tag in blog.tags],
                total_views=blog.total_views,
                total_likes=total_likes,
                total_saves=total_saves
            )
        )

    return blog_responses


@router.post("/blogs/", status_code=status.HTTP_201_CREATED)
def create_blog(blog_data: BlogCreateSchema, db: db_dependency, request: Request):
    user_id = request.headers.get("x-user-id")
    print(user_id)
    if blog_data.new_category:
        category = db.query(Category).filter(Category.name == blog_data.new_category).first()
        if not category:
            category = Category(name=blog_data.new_category)
            db.add(category)
            db.commit()
            db.refresh(category)
    else:
        category = db.query(Category).filter(Category.id == blog_data.category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
    if blog_data.new_subcategory:
        subcategory = db.query(SubCategory).filter(SubCategory.name == blog_data.new_subcategory).first()
        if not subcategory:
            subcategory = SubCategory(name=blog_data.new_subcategory, category_id=category.id)
            db.add(subcategory)
            db.commit()
            db.refresh(subcategory)
    else:
        subcategory = db.query(SubCategory).filter(SubCategory.id == blog_data.subcategory_id).first()
        if not subcategory:
            raise HTTPException(status_code=404, detail="Subcategory not found")
    tag_names = [tag.strip().lower().replace(" ", "") for tag in blog_data.tags.split(",") if tag.strip()]
    existing_tags = db.query(Tag).filter(Tag.name.in_(tag_names)).all()
    existing_tag_names = {tag.name for tag in existing_tags}

    new_tags = [Tag(name=name) for name in tag_names if name not in existing_tag_names]
    db.add_all(new_tags)
    db.commit()
    all_tags = db.query(Tag).filter(Tag.name.in_(tag_names)).all()

    new_blog = Blog(
        title=blog_data.title,
        content=blog_data.content,
        author=user_id,
        status=blog_data.status,
        category_id=category.id,
        subcategory_id=subcategory.id,
        tags=all_tags,
    )
    db.add(new_blog)
    db.commit()
    db.refresh(new_blog)
    return {"message": "Blog created successfully"}

@router.put("/blogs/{blog_id}", response_model=BlogResponseSchema, status_code=status.HTTP_200_OK)
def update_blog(user_id: int, blog_id: int, blog_data: BlogCreateSchema, db: db_dependency):
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    if blog.author != user_id:
        raise HTTPException(status_code=404, detail="You do not have permission to update")
    
    category = db.query(Category).filter(Category.id == blog_data.category_id).first()
    subcategory = db.query(SubCategory).filter(SubCategory.id == blog_data.subcategory_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Category does not exist")
    if not subcategory:
        raise HTTPException(status_code=400, detail="SubCategory does not exist")

    tag_names = [tag.strip().lower().replace(" ", "") for tag in blog_data.tags.split(",") if tag.strip()]
    
    existing_tags = db.query(Tag).filter(Tag.name.in_(tag_names)).all()
    existing_tag_names = {tag.name for tag in existing_tags}

    new_tags = [Tag(name=name) for name in tag_names if name not in existing_tag_names]
    db.add_all(new_tags)
    db.commit()
    all_tags = db.query(Tag).filter(Tag.name.in_(tag_names)).all()

    blog.title = blog_data.title
    blog.content = blog_data.content
    blog.author = blog_data.author
    blog.category_id = blog_data.category_id
    blog.subcategory_id = blog_data.subcategory_id
    blog.status = blog_data.status
    blog.tags = all_tags
    blog.updated_at = datetime.now()

    db.commit()
    db.refresh(blog)
    return blog

@router.get("/blogs/by_id/", response_model=BlogResponseSchema)
async def get_blog(blog_id: int, db: db_dependency):
    blog = db.query(Blog).filter(Blog.id == blog_id, Blog.status == 'published')\
        .options(joinedload(Blog.category), joinedload(Blog.subcategory), joinedload(Blog.tags))\
        .first()
    
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    author_info = await fetch_user_info(blog.author)
    total_likes = await get_total_likes(blog.id, db)
    total_saves = await get_total_saves(blog.id, db)
    return BlogResponseSchema(
            id=blog.id,
            title=blog.title,
            content=blog.content,
            author=blog.author,
            author_name=author_info["full_name"] if author_info else "Unknown",
            author_profile_image=author_info["profile_image"] if author_info else None,
            status=blog.status,
            category=blog.category.name if blog.category else None,
            subcategory=blog.subcategory.name if blog.subcategory else None,
            category_id=blog.category_id,
            subcategory_id=blog.subcategory_id,
            created_at=blog.created_at.isoformat(),  
            updated_at=blog.updated_at.isoformat(),
            tags=[tag.name for tag in blog.tags],
            total_views=blog.total_views,
            total_likes=total_likes,
            total_saves=total_saves
        )

@router.get("/blogs", response_model=List[BlogResponseSchema])
def get_all_blogs(db: db_dependency, page: int = Query(1, ge=1), page_size: int = Query(20, le=100)):
    offset = (page - 1) * page_size
    blogs = db.query(Blog).filter(Blog.status == 'published')\
        .options(joinedload(Blog.category), joinedload(Blog.subcategory), joinedload(Blog.tags))\
        .limit(page_size).offset(offset).all()

    if not blogs:
        raise HTTPException(status_code=404, detail="No blogs found")
    
    return format_blogs_response(blogs, db)


@router.delete("/blogs/{blog_id}")
def delete_blog(blog_id: int, db: db_dependency):
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    db.query(BlogView).filter(BlogView.blog_id == blog_id).delete()
    blog.tags.clear()
    db.delete(blog)
    db.commit()
    return {"The blog got deleted successfully"}

@router.get("/blogs/author/{author_id}", response_model=List[BlogResponseSchema])
def get_blogs_by_author(
    author_id: int,
    db: db_dependency,
    skip: int = Query(0, ge=0, description="Number of blogs to skip"),
    limit: int = Query(10, ge=1, description="Number of blogs to return"),
    status: Optional[str] = Query(None, description="Filter blogs by status (e.g., 'published', 'draft')")
):
    query = db.query(Blog).filter(Blog.author == str(author_id))

    if status:
        query = query.filter(Blog.status == status)

    blogs = query.offset(skip).limit(limit).all()

    if not blogs:
        raise HTTPException(status_code=404, detail="No blogs found for this author")

    return format_blogs_response(blogs, db)

@router.get("/blogs/trending/", response_model=List[BlogResponseSchema])
async def get_trending_blogs(
    db: db_dependency,
    days: int = Query(7, ge=1, le=30, description="Number of days for trending (1 to 30)"),
    limit: int = Query(10, ge=1, description="Number of blogs to return"),
    skip: int = Query(0, ge=0, description="Number of blogs to skip"),
    category_id: Optional[int] = Query(None, description="Filter blogs by category ID"),
    subcategory_id: Optional[int] = Query(None, description="Filter blogs by subcategory ID"),
    author: Optional[str] = Query(None, description="Filter by author's name"),
    tag_ids: Optional[List[int]] = Query(None),
    search: Optional[str] = Query(None, description="Keyword search in title or content")
):
    filter_date = datetime.now() - timedelta(days=days)

    query = db.query(Blog).join(BlogView).filter(BlogView.view_date >= filter_date)

    if category_id:
        query = query.filter(Blog.category_id == category_id)

    if subcategory_id:
        query = query.filter(Blog.subcategory_id == subcategory_id)

    if author:
        query = query.filter(Blog.author.ilike(f"%{author}%"))

    if tag_ids:
        query = query.filter(Blog.tags.any(Tag.id.in_(tag_ids)))

    if search:
        query = query.filter(or_(Blog.title.ilike(f"%{search}%"), Blog.content.ilike(f"%{search}%")))

    query = query.group_by(Blog.id) \
        .order_by(func.sum(BlogView.view_count).desc()) \
        .offset(skip) \
        .limit(limit)

    trending_blogs = query.all()

    if not trending_blogs:
        raise HTTPException(status_code=404, detail="No trending blogs found")

    formatted_blogs = await format_blogs_response(trending_blogs, db)  

    return formatted_blogs

@router.get("/blogs/tags", response_model=List[BlogResponseSchema])
def get_blogs_by_tags(
    db: db_dependency,
    limit: int = Query(10, ge=1, description="Number of blogs to return"),
    skip: int = Query(0, ge=0, description="Number of blogs to skip"),
    tag_name: Optional[str] = Query(None, description="Filter blogs based on tags"),
    category_id: Optional[int] = Query(None, description="Filter blogs by category ID"),
    subcategory_id: Optional[int] = Query(None, description="Filter blogs by subcategory ID"),
    author: Optional[str] = Query(None, description="Filter by author's name"),
):
    
    if tag_name:
        tag_name = tag_name.strip().lower()
        tag = db.query(Tag).filter(Tag.name == tag_name).first()

    if category_id:
        query = query.filter(Blog.category_id == category_id)

    if subcategory_id:
        query = query.filter(Blog.subcategory_id == subcategory_id)

    if author:
        query = query.filter(Blog.author.ilike(f"%{author}%"))

    blogs = (
        db.query(Blog)
        .join(blog_tag_association)
        .filter(blog_tag_association.c.tag_id == tag.id)
        .filter(Blog.status == "published") 
        .offset(skip)
        .limit(limit)
        .all()
    )

    if not blogs:
        raise HTTPException(status_code=404, detail="No blogs found with the given tag")
    
    return format_blogs_response(blogs, db)

@router.get("/blogs/most-watched", response_model=List[BlogResponseSchema])
def get_most_watched_blogs(
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, description="Number of blogs to return"),
    category_id: Optional[int] = Query(None, description="Filter blogs by category ID"),
    subcategory_id: Optional[int] = Query(None, description="Filter blogs by subcategory ID")
):
    query = db.query(Blog).join(BlogView).filter(Blog.status == "published")

    if category_id:
        query = query.filter(Blog.category_id == category_id)

    if subcategory_id:
        query = query.filter(Blog.subcategory_id == subcategory_id)
    most_watched_blogs = (
        query.group_by(Blog.id)
        .order_by(func.sum(BlogView.view_count).desc())
        .limit(limit)
        .all()
    )
    if not most_watched_blogs:
        raise HTTPException(status_code=404, detail="No blogs found")

    return format_blogs_response(most_watched_blogs, db)

@router.get("/blogs/category/{category_id}", response_model=List[BlogResponseSchema])
def get_blogs_by_category(
    category_id: int,
    db: db_dependency,
    limit: int = Query(10, ge=1, description="Number of blogs to return"),
    skip: int = Query(0, ge=0, description="Number of blogs to skip")
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    blogs = (
        db.query(Blog)
        .filter(Blog.category_id == category_id)
        .filter(Blog.status == "published") 
        .offset(skip)
        .limit(limit)
        .all()
    )

    if not blogs:
        raise HTTPException(status_code=404, detail="No blogs found in this category")

    return format_blogs_response(blogs, db)


@router.get("/blogs/subcategory/{subcategory_id}", response_model=List[BlogResponseSchema])
def get_blogs_by_subcategory(
    subcategory_id: int,
    db: db_dependency,
    limit: int = Query(10, ge=1, description="Number of blogs to return"),
    skip: int = Query(0, ge=0, description="Number of blogs to skip")
):
    subcategory = db.query(SubCategory).filter(SubCategory.id == subcategory_id).first()
    if not subcategory:
        raise HTTPException(status_code=404, detail="SubCategory not found")
    blogs = (
        db.query(Blog)
        .filter(Blog.subcategory_id == subcategory_id)
        .filter(Blog.status == "published") 
        .offset(skip)
        .limit(limit)
        .all()
    )

    if not blogs:
        raise HTTPException(status_code=404, detail="No blogs found in this subcategory")
    return format_blogs_response(blogs, db)

@router.get("/blogs/trending/category/{category_id}", response_model=List[BlogResponseSchema])
@router.get("/blogs/trending/subcategory/{subcategory_id}", response_model=List[BlogResponseSchema])
async def get_trending_blogs_for_category_or_subcategory(
    db: db_dependency,
    category_id: Optional[int] = None,
    subcategory_id: Optional[int] = None,
    days: int = Query(7, ge=1, le=30, description="Number of days for trending (1 to 30)"),
    limit: int = Query(10, ge=1, description="Number of blogs to return"),
    skip: int = Query(0, ge=0, description="Number of blogs to skip")
    
):
    start_date = datetime.now() - timedelta(days=days)

    query = (
        db.query(Blog)
        .join(BlogView)
        .filter(BlogView.view_date >= start_date)
        .filter(Blog.status == "published")      
    )

    if category_id:
        query = query.filter(Blog.category_id == category_id)
    if subcategory_id:
        query = query.filter(Blog.subcategory_id == subcategory_id)

    trending_blogs = (
        query.group_by(Blog.id)
        .order_by(func.sum(BlogView.view_count).desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    if not trending_blogs:
        raise HTTPException(status_code=404, detail="No trending blogs found")
    formatted_blogs = await format_blogs_response(trending_blogs, db) 
    return formatted_blogs

@router.post("/blogs/by_id/increment-view/", response_model=dict)
def increment_view(blog_id: int, db: Session = Depends(get_db)):
    today = datetime.now().date()
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    if blog.status != 'published':
        raise HTTPException(status_code=400, detail="Blog is not published")
    view_entry = db.query(BlogView).filter(
        BlogView.blog_id == blog_id, BlogView.view_date == today
    ).first()
    
    if view_entry:
        view_entry.view_count += 1
    else:
        view_entry = BlogView(
            blog_id=blog_id,
            view_date=today,
            view_count=1,
            blog=blog
        )
        db.add(view_entry)
    db.commit()
    db.refresh(view_entry)
    blog.total_views = sum(view.view_count for view in blog.views)
    db.commit()
    db.refresh(blog)
    
    return {"message": "View count updated successfully", "view_count": view_entry.view_count}

@router.get("/blogs/user/views/", response_model=dict)
def get_user_views(
    db: db_dependency,
    request: Request = None,
    blog_id: int = Query(None, description="Optional blog ID to filter by a specific blog"),
    group_by: str = Query("daily", regex="^(daily|monthly|yearly)$", description="Group views by 'daily', 'monthly', or 'yearly'"),
    period: int = Query(1, ge=1, le=365, description="Time range for the data (in hours for hourly, days for daily, months for monthly, and years for yearly)"),
):
    now = datetime.now(timezone.utc)
    user_id = request.headers.get("x-user-id")

    if group_by == "daily":
        start_date = now - timedelta(days=period)
        group_func = func.date(BlogView.view_date)
        label = "day"
    elif group_by == "monthly":
        start_date = now - timedelta(days=30 * period)
        group_func = func.concat(
            extract("year", BlogView.view_date),
            "-",
            func.to_char(extract("month", BlogView.view_date), 'FM00')
        )
        label = "year_month"
    elif group_by == "yearly":
        start_date = now - timedelta(days=365 * period)
        group_func = extract("year", BlogView.view_date)
        label = "year"

    if blog_id:
        blog = db.query(Blog).filter(Blog.id == blog_id, Blog.author == user_id).first()
        if not blog:
            raise HTTPException(status_code=404, detail="Blog not found or does not belong to user")
        blog_ids = [blog_id]
    else:
        blogs = db.query(Blog).filter(Blog.author == user_id).all()
        if not blogs:
            raise HTTPException(status_code=404, detail="No blogs found for this user")
        blog_ids = [blog.id for blog in blogs]

    grouped_views_current = (
        db.query(
            group_func.label(label),
            func.sum(BlogView.view_count).label("total_views"),
        )
        .filter(BlogView.blog_id.in_(blog_ids), BlogView.view_date >= start_date)
        .group_by(group_func)
        .order_by(group_func)
        .all()
    )

    start_date_previous = start_date - timedelta(days=period)
    grouped_views_previous = (
        db.query(
            group_func.label(label),
            func.sum(BlogView.view_count).label("total_views"),
        )
        .filter(BlogView.blog_id.in_(blog_ids), BlogView.view_date >= start_date_previous)
        .group_by(group_func)
        .order_by(group_func)
        .all()
    )

    results_current: List[Dict[str, Any]] = []
    results_previous: Dict[str, int] = {}

    if group_by == "daily":
        for row in grouped_views_current:
            day = row.day.strftime("%d %b")
            results_current.append({"day": day, "total_views": row.total_views})
            results_previous[day] = 0

        for row in grouped_views_previous:
            day = row.day.strftime("%d %b")
            results_previous[day] = row.total_views

    elif group_by == "monthly":
        for row in grouped_views_current:
            year_month = row.year_month.split("-")
            year, month = int(year_month[0]), int(year_month[1])
            month_name = datetime(year, month, 1).strftime("%b")
            results_current.append({"month": f"{month_name} {year}", "total_views": row.total_views})
            results_previous[f"{month_name} {year}"] = 0

        for row in grouped_views_previous:
            year_month = row.year_month.split("-")
            year, month = int(year_month[0]), int(year_month[1])
            month_name = datetime(year, month, 1).strftime("%b")
            results_previous[f"{month_name} {year}"] = row.total_views

    elif group_by == "yearly":
        for row in grouped_views_current:
            year = int(row.year)
            results_current.append({"year": year, "total_views": row.total_views})
            results_previous[year] = 0

        for row in grouped_views_previous:
            year = int(row.year)
            results_previous[year] = row.total_views

    percentage_change = None
    total_current_views = sum([entry["total_views"] for entry in results_current])
    total_previous_views = sum(results_previous.values())
    if total_previous_views > 0:
        percentage_change = ((total_current_views - total_previous_views) / total_previous_views) * 100
    elif total_previous_views == 0 and total_current_views > 0:
        percentage_change = 100
    else:
        percentage_change = 0

    return {
        "start_date": str(start_date),
        "end_date": str(now),
        "group_by": group_by,
        "views": results_current,
        "total_views_current": total_current_views,
        "percentage_change": percentage_change,
    }

@router.get("/blogs/latest-blogs/", response_model=List[BlogResponseSchema])
async def get_latest_blogs(
    db: db_dependency,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, le=100),
    category_id: Optional[int] = Query(None),
    subcategory_id: Optional[int] = Query(None),
    author: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    min_views: Optional[int] = Query(None, ge=0),
    tag_ids: Optional[List[int]] = Query(None),
):
    offset = (page - 1) * page_size

    query = db.query(Blog).filter(Blog.status == "published")

    if category_id is not None:
        query = query.filter(Blog.category_id == category_id)
    if subcategory_id is not None:
        query = query.filter(Blog.subcategory_id == subcategory_id)
    if author:
        query = query.filter(Blog.author.ilike(f"%{author}%"))
    if start_date:
        query = query.filter(Blog.created_at >= start_date)
    if end_date:
        query = query.filter(Blog.created_at <= end_date)
    if min_views is not None:
        query = query.filter(Blog.total_views >= min_views)
    if tag_ids:
        query = query.filter(Blog.tags.any(Tag.id.in_(tag_ids)))

    latest_blogs = (
        query.order_by(Blog.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    if not latest_blogs:
        raise HTTPException(status_code=404, detail="No published blogs found")
    formatted_blogs = await format_blogs_response(latest_blogs, db) 
    return formatted_blogs



@router.get("/blogs/categories/", response_model=List[CategorySchema], status_code=status.HTTP_200_OK)
def get_categories(db: db_dependency):
    categories = db.query(Category).all()
    return categories


@router.get("/tags/", response_model=List[TagResponse])
def get_all_tags(db: db_dependency):
    try:
        tags = db.query(Tag).all()
        
        if not tags:
            raise HTTPException(status_code=404, detail="No tags found")
        
        return tags
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/blogs/user/top/", response_model=dict)
def get_top_blogs_by_views(
    db: db_dependency,
    request: Request,
    group_by: str = Query("daily", regex="^(daily|monthly|yearly)$", description="Group views by 'daily', 'monthly', or 'yearly'"),
    period: int = Query(1, ge=1, le=365, description="Time range for the data (days for daily, months for monthly, and years for yearly)"),
):
    now = datetime.now(timezone.utc)
    user_id = request.headers.get("x-user-id")

    if group_by == "daily":
        start_date = now - timedelta(days=period)
        group_func = func.date(BlogView.view_date)
        label = "day"
    elif group_by == "monthly":
        start_date = now - timedelta(days=30 * period)
        group_func = func.concat(
            extract("year", BlogView.view_date),
            "-",
            func.to_char(extract("month", BlogView.view_date), 'FM00')
        )
        label = "year_month"
    elif group_by == "yearly":
        start_date = now - timedelta(days=365 * period)
        group_func = extract("year", BlogView.view_date)
        label = "year"

    blogs = db.query(Blog).filter(Blog.author == user_id).all()
    if not blogs:
        raise HTTPException(status_code=404, detail="No blogs found for this user")

    blog_titles = {blog.id: blog.title for blog in blogs}
    blog_ids = list(blog_titles.keys())

    blog_views = (
        db.query(
            BlogView.blog_id,
            group_func.label(label),
            func.sum(BlogView.view_count).label("total_views"),
        )
        .filter(BlogView.blog_id.in_(blog_ids), BlogView.view_date >= start_date)
        .group_by(BlogView.blog_id, group_func)
        .order_by(func.sum(BlogView.view_count).desc())
        .all()
    )

    blog_data: Dict[int, List[Dict[str, Any]]] = {}
    total_blog_views: Dict[int, int] = {}

    for row in blog_views:
        blog_id = row.blog_id
        if blog_id not in blog_data:
            blog_data[blog_id] = []
            total_blog_views[blog_id] = 0

        if group_by == "daily":
            formatted_label = row.day.strftime("%d %b")
        elif group_by == "monthly":
            year_month = row.year_month.split("-")
            formatted_label = f"{datetime(int(year_month[0]), int(year_month[1]), 1).strftime('%b')} {year_month[0]}"
        elif group_by == "yearly":
            formatted_label = str(row.year)

        blog_data[blog_id].append({"group": formatted_label, "total_views": row.total_views})
        total_blog_views[blog_id] += row.total_views

    top_5_blogs = sorted(total_blog_views.items(), key=lambda x: x[1], reverse=True)[:5]

    top_5_blogs_data = [
        {
            "blog_id": blog_id,
            "title": blog_titles[blog_id],
            "total_views_in_period": total_blog_views[blog_id], 
            "views_by_period": blog_data[blog_id] 
        }
        for blog_id, _ in top_5_blogs
    ]

    return {
        "start_date": str(start_date),
        "end_date": str(now),
        "group_by": group_by,
        "top_5_blogs": top_5_blogs_data,
    }


#save blogs

@router.post("/blogs/toggle-save/", status_code=status.HTTP_200_OK)
async def toggle_save_blog(blog_id: int, db: db_dependency, request: Request):
    user_id = request.headers.get("x-user-id")

    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required in headers")

    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")

    saved_blog = db.query(UserSavedBlogs).filter(
        UserSavedBlogs.user_id == user_id,
        UserSavedBlogs.blog_id == blog_id
    ).first()
    
    total_saves = db.query(UserSavedBlogs).filter(UserSavedBlogs.blog_id == blog_id).count()
    if saved_blog:
        db.delete(saved_blog)
        db.commit()
        return {"message": "Blog unsaved successfully", "is_saved": False, "total_saves": total_saves-1}
    else:
        new_saved_blog = UserSavedBlogs(user_id=user_id, blog_id=blog_id)
        db.add(new_saved_blog)
        db.commit()
        db.refresh(new_saved_blog)
        return {"message": "Blog saved successfully", "is_saved": True, "total_saves": total_saves+1}


@router.get("/blogs/is-saved/", status_code=status.HTTP_200_OK)
async def is_blog_saved(blog_id: int, db: db_dependency, request: Request):
    user_id = request.headers.get("x-user-id")
    total_saves = db.query(UserSavedBlogs).filter(UserSavedBlogs.blog_id == blog_id).count()
    if not user_id:
        return {"is_saved": False, "total_saves": total_saves}

    is_saved = db.query(UserSavedBlogs).filter(
        UserSavedBlogs.user_id == user_id,
        UserSavedBlogs.blog_id == blog_id
    ).first() is not None

    total_saves = db.query(UserSavedBlogs).filter(UserSavedBlogs.blog_id == blog_id).count()

    return {"is_saved": is_saved, "total_saves": total_saves}


@router.post("/blogs/toggle-like/", status_code=status.HTTP_200_OK)
async def toggle_like_blog(blog_id: int, db: db_dependency, request: Request):
    user_id = request.headers.get("x-user-id")

    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required in headers")

    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")

    existing_like = db.query(BlogLikes).filter(
        BlogLikes.user_id == user_id,
        BlogLikes.blog_id == blog_id
    ).first()
    total_likes = db.query(BlogLikes).filter(BlogLikes.blog_id == blog_id).count()
    if existing_like:
        db.delete(existing_like)
        db.commit()
        return {"message": "Blog unliked successfully", "is_liked": False, "total_likes": total_likes-1}
    else:
        new_like = BlogLikes(user_id=user_id, blog_id=blog_id)
        db.add(new_like)
        db.commit()
        db.refresh(new_like)
    
        return {"message": "Blog liked successfully", "is_liked": True, "total_likes": total_likes+1}

@router.get("/blogs/is-liked/", status_code=status.HTTP_200_OK)
async def is_blog_liked(blog_id: int, db: db_dependency, request: Request):
    user_id = request.headers.get("x-user-id")
    total_likes = db.query(BlogLikes).filter(BlogLikes.blog_id == blog_id).count()
    if not user_id:
        return {"is_liked": False, "total_likes": total_likes}

    is_liked = db.query(BlogLikes).filter(
        BlogLikes.user_id == user_id,
        BlogLikes.blog_id == blog_id
    ).first() is not None

    return {"is_liked": is_liked, "total_likes": total_likes}
