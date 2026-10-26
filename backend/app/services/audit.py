import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.history import AuditEvent
from app.models.user import utcnow


def record_audit(
    db: Session,
    *,
    actor_id: str,
    actor_name: str,
    action: str,
    entity_type: str,
    entity_id: str,
    detail: str = "",
    at: datetime | None = None,
) -> AuditEvent:
    event = AuditEvent(
        id=uuid.uuid4().hex,
        actor_id=actor_id,
        actor_name=actor_name,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        detail=detail,
        created_at=at or utcnow(),
    )
    db.add(event)
    return event
