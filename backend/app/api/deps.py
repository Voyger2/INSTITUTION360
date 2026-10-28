from collections.abc import Generator

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    subject = decode_access_token(token)
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.get(User, subject)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_authenticated(user: User = Depends(get_current_user)) -> User:
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Administrator role required")
    return user


def require_not_oversight(user: User = Depends(get_current_user)) -> User:
    if user.role == "oversight_officer":
        raise HTTPException(
            status_code=403,
            detail="Oversight officers have read-only access",
        )
    return user


def enforce_bureau_scope(complaint_bureau_code: str, user: User) -> None:
    """Server-enforced case-scoping: admins act on any bureau; bureau
    officers only on their own bureau; oversight is rejected upstream."""
    if user.role == "admin":
        return
    if user.role == "bureau_officer" and user.bureau_code == complaint_bureau_code:
        return
    raise HTTPException(
        status_code=403,
        detail="This demo bureau does not own this case",
    )
