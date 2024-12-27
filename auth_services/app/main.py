from fastapi import FastAPI
from app.core.database import Base, engine
from app.routers import user
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

allowed_origins = [
    "http://localhost:3000",  # For local development
    "https://your-production-domain.com",  # Your production domain
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # List of allowed origins
    allow_credentials=True,        # Allow cookies or Authorization headers
    allow_methods=["*"],           # Allow specific HTTP methods, or "*" for all
    allow_headers=["*"],           # Allow specific headers, or "*" for all
)

Base.metadata.create_all(bind=engine)

app.include_router(user.router, prefix="/api", tags=["users"])

