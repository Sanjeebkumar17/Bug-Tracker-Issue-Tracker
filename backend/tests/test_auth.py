def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_login_success(client):
    response = client.post("/api/v1/auth/login", json={
        "username_or_email": "test_admin@example.com",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" == "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "test_admin@example.com"

def test_login_wrong_password(client):
    response = client.post("/api/v1/auth/login", json={
        "username_or_email": "test_admin@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_get_current_user_profile(client, admin_headers):
    response = client.get("/api/v1/auth/me", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["username"] == "test_admin"
