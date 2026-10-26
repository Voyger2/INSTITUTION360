from tests.conftest import auth_headers, login

EMAILS = {
    "admin": "admin@test.example",
    "rb": "rb@test.example",
    "pgrc": "pgrc@test.example",
    "oversight": "oversight@test.example",
    "apc": "apc@test.example",
}


def test_complaints_require_authentication(client, seed_data):
    response = client.get("/api/complaints")
    assert response.status_code == 401


def test_read_endpoints_open_to_all_roles(client, seed_data):
    for email in EMAILS.values():
        token = login(client, email)
        response = client.get("/api/complaints", headers=auth_headers(token))
        assert response.status_code == 200, email
        assert response.json()["total"] == 4


def test_status_change_by_owning_bureau(client, seed_data):
    token = login(client, EMAILS["rb"])
    response = client.post(
        "/api/complaints/cmp-a-rb/status-change",
        json={"to_status": "Action Initiated", "reason": "Field verification started"},
        headers=auth_headers(token),
    )
    assert response.status_code == 200
    assert response.json()["status"] == "Action Initiated"


def test_status_change_rejected_for_wrong_bureau(client, seed_data):
    token = login(client, EMAILS["pgrc"])
    response = client.post(
        "/api/complaints/cmp-a-rb/status-change",
        json={"to_status": "Action Initiated", "reason": "Not my bureau"},
        headers=auth_headers(token),
    )
    assert response.status_code == 403


def test_status_change_rejected_for_oversight(client, seed_data):
    token = login(client, EMAILS["oversight"])
    response = client.post(
        "/api/complaints/cmp-a-rb/status-change",
        json={"to_status": "Action Initiated", "reason": "Read-only role"},
        headers=auth_headers(token),
    )
    assert response.status_code == 403


def test_admin_can_change_any_bureau(client, seed_data):
    token = login(client, EMAILS["admin"])
    response = client.post(
        "/api/complaints/cmp-a-pgrc/status-change",
        json={"to_status": "Disposed", "reason": "Resolved after review"},
        headers=auth_headers(token),
    )
    assert response.status_code == 200


def test_invalid_transition_rejected(client, seed_data):
    token = login(client, EMAILS["rb"])
    response = client.post(
        "/api/complaints/cmp-b-rb/status-change",
        json={"to_status": "Under Process", "reason": "Disposed is final"},
        headers=auth_headers(token),
    )
    assert response.status_code == 422
    assert "Invalid transition" in response.json()["detail"]


def test_assignment_requires_same_bureau(client, seed_data):
    token = login(client, EMAILS["rb"])
    pgrc_officer_id = "no-such-officer"
    response = client.post(
        "/api/complaints/cmp-a-rb/assignment",
        json={"officer_id": pgrc_officer_id, "reason": "reassign"},
        headers=auth_headers(token),
    )
    assert response.status_code == 422


def test_history_integrity_after_lifecycle(client, seed_data):
    token = login(client, EMAILS["admin"])
    client.post(
        "/api/complaints/cmp-a-rb/status-change",
        json={"to_status": "Action Initiated", "reason": "Escalated"},
        headers=auth_headers(token),
    )
    client.post(
        "/api/complaints/cmp-a-rb/transfer",
        json={
            "to_bureau_code": "APC",
            "officer_id": seed_data["users"][EMAILS["apc"]].id,
            "reason": "Jurisdiction moved to APC",
        },
        headers=auth_headers(token),
    )

    history = client.get("/api/complaints/cmp-a-rb/history", headers=auth_headers(token)).json()
    entry_types = [entry["entry_type"] for entry in history["action_history"]]
    assert "status_change" in entry_types
    assert "transfer" in entry_types

    detail = client.get("/api/complaints/cmp-a-rb", headers=auth_headers(token)).json()
    assert detail["bureau_code"] == "APC"

    assignment_rows = history["assignment_history"]
    assert assignment_rows[0]["detail"]["from_bureau_code"] == "RB"
    assert assignment_rows[0]["detail"]["to_bureau_code"] == "APC"


def test_transfer_requires_active_officer_in_target_bureau(client, seed_data):
    token = login(client, EMAILS["admin"])
    response = client.post(
        "/api/complaints/cmp-a-rb/transfer",
        json={
            "to_bureau_code": "PGRC",
            "officer_id": seed_data["users"][EMAILS["apc"]].id,
            "reason": "Wrong officer for bureau",
        },
        headers=auth_headers(token),
    )
    assert response.status_code == 422
