# 🐛 IssueFlow - High-Performance Jira-like Bug Tracker

An industry-grade, full-stack Issue Tracking and Agile Management Platform inspired by **Jira**, **Linear**, and **ClickUp**. Built with modern backend best practices using **Python (FastAPI)** and a modern, responsive **React + Tailwind CSS** frontend.

---

## 🌟 Comprehensive Feature Set

### 1. 🔐 Core Security & Role-Based Access Control (RBAC)
- **JWT Authentication:** Login, registration, password hashing with `bcrypt`, access token generation with configurable expiration.
- **Granular RBAC:** System roles (**Admin**, **Developer**, **Viewer**) and project-level role enforcement across every API endpoint and UI control.

### 2. 📋 Agile Kanban & Product Backlog
- **Interactive Drag-and-Drop Kanban Board:** Fluid status transitions (*To Do, In Progress, In Review, Done*) with column counters and optimistic state synchronization.
- **Sprint & Backlog Planning (`/projects/:id/backlog`):**
  - Create and manage Agile Sprints with goals, start dates, and end dates.
  - Start and complete sprints.
  - Backlog view for unassigned issues with 1-click sprint assignment.
  - Story points computation (Fibonacci scale: 1, 2, 3, 5, 8, 13) per sprint.

### 3. 🏷️ Labels & Tags System
- Project-specific color-coded tags (e.g. `frontend`, `backend`, `security`, `critical`, `ui/ux`).
- Add and remove tags directly from issue modals.
- Colored pill badges displayed on Kanban cards and list views.

### 4. 📝 Rich Markdown Formatting & Preview
- Real-time Markdown rendering for issue descriptions and comments.
- Supports headers (`#`, `##`, `###`), bold, italics, inline code, code blocks (```` ``` ````), blockquotes, bullet lists, and checklists (`- [ ]`, `- [x]`).
- Live "Edit Mode" vs "Markdown Preview" toggle.

### 5. ⏱️ Time Tracking & Estimation
- Set estimated work hours on tickets.
- Log time spent in hours and minutes with custom activity notes.
- Visual progress bar comparing logged work against estimated time.

### 6. 📜 Activity Log & Audit Trail
- Automated change tracking on tickets: records status transitions, priority changes, reassignments, work logs, and comments with author and timestamps.
- Chronological timeline displayed in the "Audit Trail" tab of each issue.

### 7. 🔔 In-App Notifications & `@mentions`
- Notification bell dropdown in the top navbar with live unread badge.
- Automatic notifications when a user is assigned to an issue or `@mentioned` in descriptions/comments.
- 1-click mark as read and "Mark all as read" functionality.

### 8. ⚡ Real-Time WebSockets Synchronization
- FastAPI WebSocket broadcast channel (`/api/v1/ws/{project_id}`).
- Real-time event propagation for ticket creation, status changes, updates, and discussions without page refreshes.

### 9. 📎 File Attachments & Screenshots
- Multipart file upload system with unique UUID filename preservation.
- Image thumbnail previews for screenshots and direct file download endpoints.

### 10. 🐳 Docker & Docker Compose Ready
- Single-command containerized deployment of PostgreSQL 16, FastAPI backend, and Nginx-powered React frontend.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React.js (Vite)
- **Styling:** Tailwind CSS & Lucide Icons
- **HTTP Client:** Axios (with request & response token interceptors)
- **Routing:** React Router v6
- **Drag & Drop:** Native HTML5 Drag and Drop with visual feedback

### Backend
- **Framework:** FastAPI
- **Data Validation & Serialization:** Pydantic v2
- **ORM & Database:** SQLAlchemy 2.0 with SQLite (default) / PostgreSQL support
- **Migrations:** Alembic
- **Security:** PyJWT / python-jose, Bcrypt password hashing
- **File Uploads:** python-multipart, static file mounting
- **WebSockets:** FastAPI WebSocket manager with broadcast channels
- **API Docs:** Interactive Swagger UI (`/docs`) & ReDoc (`/redoc`)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.10+** (Tested on Python 3.12)
- **Node.js 18+** & npm
- *(Optional)* Docker & Docker Compose

### 2. Standard Local Launch (Windows)

1. **Start Backend:**
   Double click `run-backend.bat` or run:
   ```cmd
   .\run-backend.bat
   ```
   *The backend starts at `http://127.0.0.1:8000` with Swagger UI at `http://127.0.0.1:8000/docs`.*

2. **Start Frontend:**
   Double click `run-frontend.bat` or run:
   ```cmd
   .\run-frontend.bat
   ```
   *The frontend starts at `http://localhost:5173`.*

### 3. Docker Launch (One Command)
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- PostgreSQL: Port `5432`

---

## 👥 Demo Accounts (Pre-Seeded)

| Role | Username | Email | Password | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin@example.com` | `admin123` | Full control: delete/edit tickets, manage projects, team roles, and sprints |
| **Developer** | `sarah_dev` | `dev@example.com` | `dev123` | Create & edit tickets, drag Kanban cards, post comments, log work, add tags |
| **Viewer** | `david_viewer` | `viewer@example.com` | `viewer123` | Read-only access: inspect tickets, audit trail, comments, and attachments |

> 💡 *On the login screen, click the **1-Click Demo Login** buttons to sign in instantly as any role.*
