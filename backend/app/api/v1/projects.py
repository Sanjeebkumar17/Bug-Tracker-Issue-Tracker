from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.core.deps import get_current_user, get_project_role
from app.models.user import User
from app.models.project import Project, ProjectMember
from app.models.ticket import Ticket
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse, 
    ProjectDetailResponse, ProjectMemberAdd, ProjectMemberUpdate, ProjectMemberResponse
)

router = APIRouter()

def enrich_project(project: Project, db: Session) -> dict:
    members_count = db.query(func.count(ProjectMember.id)).filter(ProjectMember.project_id == project.id).scalar()
    tickets_count = db.query(func.count(Ticket.id)).filter(Ticket.project_id == project.id).scalar()
    return {
        "id": project.id,
        "name": project.name,
        "key": project.key,
        "description": project.description,
        "owner_id": project.owner_id,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "owner": project.owner,
        "members_count": members_count,
        "tickets_count": tickets_count
    }

@router.get("", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "admin":
        projects = db.query(Project).all()
    else:
        # Projects owned or where user is member
        subquery = db.query(ProjectMember.project_id).filter(ProjectMember.user_id == current_user.id).subquery()
        projects = db.query(Project).filter(
            (Project.owner_id == current_user.id) | (Project.id.in_(subquery))
        ).all()
    
    return [enrich_project(p, db) for p in projects]

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Key must be uppercase
    clean_key = project_in.key.strip().upper()
    
    # Check if key already exists
    if db.query(Project).filter(Project.key == clean_key).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project key '{clean_key}' is already in use. Please choose another."
        )

    project = Project(
        name=project_in.name,
        key=clean_key,
        description=project_in.description,
        owner_id=current_user.id
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # Automatically add creator as admin member
    member = ProjectMember(
        project_id=project.id,
        user_id=current_user.id,
        role="admin"
    )
    db.add(member)
    db.commit()

    return enrich_project(project, db)

@router.get("/{project_id}", response_model=ProjectDetailResponse)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    role = get_project_role(project_id, current_user, db)
    if not role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this project")

    base = enrich_project(project, db)
    base["members"] = project.members
    return base

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    role = get_project_role(project_id, current_user, db)
    if role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only project admins can edit project details")

    if project_in.name is not None:
        project.name = project_in.name
    if project_in.description is not None:
        project.description = project_in.description

    db.commit()
    db.refresh(project)
    return enrich_project(project, db)

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if current_user.role != "admin" and project.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the project owner or system admin can delete this project")

    db.delete(project)
    db.commit()
    return None

# Member management
@router.post("/{project_id}/members", response_model=ProjectMemberResponse, status_code=status.HTTP_201_CREATED)
def add_project_member(
    project_id: int,
    member_in: ProjectMemberAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    role = get_project_role(project_id, current_user, db)
    if role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only project admins can add team members")

    user_to_add = db.query(User).filter(User.id == member_in.user_id).first()
    if not user_to_add:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == member_in.user_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already a member of this project")

    new_member = ProjectMember(
        project_id=project_id,
        user_id=member_in.user_id,
        role=member_in.role or "developer"
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member

@router.put("/{project_id}/members/{user_id}", response_model=ProjectMemberResponse)
def update_project_member_role(
    project_id: int,
    user_id: int,
    update_in: ProjectMemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    role = get_project_role(project_id, current_user, db)
    if role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only project admins can change member roles")

    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project member not found")

    member.role = update_in.role
    db.commit()
    db.refresh(member)
    return member

@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_project_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    role = get_project_role(project_id, current_user, db)
    if role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot remove member without admin role")

    if project.owner_id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove the project owner")

    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id
    ).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    db.delete(member)
    db.commit()
    return None
