"""Mapping between frontend demo types and backend models.

Frontend type (src/types/index.ts) -> backend model (app/models/):
  Bureau          -> Bureau
  Institution     -> Institution (aictePermanentId -> aicte_permanent_id, unique)
  Complaint       -> Complaint (isOverdue/daysOverdue are COMPUTED, never stored)
  StatusHistory   -> StatusHistory
  AssignmentHistory -> AssignmentHistory
  ActionHistory   -> ActionHistory (metadata -> meta)
  OverlapAlert    -> OverlapAlert (institutionName/bureauNames/statuses/latestActionDates derived at read time)
  User            -> User (adds hashed_password; demo users are NOT real accounts)
  DemoConfig      -> Settings (deadline thresholds) + VALID_TRANSITIONS constant
  DashboardMetrics/ReportData -> computed by app/services/reporting.py

Derived fields that the frontend stores but the backend computes on read:
  isOverdue = status in ACTIVE_STATUSES and expected_disposal_date < today
  daysOverdue, days_to_deadline, is_active
"""
