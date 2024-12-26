from fastapi import FastAPI
from app.core.database import Base, engine
from app.routers import user

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.include_router(user.router, prefix="/api", tags=["users"])

