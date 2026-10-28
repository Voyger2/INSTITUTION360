"""Seed synthetic demo data (SIH26264 prototype).

Creates the demo users, bureaus, institutions and complaints used by the
frontend prototype. Seeded accounts are DEMO credentials — not real users.
Run:  python -m app.seed
"""
import uuid
from datetime import date, timedelta

from sqlalchemy import select

from app.core.config import get_settings
from app.core.security import hash_password
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.bureau import Bureau
from app.models.complaint import Complaint
from app.models.institution import Institution
from app.models.user import User
import app.models.history  # noqa: F401  (register tables)
import app.models.overlap  # noqa: F401

BUREAUS = [
    ("RB", "Regulation Bureau", "C"),
    ("PGRC", "Public Grievance Redressal Cell", "C"),
    ("APC", "Approval Process Cell", "C"),
    ("EOA", "Expert Opinion Assessment", "C"),
    ("NWRO", "North Western Regional Office", "NW"),
    ("SWRO", "South Western Regional Office", "SW"),
    ("SCRO", "South Central Regional Office", "SC"),
    ("NCRO", "North Central Regional Office", "NC"),
    ("CRO", "Central Regional Office", "C"),
    ("WRO", "Western Regional Office", "W"),
]

USERS = [
    ("Rajesh Kumar", "admin@demo.institution360.gov", "admin", None),
    ("Priya Sharma", "priya.sharma@demo.institution360.gov", "bureau_officer", "RB"),
    ("Amit Patel", "amit.patel@demo.institution360.gov", "bureau_officer", "PGRC"),
    ("Sunita Reddy", "sunita.reddy@demo.institution360.gov", "oversight_officer", None),
    ("Vikram Singh", "vikram.singh@demo.institution360.gov", "bureau_officer", "APC"),
]

INSTITUTIONS = [
    ("INST-001", "AICTE/INST/2011/0901", "Sunrise Institute of Technology", "SW", "Maharashtra", "Pune", "Private", 2011),
    ("INST-002", "AICTE/INST/2005/0452", "National Academy of Engineering", "NW", "Rajasthan", "Jaipur", "Government", 2005),
    ("INST-003", "AICTE/INST/2015/1233", "Green Valley University", "S", "Karnataka", "Bengaluru", "State University", 2015),
    ("INST-004", "AICTE/INST/2009/0777", "Coastal Institute of Management", "W", "Gujarat", "Surat", "Autonomous", 2009),
    ("INST-005", "AICTE/INST/2018/1512", "Northern Hills College", "N", "Haryana", "Kurukshetra", "Government Aided", 2018),
]

COMPLAINTS = [
    # (institution_idx, category, bureau, officer_idx, status, received_days_ago, disposal_days_ahead)
    (0, "Approval Process Violation", "RB", 1, "Under Process", 45, -7),
    (0, "Faculty Shortage", "PGRC", 2, "Action Initiated", 30, 5),
    (0, "Infrastructure Deficiency", "APC", 4, "Received", 10, 20),
    (1, "Admission Irregularity", "RB", 1, "Referred to Bureau", 60, -20),
    (1, "Fee Structure Violation", "PGRC", 2, "Pending Clarification", 25, 3),
    (2, "Academic Quality", "APC", 4, "Under Process", 50, -10),
    (2, "Compliance Failure", "RB", 1, "Disposed", 90, -5),
    (3, "Document Verification", "PGRC", 2, "Under Process", 15, 25),
    (3, "Grievance Redressal", "APC", 4, "Received", 5, 40),
    (4, "Other", "RB", 1, "Action Initiated", 70, -3),
]


def seed() -> None:
    settings = get_settings()
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        if db.scalars(select(User).limit(1)).first():
            print("Seed skipped: data already present.")
            return

        for code, name, region in BUREAUS:
            db.add(Bureau(code=code, name=name, region_code=region, description=""))

        users: dict[int, User] = {}
        for idx, (name, email, role, bureau_code) in enumerate(USERS):
            user = User(
                id=uuid.uuid4().hex,
                name=name,
                email=email,
                hashed_password=hash_password(settings.seed_password),
                role=role,
                bureau_code=bureau_code,
                is_demo_data=True,
            )
            users[idx] = user
            db.add(user)

        institutions: list[Institution] = []
        for iid, aicte_id, name, region, state, district, itype, year in INSTITUTIONS:
            inst = Institution(
                id=iid,
                aicte_permanent_id=aicte_id,
                name=name,
                region_code=region,
                state=state,
                district=district,
                type=itype,
                established_year=year,
                address="Demo address, India",
                is_demo_data=True,
            )
            institutions.append(inst)
            db.add(inst)

        officer_for_bureau = {u.bureau_code: u for u in users.values() if u.bureau_code}
        today = date.today()
        for idx, (inst_idx, category, bureau, officer_idx, status, received_ago, disposal_in) in enumerate(COMPLAINTS, start=1):
            received = today - timedelta(days=received_ago)
            db.add(
                Complaint(
                    id=uuid.uuid4().hex,
                    case_id=f"CMP-2026-{idx:04d}",
                    institution_id=institutions[inst_idx].id,
                    category=category,
                    bureau_code=bureau,
                    assigned_officer_id=users[officer_idx].id,
                    status=status,
                    received_date=received,
                    expected_disposal_date=today + timedelta(days=disposal_in),
                    last_action_date=received,
                    description=f"Synthetic demonstration complaint #{idx} ({category}).",
                    is_demo_data=True,
                    created_at=received,
                )
            )

        db.commit()
        print(f"Seeded {len(BUREAUS)} bureaus, {len(USERS)} users, {len(INSTITUTIONS)} institutions, {len(COMPLAINTS)} complaints.")
        print(f"Demo login password for all seeded users: {settings.seed_password}")


if __name__ == "__main__":
    seed()
