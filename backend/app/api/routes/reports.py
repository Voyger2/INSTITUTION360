import csv
import io

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.services import reporting
from app.services.reporting import (
    bureau_workload,
    dashboard_metrics,
    pending_ageing,
    region_distribution,
    status_distribution,
)

router = APIRouter(prefix="/reports", tags=["reports"], dependencies=[Depends(get_current_user)])


@router.get("/summary")
def summary(db: Session = Depends(get_db)) -> dict:
    return {
        "bureau_wise": bureau_workload(db),
        "region_wise": region_distribution(db),
        "status_wise": status_distribution(db),
        "pending_ageing": pending_ageing(db),
        "metrics": dashboard_metrics(db),
        "is_demo_data": True,
    }


@router.get("/summary.csv")
def summary_csv(db: Session = Depends(get_db)) -> StreamingResponse:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        ["Bureau Code", "Bureau Name", "Total Cases", "Active Cases", "Overdue", "Avg Disposal Days"]
    )
    for row in bureau_workload(db):
        writer.writerow(
            [
                row["bureau_code"],
                row["bureau_name"],
                row["total_cases"],
                row["active_cases"],
                row["overdue_cases"],
                row["avg_disposal_days"],
            ]
        )
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=institution360-bureau-summary.csv"},
    )
