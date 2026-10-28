from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.history import AuditEvent

router = APIRouter(prefix="/audit-events", tags=["audit"], dependencies=[Depends(require_admin)])


@router.get("")
def list_audit_events(
    entity_type: str | None = None,
    action: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> dict:
    query = select(AuditEvent)
    if entity_type:
        query = query.where(AuditEvent.entity_type == entity_type)
    if action:
        query = query.where(AuditEvent.action == action)
    total = len(db.scalars(query).all())
    events = db.scalars(
        query.order_by(AuditEvent.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return {
        "items": [
            {
                "id": e.id,
                "actor_id": e.actor_id,
                "actor_name": e.actor_name,
                "action": e.action,
                "entity_type": e.entity_type,
                "entity_id": e.entity_id,
                "detail": e.detail,
                "created_at": e.created_at.isoformat(),
            }
            for e in events
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "is_demo_data": True,
    }
