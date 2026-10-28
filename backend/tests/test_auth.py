from tests.conftest import TEST_PASSWORD, auth_headers, login


def test_login_success_returns_token_and_user(client, seed_data):
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@test.example", "password": TEST_PASSWORD},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["user"]["role"] == "admin"
    assert "hashed" not in body["user"]


def test_login_rejects_wrong_password(client, seed_data):
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@test.example", "password": "wrong-password"},
    )
    assert response.status_code == 401


def test_me_requires_token(client, seed_data):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_resolves_token(client, seed_data):
    token = login(client, "rb@test.example")
    response = client.get("/api/auth/me", headers=auth_headers(token))
    assert response.status_code == 200
    assert response.json()["bureau_code"] == "RB"
