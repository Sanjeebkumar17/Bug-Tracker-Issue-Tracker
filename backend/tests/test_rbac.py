def test_developer_can_create_ticket(client, dev_headers):
    # Fetch test project
    proj_res = client.get("/api/v1/projects", headers=dev_headers)
    assert proj_res.status_code == 200
    project_id = proj_res.json()[0]["id"]

    res = client.post("/api/v1/tickets", json={
        "project_id": project_id,
        "title": "Developer ticket test",
        "description": "Created by dev",
        "type": "bug",
        "priority": "high",
        "status": "todo"
    }, headers=dev_headers)
    assert res.status_code == 201
    assert res.json()["title"] == "Developer ticket test"

def test_viewer_cannot_create_ticket(client, viewer_headers):
    proj_res = client.get("/api/v1/projects", headers=viewer_headers)
    assert proj_res.status_code == 200
    project_id = proj_res.json()[0]["id"]

    res = client.post("/api/v1/tickets", json={
        "project_id": project_id,
        "title": "Viewer ticket attempt",
        "type": "task",
        "priority": "low",
        "status": "todo"
    }, headers=viewer_headers)
    assert res.status_code == 403
    assert "Viewers cannot create tickets" in res.json()["detail"]

def test_viewer_cannot_drag_change_status(client, dev_headers, viewer_headers):
    # Dev creates ticket
    proj_res = client.get("/api/v1/projects", headers=dev_headers)
    project_id = proj_res.json()[0]["id"]

    create_res = client.post("/api/v1/tickets", json={
        "project_id": project_id,
        "title": "Status test issue",
        "type": "feature",
        "priority": "medium",
        "status": "todo"
    }, headers=dev_headers)
    ticket_id = create_res.json()["id"]

    # Viewer attempts status patch
    patch_res = client.patch(f"/api/v1/tickets/{ticket_id}/status", json={
        "status": "in_progress"
    }, headers=viewer_headers)
    assert patch_res.status_code == 403
