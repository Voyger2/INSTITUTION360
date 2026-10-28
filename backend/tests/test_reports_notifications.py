from tests.conftest import EMAILS, auth_headers, login


def test_reports_summary_shape(client, seed_data):
    token = login(client, EMAILS["admin"])
    response = client.get("/api/reports/summary", headers=auth_headers(token))
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
        "bureau_wise",
        "region_wise",
        "status_wise",
        "pending_ageing",
        "metrics",
        "is_demo_data",
    }
    rb = next(b for b in body["bureau_wise"] if b["bureau_code"] == "RB")
    assert rb["total_cases"] == 2  # cmp-a-rb + cmp-b-rb
    assert rb["overdue_cases"] == 1  # cmp-a-rb is overdue
    assert rb["avg_disposal_days"] > 0  # cmp-b-rb is disposed


def test_reports_summary_csv(client, seed_data):
    token = login(client, EMAILS["rb"])
    response = client.get("/api/reports/summary.csv", headers=auth_headers(token))
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "Bureau Code" in response.text
    assert "RB" in response.text


def test_notifications_endpoint(client, seed_data):
    token = login(client, EMAILS["rb"])
    response = client.get("/api/notifications", headers=auth_headers(token))
    assert response.status_code == 200
    body = response.json()
    assert body["counts"]["overdue"] == 1  # cmp-a-rb
    assert body["counts"]["due_soon"] == 1  # cmp-a-pgrc (3 days left <= 7)
    assert body["counts"]["new_overlap_alerts"] == 0  # not detected yet


def test_dashboard_metrics(client, seed_data):
    token = login(client, EMAILS["admin"])
    response = client.get("/api/dashboard/metrics", headers=auth_headers(token))
    assert response.status_code == 200
    body = response.json()
    assert body["total_cases"] == 4
    assert body["disposed_cases"] == 1
    assert body["overdue_cases"] == 1


def test_audit_events_admin_only(client, seed_data):
    admin_token = login(client, EMAILS["admin"])
    rb_token = login(client, EMAILS["rb"])

    forbidden = client.get("/api/audit-events", headers=auth_headers(rb_token))
    assert forbidden.status_code == 403

    # Generate an auditable action, then read as admin.
    client.post(
        "/api/complaints/cmp-a-rb/status-change",
        json={"to_status": "Action Initiated", "reason": "audit test"},
        headers=auth_headers(admin_token),
    )
    allowed = client.get("/api/audit-events", headers=auth_headers(admin_token))
    assert allowed.status_code == 200
    actions = {event["action"] for event in allowed.json()["items"]}
    assert "status_change" in actions


def test_institution_case_history(client, seed_data):
    token = login(client, EMAILS["admin"])
    response = client.get("/api/institutions/inst-a", headers=auth_headers(token))
    assert response.status_code == 200
    body = response.json()
    assert body["total_cases"] == 2
    assert body["active_cases"] == 2
    assert body["institution"]["aicte_permanent_id"] == "AICTE/TEST/0001"


def test_unknown_ids_return_404(client, seed_data):
    token = login(client, EMAILS["admin"])
    assert client.get("/api/complaints/nope", headers=auth_headers(token)).status_code == 404
    assert client.get("/api/institutions/nope", headers=auth_headers(token)).status_code == 404
