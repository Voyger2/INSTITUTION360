from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.db.session import get_db
from app.services.reporting import dashboard_metrics
from sqlalchemy.orm import Session

router = APIRouter(tags=["dashboard"], dependencies=[Depends(get_current_user)])


@router.get("/dashboard/metrics")
def metrics(db: Session = Depends(get_db)) -> dict:
    return {**dashboard_metrics(db), "is_demo_data": True}
