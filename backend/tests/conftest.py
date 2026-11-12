import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import Base, get_db
from app.main import app
from app.core.security import hash_password, create_access_token
from app.models.user import User
from app.models.project import Project, ProjectMember
from app.models.ticket import Ticket
from app.models.sprint import Sprint
from app.models.tag import Tag

# Use isolated SQLite test database
TEST_SQLALCHEMY_DATABASE_URL = "sqlite:///./test_runner.db"
engine = create_engine(TEST_SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Seed test users
    admin = User(
        email="test_admin@example.com",
        username="test_admin",
        full_name="Test Admin",
        role="admin",
        hashed_password=hash_password("admin123"),
        is_active=True
    )
    dev = User(
        email="test_dev@example.com",
        username="test_dev",
        full_name="Test Developer",
        role="developer",
        hashed_password=hash_password("dev123"),
        is_active=True
    )
    viewer = User(
        email="test_viewer@example.com",
        username="test_viewer",
        full_name="Test Viewer",
        role="viewer",
        hashed_password=hash_password("viewer123"),
        is_active=True
    )
    db.add_all([admin, dev, viewer])
    db.commit()

    # Create test project
    proj = Project(
        name="Test Project",
        key="TEST",
        description="Test suite project",
        owner_id=admin.id
    )
    db.add(proj)
    db.commit()

    pm_admin = ProjectMember(project_id=proj.id, user_id=admin.id, role="admin")
    pm_dev = ProjectMember(project_id=proj.id, user_id=dev.id, role="developer")
    pm_viewer = ProjectMember(project_id=proj.id, user_id=viewer.id, role="viewer")
    db.add_all([pm_admin, pm_dev, pm_viewer])
    db.commit()

    db.close()
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_runner.db"):
        try:
            os.remove("./test_runner.db")
        except OSError:
            pass

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def admin_headers():
    db = TestingSessionLocal()
    user = db.query(User).filter(User.username == "test_admin").first()
    token = create_access_token(user.id)
    db.close()
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def dev_headers():
    db = TestingSessionLocal()
    user = db.query(User).filter(User.username == "test_dev").first()
    token = create_access_token(user.id)
    db.close()
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def viewer_headers():
    db = TestingSessionLocal()
    user = db.query(User).filter(User.username == "test_viewer").first()
    token = create_access_token(user.id)
    db.close()
    return {"Authorization": f"Bearer {token}"}
