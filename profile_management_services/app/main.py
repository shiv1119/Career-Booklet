from fastapi import FastAPI
from app.core.database import Base, engine
from app.routers import profile, education, position, project, course
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
app = FastAPI()

allowed_origins = [
    "http://localhost:3000",
    "https://your-production-domain.com",
    "http://127.0.0.1:9002",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(profile.router, prefix="/api", tags=["Profile Management Services"])
app.include_router(education.router, prefix="/api", tags=["Profile Management Services"])
app.include_router(position.router, prefix="/api", tags=["Profile Management Services"])
app.include_router(project.router, prefix="/api", tags=["Profile Management Services"])
app.include_router(course.router, prefix="/api", tags=["Profile Management Services"])
