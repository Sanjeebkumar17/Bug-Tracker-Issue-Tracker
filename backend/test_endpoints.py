import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.db.session import SessionLocal
from app.models.user import User
from app.models.project import Project
from app.models.ticket import Ticket
from app.models.comment import Comment
from app.core.security import verify_password, create_access_token, decode_token

def test_system():
    print("--- BUG TRACKER VERIFICATION SUITE ---")
    db = SessionLocal()

    # 1. Verify Users & Auth
    users = db.query(User).all()
    print(f"✓ Found {len(users)} users in database:")
    for u in users:
        print(f"   • {u.full_name} ({u.email}) - Role: {u.role}")

    admin = db.query(User).filter(User.username == "admin").first()
    assert admin is not None, "Admin user missing"
    assert verify_password("admin123", admin.hashed_password), "Password verification failed"
    token = create_access_token(admin.id)
    payload = decode_token(token)
    assert payload["sub"] == str(admin.id), "JWT subject mismatch"
    print("✓ JWT Authentication and Bcrypt validation: OK")

    # 2. Verify Projects
    projects = db.query(Project).all()
    print(f"✓ Found {len(projects)} projects:")
    for p in projects:
        print(f"   • [{p.key}] {p.name} - Members: {len(p.members)}, Tickets: {len(p.tickets)}")
    assert len(projects) >= 2, "Projects count mismatch"

    # 3. Verify Tickets & Kanban States
    tickets = db.query(Ticket).all()
    print(f"✓ Found {len(tickets)} tickets across Kanban statuses:")
    statuses = {"todo": 0, "in_progress": 0, "in_review": 0, "done": 0}
    for t in tickets:
        statuses[t.status] = statuses.get(t.status, 0) + 1
        print(f"   • [{t.key}] ({t.type.upper()} / {t.priority.upper()}) -> Status: {t.status} | Title: {t.title[:45]}...")
    print(f"   Breakdown: {statuses}")

    # 4. Verify Comments & Threading
    comments = db.query(Comment).all()
    threaded = [c for c in comments if c.parent_id is not None]
    print(f"✓ Found {len(comments)} comments ({len(threaded)} nested replies):")
    for c in comments:
        parent_info = f" (Reply to comment #{c.parent_id})" if c.parent_id else " (Top-level)"
        print(f"   • Author {c.author.full_name}{parent_info}: {c.content}")

    db.close()
    print("\nALL SYSTEM & DATABASE VERIFICATION CHECKS PASSED PERFECTLY! 🚀")

if __name__ == "__main__":
    test_system()
