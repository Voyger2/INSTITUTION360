from tests.conftest import EMAILS, auth_headers, login


def test_overlap_detection_across_bureaus(client, seed_data):
    token = login(client, EMAILS["admin"])
    created = client.post("/api/overlaps/detect", headers=auth_headers(token))
    assert created.status_code == 200
    assert created.json()["created"] == 1  # inst A has RB + PGRC active cases

    alerts = client.get("/api/overlaps", headers=auth_headers(token)).json()
    assert len(alerts) == 1
    alert = alerts[0]
    assert alert["institution_aicte_id"] == "AICTE/TEST/0001"
    assert sorted(alert["bureau_codes"]) == ["PGRC", "RB"]
    assert sorted(alert["case_ids"]) == ["CMP-T-0001", "CMP-T-0002"]


def test_single_bureau_cases_do_not_overlap(client, seed_data):
    token = login(client, EMAILS["admin"])
    client.post("/api/overlaps/detect", headers=auth_headers(token))
    alerts = client.get("/api/overlaps", headers=auth_headers(token)).json()
    assert all(alert["institution_aicte_id"] != "AICTE/TEST/0002" for alert in alerts)


def test_detect_is_idempotent_per_case_set(client, seed_data):
    token = login(client, EMAILS["admin"])
    first = client.post("/api/overlaps/detect", headers=auth_headers(token)).json()
    second = client.post("/api/overlaps/detect", headers=auth_headers(token)).json()
    assert first["created"] == 1
    assert second["created"] == 0


def test_overlap_review_updates_state(client, seed_data):
    token = login(client, EMAILS["admin"])
    client.post("/api/overlaps/detect", headers=auth_headers(token))
    alert_id = client.get("/api/overlaps", headers=auth_headers(token)).json()[0]["id"]

    response = client.post(
        f"/api/overlaps/{alert_id}/review",
        json={"decision": "coordination_required", "reason": "Bureaus must coordinate"},
        headers=auth_headers(token),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["alert_status"] == "coordination_required"
    assert body["review_decision"] == "coordination_required"
    assert body["reviewed_by"] is not None


def test_overlap_review_rejects_invalid_decision(client, seed_data):
    token = login(client, EMAILS["admin"])
    client.post("/api/overlaps/detect", headers=auth_headers(token))
    alert_id = client.get("/api/overlaps", headers=auth_headers(token)).json()[0]["id"]
    response = client.post(
        f"/api/overlaps/{alert_id}/review",
        json={"decision": "nonsense", "reason": "bad"},
        headers=auth_headers(token),
    )
    assert response.status_code == 422


def test_overlap_detection_requires_non_oversight(client, seed_data):
    token = login(client, EMAILS["oversight"])
    response = client.post("/api/overlaps/detect", headers=auth_headers(token))
    assert response.status_code == 403


def test_disposed_cases_leave_overlap(client, seed_data):
    token = login(client, EMAILS["admin"])
    # Dispose the PGRC case; inst A then has only one active bureau.
    client.post(
        "/api/complaints/cmp-a-pgrc/status-change",
        json={"to_status": "Disposed", "reason": "Resolved"},
        headers=auth_headers(token),
    )
    created = client.post("/api/overlaps/detect", headers=auth_headers(token)).json()
    assert created["created"] == 0
    alerts = client.get("/api/overlaps", headers=auth_headers(token)).json()
    assert all("CMP-T-0002" not in alert["case_ids"] for alert in alerts)
