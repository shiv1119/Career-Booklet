from fastapi import APIRouter, Depends, Form, HTTPException, status, Body, Request
from typing import Annotated, Dict, Any
from sqlalchemy.orm import Session
from app.models.profile import Follow, UserProfile
from app.schemas.follow import FollowRequest
from app.core.database import SessionLocal
from sqlalchemy import func
from datetime import datetime, timedelta, timezone

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

@router.post("/follow/")
def follow(req: Request, following_id: int, db: db_dependency):
    follower_id = req.headers.get("x-user-id")
    following_id = following_id

    if follower_id == following_id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")

    follow = db.query(Follow).filter_by(follower_id=follower_id, following_id=following_id).first()
    if follow:
        if follow.is_active:
            follow.is_active = False
            db.commit()
            db.refresh(follow)
            return {"message" : "Un-followed"}
        else:
            follow.is_active = True
            follow.created_at = func.now()
            db.commit()
            db.refresh(follow)
            return {"message": "Followed again"}
        
    new_follow = Follow(follower_id=follower_id, following_id=following_id)
    db.add(new_follow)
    db.commit()
    db.refresh()
    return {"message": "Followed successfully"}

TIME_PERIODS = {
    "24h": timedelta(days=1),
    "7d": timedelta(days=7),
    "15d": timedelta(days=15),
    "1m": timedelta(days=30),
    "6m": timedelta(days=180),
    "1y": timedelta(days=365),
    "5y": timedelta(days=5 * 365),
    "max": None
}

@router.get("/followers/stats")
def followers_stats(req: Request, period: str, db: Session = Depends(get_db)):
    user_id = req.headers.get("x-user-id")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required in headers")

    if period not in TIME_PERIODS:
        raise HTTPException(status_code=400, detail="Invalid period. Choose from 24h, 7d, 15d, 1m, 6m, 1y, 5y, max")

    end_dt = datetime.now(timezone.utc)
    start_dt = end_dt - TIME_PERIODS[period] if TIME_PERIODS[period] else datetime.min
    prev_start_dt = start_dt - TIME_PERIODS[period] if TIME_PERIODS[period] else datetime.min
    prev_end_dt = start_dt

    time_group = func.strftime("%Y-%m-%d %H:00", Follow.created_at) if period == "24h" else func.date(Follow.created_at)

    gained = (
        db.query(time_group, func.count())
        .filter(Follow.following_id == user_id, Follow.is_active == True)
        .filter(Follow.created_at.between(start_dt, end_dt))
        .group_by(time_group)
        .all()
    )

    lost = (
        db.query(time_group, func.count())
        .filter(Follow.following_id == user_id, Follow.is_active == False)
        .filter(Follow.created_at.between(start_dt, end_dt))
        .group_by(time_group)
        .all()
    )

    prev_gained = (
        db.query(func.count())
        .filter(Follow.following_id == user_id, Follow.is_active == True)
        .filter(Follow.created_at.between(prev_start_dt, prev_end_dt))
        .scalar()
    )

    prev_lost = (
        db.query(func.count())
        .filter(Follow.following_id == user_id, Follow.is_active == False)
        .filter(Follow.created_at.between(prev_start_dt, prev_end_dt))
        .scalar()
    )

    total_followers = db.query(func.count()).filter(Follow.following_id == user_id, Follow.is_active == True).scalar()

    followers_gained = {str(time): count for time, count in gained}
    followers_lost = {str(time): count for time, count in lost}

    gained_count = sum(followers_gained.values())
    lost_count = sum(followers_lost.values())

    net_followers = gained_count - lost_count
    prev_net_followers = (prev_gained or 0) - (prev_lost or 0)

    percentage_change = ((net_followers - prev_net_followers) / prev_net_followers * 100) if prev_net_followers else 100

    return {
        "followers_gained": followers_gained,
        "followers_lost": followers_lost,
        "percentage_change": round(percentage_change, 2),
        "total_followers": total_followers,
    }

@router.get("/check/follow/")
def follow(req: Request, following_id: int, db: db_dependency):
    follower_id = req.headers.get("x-user-id")
    following_id = following_id

    if follower_id == following_id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")

    follow = db.query(Follow).filter_by(follower_id=follower_id, following_id=following_id).first()
    
    return follow.is_active

@router.get("/get/user/follow/stats/")
def get_follow_stats(user_id: int, db: Session = Depends(get_db)):
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required")

    total_followers = db.query(Follow).filter_by(following_id=user_id, is_active=True).count()
    total_following = db.query(Follow).filter_by(follower_id=user_id, is_active=True).count()

    return {
        "total_followers": total_followers,
        "total_following": total_following
    }


@router.get("/followers/")
def get_followers(
    user_id: int, 
    current_user_id: int, 
    limit: int = 20,
    last_follower_id: int = None,  
    db: Session = Depends(get_db)
):
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required")
    query = (
        db.query(UserProfile.id, UserProfile.full_name, UserProfile.profile_image)
        .join(Follow, Follow.follower_id == UserProfile.auth_user_id)
        .filter(Follow.following_id == user_id, Follow.is_active == True)
    )
    if last_follower_id:
        query = query.filter(UserProfile.id > last_follower_id)

    followers = query.order_by(UserProfile.id).limit(limit).all()

    mutuals = (
        db.query(UserProfile.auth_user_id)
        .join(Follow, Follow.follower_id == UserProfile.auth_user_id)
        .filter(Follow.following_id == user_id, Follow.is_active == True)
        .filter(Follow.follower_id == current_user_id)
        .all()
    )
    mutual_ids = {m[0] for m in mutuals}
    followers_list = [
        {
            "id": f.id,
            "full_name": f.full_name,
            "profile_image": f.profile_image,
            "is_mutual": f.id in mutual_ids,
        }
        for f in followers
    ]
    next_cursor = followers_list[-1]["id"] if followers_list else None

    return {"followers": followers_list, "next_cursor": next_cursor}


@router.get("/followers/")
def get_followers(
    user_id: int, 
    current_user_id: int, 
    limit: int = 10, 
    last_follower_id: int = None,
    db: Session = Depends(get_db)
):
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required")
    query = (
        db.query(UserProfile.id, UserProfile.full_name, UserProfile.profile_image)
        .join(Follow, Follow.follower_id == UserProfile.auth_user_id)
        .filter(Follow.following_id == user_id, Follow.is_active == True)
    )
    if last_follower_id:
        query = query.filter(UserProfile.id > last_follower_id)

    followers = query.order_by(UserProfile.id).limit(limit).all()
    mutuals = (
        db.query(UserProfile.auth_user_id)
        .join(Follow, Follow.follower_id == UserProfile.auth_user_id)
        .filter(Follow.following_id == user_id, Follow.is_active == True)
        .filter(Follow.follower_id == current_user_id)
        .all()
    )
    mutual_ids = {m[0] for m in mutuals}

    followers_list = [
        {
            "id": f.id,
            "full_name": f.full_name,
            "profile_image": f.profile_image,
            "is_mutual": f.id in mutual_ids,
        }
        for f in followers
    ]
    next_cursor = followers_list[-1]["id"] if followers_list else None

    return {"followers": followers_list, "next_cursor": next_cursor}


@router.get("/followers/suggestions/")
def get_follow_suggestions(
    current_user_id: int, 
    limit: int = 10,  
    db: Session = Depends(get_db)
):
    if not current_user_id:
        raise HTTPException(status_code=400, detail="User ID is required")
    
    following_subquery = (
        db.query(Follow.following_id)
        .filter(Follow.follower_id == current_user_id, Follow.is_active == True)
        .subquery()
    )
    suggested_users_query = (
        db.query(
            UserProfile.id, 
            UserProfile.full_name, 
            UserProfile.profile_image,
            db.query(Follow).filter(Follow.following_id == UserProfile.auth_user_id, Follow.is_active == True).count().label("total_followers"),
            db.query(Follow).filter(Follow.follower_id == UserProfile.auth_user_id, Follow.is_active == True).count().label("total_following")
        )
        .join(Follow, Follow.follower_id == UserProfile.auth_user_id)
        .filter(Follow.following_id.in_(following_subquery))
        .filter(Follow.follower_id != current_user_id)
        .filter(Follow.following_id.notin_(following_subquery))
        .distinct() 
        .limit(limit)
    )

    suggested_users = suggested_users_query.all()

    suggestions_list = [
        {
            "id": s.id,
            "full_name": s.full_name,
            "profile_image": s.profile_image,
            "total_followers": s.total_followers,
            "total_following": s.total_following,
        }
        for s in suggested_users
    ]

    return {"suggestions": suggestions_list}

