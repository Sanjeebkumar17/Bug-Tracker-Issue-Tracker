def test_sprint_lifecycle(client, admin_headers):
    proj_res = client.get("/api/v1/projects", headers=admin_headers)
    project_id = proj_res.json()[0]["id"]

    # 1. Create Sprint
    create_res = client.post(f"/api/v1/projects/{project_id}/sprints", json={
        "name": "Integration Sprint 1",
        "goal": "Test sprint lifecycle API",
        "status": "future"
    }, headers=admin_headers)
    assert create_res.status_code == 201
    sprint = create_res.json()
    assert sprint["name"] == "Integration Sprint 1"

    # 2. Update Sprint to Active
    update_res = client.put(f"/api/v1/sprints/{sprint['id']}", json={
        "status": "active"
    }, headers=admin_headers)
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "active"

def test_tags_and_worklog(client, dev_headers):
    proj_res = client.get("/api/v1/projects", headers=dev_headers)
    project_id = proj_res.json()[0]["id"]

    # 1. Create Tag
    tag_res = client.post(f"/api/v1/projects/{project_id}/tags", json={
        "name": "api-test-tag",
        "color": "#10b981"
    }, headers=dev_headers)
    assert tag_res.status_code == 201
    tag_id = tag_res.json()["id"]

    # 2. Create Ticket with Tag
    ticket_res = client.post("/api/v1/tickets", json={
        "project_id": project_id,
        "title": "Tagged ticket for time tracking",
        "type": "task",
        "priority": "medium",
        "status": "todo",
        "tag_ids": [tag_id],
        "estimated_hours": 5.0
    }, headers=dev_headers)
    assert ticket_res.status_code == 201
    ticket = ticket_res.json()
    assert len(ticket["tags"]) == 1
    assert ticket["tags"][0]["name"] == "api-test-tag"

    # 3. Log Work
    work_res = client.post(f"/api/v1/tickets/{ticket['id']}/worklogs", json={
        "time_spent_minutes": 90,
        "description": "Implemented unit tests"
    }, headers=dev_headers)
    assert work_res.status_code == 201
    assert work_res.json()["time_spent_minutes"] == 90

    # 4. Check Activity Log
    act_res = client.get(f"/api/v1/tickets/{ticket['id']}/activities", headers=dev_headers)
    assert act_res.status_code == 200
    activities = act_res.json()
    assert any(a["action"] == "work_logged" for a in activities)
