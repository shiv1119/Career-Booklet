from fastapi import APIRouter, Depends, Form, HTTPException, status, Body, Request
from typing import Annotated, Dict, Any
from sqlalchemy.orm import Session
from app.models.profile import Follow
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

@router.post("/follow")
def follow(req: Request, follow_data: FollowRequest, db: db_dependency):
    follower_id = req.headers.get("x-user-id")
    following_id = follow_data.following_id

    if follower_id == following_id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")

    follow = db.query(Follow).filter_by(follower_id=follower_id, following_id=following_id).first()

    if follow:
        if follow.is_active:
            return {"message": "Already following"}
        else:
            follow.is_active = True
            follow.created_at = func.now()
            db.commit()
            return {"message": "Followed again"}

    new_follow = Follow(follower_id=follower_id, following_id=following_id)
    db.add(new_follow)
    db.commit()
    return {"message": "Followed successfully"}

@router.post("/unfollow")
def unfollow(req: Request, follow_data: FollowRequest, db: db_dependency):
    follower_id = req.headers.get("x-user-id")
    following_id = follow_data.following_id

    follow = db.query(Follow).filter_by(follower_id=follower_id, following_id=following_id, is_active=True).first()
    
    if not follow:
        return {"message": "Not following this user"}

    follow.is_active = False
    follow.created_at = func.now()
    db.commit()
    return {"message": "Unfollowed successfully"}

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