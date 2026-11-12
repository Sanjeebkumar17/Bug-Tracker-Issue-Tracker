import os
import sys
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.db.session import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models.user import User
from app.models.project import Project, ProjectMember
from app.models.ticket import Ticket
from app.models.comment import Comment
from app.models.sprint import Sprint
from app.models.tag import Tag
from app.models.activity import ActivityLog
from app.models.worklog import WorkLog
from app.models.notification import Notification

def seed():
    # Re-create tables with updated schema
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing data to cleanly load full enhanced dataset
    print("Populating complete enterprise-grade dataset with Sprints, Tags, Time Logs, and Audit Trail...")
    db.query(Notification).delete()
    db.query(WorkLog).delete()
    db.query(ActivityLog).delete()
    db.query(Comment).delete()
    db.query(Ticket).delete()
    db.query(Tag).delete()
    db.query(Sprint).delete()
    db.query(ProjectMember).delete()
    db.query(Project).delete()
    db.query(User).delete()
    db.commit()

    # 1. Users
    admin_user = User(
        email="admin@example.com",
        username="admin",
        full_name="Alex Mercer (Admin)",
        role="admin",
        hashed_password=hash_password("admin123"),
        avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
        is_active=True
    )
    dev_user = User(
        email="dev@example.com",
        username="sarah_dev",
        full_name="Sarah Connor (Lead Dev)",
        role="developer",
        hashed_password=hash_password("dev123"),
        avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        is_active=True
    )
    viewer_user = User(
        email="viewer@example.com",
        username="david_viewer",
        full_name="David Chen (Stakeholder)",
        role="viewer",
        hashed_password=hash_password("viewer123"),
        avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=David",
        is_active=True
    )

    db.add_all([admin_user, dev_user, viewer_user])
    db.commit()
    db.refresh(admin_user)
    db.refresh(dev_user)
    db.refresh(viewer_user)

    # 2. Projects
    project1 = Project(
        name="Apollo Core Platform",
        key="APOLLO",
        description="Next-generation SaaS platform backend services, API gateway, and microservices orchestrator.",
        owner_id=admin_user.id
    )
    project2 = Project(
        name="CyberShield Security Suite",
        key="CYBER",
        description="Enterprise zero-trust vulnerability scanner and real-time intrusion detection pipeline.",
        owner_id=dev_user.id
    )

    db.add_all([project1, project2])
    db.commit()
    db.refresh(project1)
    db.refresh(project2)

    # Project Memberships
    pm1 = ProjectMember(project_id=project1.id, user_id=admin_user.id, role="admin")
    pm2 = ProjectMember(project_id=project1.id, user_id=dev_user.id, role="developer")
    pm3 = ProjectMember(project_id=project1.id, user_id=viewer_user.id, role="viewer")

    pm4 = ProjectMember(project_id=project2.id, user_id=dev_user.id, role="admin")
    pm5 = ProjectMember(project_id=project2.id, user_id=admin_user.id, role="developer")
    pm6 = ProjectMember(project_id=project2.id, user_id=viewer_user.id, role="viewer")

    db.add_all([pm1, pm2, pm3, pm4, pm5, pm6])
    db.commit()

    # 3. Tags & Labels
    tag_bug = Tag(project_id=project1.id, name="backend", color="#3b82f6")
    tag_sec = Tag(project_id=project1.id, name="security", color="#ef4444")
    tag_ui = Tag(project_id=project1.id, name="ui/ux", color="#8b5cf6")
    tag_perf = Tag(project_id=project1.id, name="performance", color="#f59e0b")
    tag_crit = Tag(project_id=project1.id, name="critical", color="#dc2626")

    db.add_all([tag_bug, tag_sec, tag_ui, tag_perf, tag_crit])
    db.commit()
    db.refresh(tag_bug)
    db.refresh(tag_sec)
    db.refresh(tag_ui)

    # 4. Sprints
    sprint1 = Sprint(
        project_id=project1.id,
        name="Sprint 1 - Core Launch",
        goal="Deliver core JWT authentication, Kanban status drag & drop, and real-time updates.",
        status="active",
        start_date=datetime.now(timezone.utc) - timedelta(days=5),
        end_date=datetime.now(timezone.utc) + timedelta(days=9)
    )
    sprint2 = Sprint(
        project_id=project1.id,
        name="Sprint 2 - Enterprise Hardening",
        goal="Optimize DB connection pooling and introduce multi-region read replicas.",
        status="future",
        start_date=datetime.now(timezone.utc) + timedelta(days=10),
        end_date=datetime.now(timezone.utc) + timedelta(days=24)
    )

    db.add_all([sprint1, sprint2])
    db.commit()
    db.refresh(sprint1)
    db.refresh(sprint2)

    # 5. Tickets with Sprints, Story Points, Tags & Estimates
    t1 = Ticket(
        ticket_number=1,
        key="APOLLO-1",
        title="JWT Token expiration race condition during refresh",
        description="When multiple concurrent requests hit the `/refresh` endpoint, the first invalidates the token while the remaining ones trigger a 401 error.\n\n### Steps to Reproduce:\n1. Open 5 browser tabs simultaneously.\n2. Trigger simultaneous data fetches.\n3. Observe 401 on 4 out of 5 requests.\n\n> Needs a token grace-period or mutex lock.",
        type="bug",
        priority="urgent",
        status="in_progress",
        project_id=project1.id,
        reporter_id=admin_user.id,
        assignee_id=dev_user.id,
        sprint_id=sprint1.id,
        story_points=5,
        estimated_hours=6.0,
        order_index=1000.0
    )
    t1.tags = [tag_bug, tag_sec, tag_crit]

    t2 = Ticket(
        ticket_number=2,
        key="APOLLO-2",
        title="Implement WebSocket real-time board updates",
        description="Broadcast state transitions to all connected project members so changes reflect live without page reload.\n\n- [x] Connection manager implementation\n- [x] Broadcast on status transition\n- [ ] Heartbeat ping/pong monitor",
        type="feature",
        priority="high",
        status="done",
        project_id=project1.id,
        reporter_id=dev_user.id,
        assignee_id=dev_user.id,
        sprint_id=sprint1.id,
        story_points=8,
        estimated_hours=10.0,
        order_index=1000.0
    )
    t2.tags = [tag_bug, tag_perf]

    t3 = Ticket(
        ticket_number=3,
        key="APOLLO-3",
        title="Add screenshot drag-and-drop file upload to issue modal",
        description="Allow users to paste or drag screenshots directly into the issue description or attachment zone for bug clarity.",
        type="feature",
        priority="medium",
        status="in_review",
        project_id=project1.id,
        reporter_id=viewer_user.id,
        assignee_id=dev_user.id,
        sprint_id=sprint1.id,
        story_points=3,
        estimated_hours=4.0,
        order_index=1000.0
    )
    t3.tags = [tag_ui]

    t4 = Ticket(
        ticket_number=4,
        key="APOLLO-4",
        title="PostgreSQL connection pooling optimization under high load",
        description="Review max pool size and overflow limit in SQLAlchemy engine configuration. Benchmark with locust.\n\nCC: @sarah_dev",
        type="task",
        priority="medium",
        status="todo",
        project_id=project1.id,
        reporter_id=admin_user.id,
        assignee_id=admin_user.id,
        sprint_id=sprint2.id,  # In Future Sprint 2
        story_points=5,
        estimated_hours=8.0,
        order_index=1000.0
    )
    t4.tags = [tag_perf, tag_bug]

    t5 = Ticket(
        ticket_number=5,
        key="APOLLO-5",
        title="Design threaded discussion comments for issues",
        description="Support 1-level reply nesting so developers can have focused threads on specific technical comments.",
        type="feature",
        priority="low",
        status="todo",
        project_id=project1.id,
        reporter_id=dev_user.id,
        assignee_id=None,
        sprint_id=None,  # In Backlog!
        story_points=3,
        estimated_hours=4.0,
        order_index=2000.0
    )
    t5.tags = [tag_ui]

    db.add_all([t1, t2, t3, t4, t5])
    db.commit()
    db.refresh(t1)
    db.refresh(t2)

    # 6. Comments
    c1 = Comment(
        ticket_id=t1.id,
        author_id=admin_user.id,
        content="I noticed this happens specifically in high-latency mobile networks when auto-retrying. @sarah_dev please check.",
        parent_id=None
    )
    db.add(c1)
    db.commit()
    db.refresh(c1)

    c2 = Comment(
        ticket_id=t1.id,
        author_id=dev_user.id,
        content="Good catch! I am adding a 30-second token leeway cache with Redis/memory store so overlapping calls succeed.",
        parent_id=c1.id
    )
    db.add(c2)

    # 7. WorkLogs (Time Tracking)
    w1 = WorkLog(ticket_id=t1.id, user_id=dev_user.id, time_spent_minutes=120, description="Diagnosed refresh race condition and wrote reproduction test.")
    w2 = WorkLog(ticket_id=t1.id, user_id=dev_user.id, time_spent_minutes=90, description="Implemented sliding expiration window buffer.")
    w3 = WorkLog(ticket_id=t2.id, user_id=dev_user.id, time_spent_minutes=300, description="Implemented FastAPI WebSocket connection router and board events.")
    db.add_all([w1, w2, w3])

    # 8. Activity Logs (Audit Trail)
    a1 = ActivityLog(ticket_id=t1.id, user_id=admin_user.id, action="created", new_value=t1.title)
    a2 = ActivityLog(ticket_id=t1.id, user_id=admin_user.id, action="assignee_changed", old_value="Unassigned", new_value="Sarah Connor (Lead Dev)")
    a3 = ActivityLog(ticket_id=t1.id, user_id=dev_user.id, action="status_changed", old_value="todo", new_value="in_progress")
    a4 = ActivityLog(ticket_id=t2.id, user_id=dev_user.id, action="status_changed", old_value="in_review", new_value="done")
    db.add_all([a1, a2, a3, a4])

    # 9. Notifications
    n1 = Notification(
        user_id=dev_user.id,
        ticket_id=t1.id,
        title="Mentioned by Alex Mercer (Admin)",
        message="Alex Mercer (Admin) mentioned you in issue APOLLO-1: JWT Token expiration race condition",
        type="mention",
        is_read=False
    )
    n2 = Notification(
        user_id=dev_user.id,
        ticket_id=t1.id,
        title="Assigned to APOLLO-1",
        message="Alex Mercer (Admin) assigned you to APOLLO-1",
        type="assignment",
        is_read=True
    )
    db.add_all([n1, n2])
    db.commit()

    print("Complete enhanced seed data populated successfully! 🚀")
    db.close()

if __name__ == "__main__":
    seed()
