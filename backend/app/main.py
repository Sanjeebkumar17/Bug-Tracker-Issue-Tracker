import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.api_router import api_router
from app.db.init_db import init_db

# Initialize database tables
init_db()

# Auto-seed initial demo accounts and projects if database has 0 users
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import hash_password
try:
    _db = SessionLocal()
    if _db.query(User).count() == 0:
        import seed_data
        seed_data.seed()
    
    # Ensure admin63123@gmail.com also exists as Admin
    _custom_user = _db.query(User).filter(User.email == "admin63123@gmail.com").first()
    if not _custom_user:
        _custom_user = User(
            email="admin63123@gmail.com",
            username="admin63123",
            full_name="Admin User",
            role="admin",
            hashed_password=hash_password("admin123"),
            avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
            is_active=True
        )
        _db.add(_custom_user)
        _db.commit()
    _db.close()
except Exception as _e:
    print(f"Auto-seed check note: {_e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="High-performance, industry-grade Issue Tracking System (Jira/Linear-like) built with FastAPI, SQLAlchemy, and WebSockets.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads/screenshots
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "documentation": "/docs",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
