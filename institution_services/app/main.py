from fastapi import FastAPI
from app.core.database import Base, engine
from app.routers import institution
from fastapi.middleware.cors import CORSMiddleware

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

app.include_router(institution.router, prefix="/api", tags=["Institution Management Services"])
