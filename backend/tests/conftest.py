import os
import uuid
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["SECRET_KEY"] = "test-secret-key-for-pytest-only"
os.environ["DATABASE_URL"] = "sqlite://"

from app.core.config import get_settings  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.main import app  # noqa: E402
from app.models.bureau import Bureau  # noqa: E402
from app.models.complaint import Complaint  # noqa: E402
from app.models.institution import Institution  # noqa: E402
from app.models.user import User  # noqa: E402
from app.core.security import hash_password  # noqa: E402

TEST_PASSWORD = "test-password-123"

EMAILS = {
    "admin": "admin@test.example",
    "rb": "rb@test.example",
    "pgrc": "pgrc@test.example",
    "oversight": "oversight@test.example",
    "apc": "apc@test.example",
}


@pytest.fixture()
def db_engine():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture()
def db_session(db_engine):
    from app.db import session as session_module

    TestingSession = sessionmaker(bind=db_engine, autoflush=False, expire_on_commit=False)
    db = TestingSession()
    yield db
    db.close()


@pytest.fixture()
def client(db_engine, db_session):
    from app.db.session import get_db

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def seed_data(db_session):
    """Minimal consistent dataset: 2 bureaus, 5 users, 2 institutions, 4 complaints."""
    users = {}
    for name, email, role, bureau in [
        ("Admin User", "admin@test.example", "admin", None),
        ("RB Officer", "rb@test.example", "bureau_officer", "RB"),
        ("PGRC Officer", "pgrc@test.example", "bureau_officer", "PGRC"),
        ("Oversight", "oversight@test.example", "oversight_officer", None),
        ("APC Officer", "apc@test.example", "bureau_officer", "APC"),
    ]:
        user = User(
            id=uuid.uuid4().hex,
            name=name,
            email=email,
            hashed_password=hash_password(TEST_PASSWORD),
            role=role,
            bureau_code=bureau,
            is_demo_data=True,
        )
        users[email] = user
        db_session.add(user)

    for code, name, region in [("RB", "Regulation Bureau", "C"), ("PGRC", "Public Grievance Redressal Cell", "C"), ("APC", "Approval Process Cell", "C")]:
        db_session.add(Bureau(code=code, name=name, region_code=region, description=""))

    inst_a = Institution(
        id="inst-a",
        aicte_permanent_id="AICTE/TEST/0001",
        name="Test Institute A",
        region_code="C",
        state="Test State",
        district="Test District",
        type="Private",
        established_year=2010,
        address="Test address",
        is_demo_data=True,
    )
    inst_b = Institution(
        id="inst-b",
        aicte_permanent_id="AICTE/TEST/0002",
        name="Test Institute B",
        region_code="C",
        state="Test State",
        district="Test District",
        type="Government",
        established_year=2012,
        address="Test address",
        is_demo_data=True,
    )
    db_session.add_all([inst_a, inst_b])

    today = date.today()
    complaints = {}
    # Two active complaints for inst A from DIFFERENT bureaus -> overlap.
    complaints["cmp-a-rb"] = Complaint(
        id="cmp-a-rb", case_id="CMP-T-0001", institution_id="inst-a",
        category="Approval Process Violation", bureau_code="RB",
        assigned_officer_id=users["rb@test.example"].id,
        status="Under Process",
        received_date=today - timedelta(days=30),
        expected_disposal_date=today - timedelta(days=7),  # overdue
        last_action_date=today - timedelta(days=2),
        description="Cross-bureau complaint 1",
        is_demo_data=True, created_at=today,
    )
    complaints["cmp-a-pgrc"] = Complaint(
        id="cmp-a-pgrc", case_id="CMP-T-0002", institution_id="inst-a",
        category="Faculty Shortage", bureau_code="PGRC",
        assigned_officer_id=users["pgrc@test.example"].id,
        status="Action Initiated",
        received_date=today - timedelta(days=20),
        expected_disposal_date=today + timedelta(days=3),  # due soon
        last_action_date=today - timedelta(days=1),
        description="Cross-bureau complaint 2",
        is_demo_data=True, created_at=today,
    )
    # inst B: disposed complaint (no overlap) + overdue RB complaint.
    complaints["cmp-b-rb"] = Complaint(
        id="cmp-b-rb", case_id="CMP-T-0003", institution_id="inst-b",
        category="Academic Quality", bureau_code="RB",
        assigned_officer_id=users["rb@test.example"].id,
        status="Disposed",
        received_date=today - timedelta(days=90),
        expected_disposal_date=today - timedelta(days=10),
        last_action_date=today - timedelta(days=5),
        description="Disposed complaint",
        is_demo_data=True, created_at=today,
    )
    complaints["cmp-b-pgrc"] = Complaint(
        id="cmp-b-pgrc", case_id="CMP-T-0004", institution_id="inst-b",
        category="Other", bureau_code="PGRC",
        status="Received",
        received_date=today - timedelta(days=2),
        expected_disposal_date=today + timedelta(days=28),
        last_action_date=today - timedelta(days=2),
        description="Fresh complaint",
        is_demo_data=True, created_at=today,
    )
    for complaint in complaints.values():
        db_session.add(complaint)
    db_session.commit()
    return {"users": users, "complaints": complaints, "institutions": [inst_a, inst_b]}


def login(client: TestClient, email: str) -> str:
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": TEST_PASSWORD},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
