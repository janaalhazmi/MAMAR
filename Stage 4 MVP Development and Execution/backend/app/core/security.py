from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import SECRET_KEY
from app.db.database import get_db
from app.models import User

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Reads the header "Authorization: Bearer <token>".
bearer_scheme = HTTPBearer(auto_error=False)


def create_access_token(user: User) -> str:
    # The token (JWT) keeps the user id and role, and expires after ACCESS_TOKEN_EXPIRE_MINUTES.
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user.user_id), "role": user.role, "exp": expires_at}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    # Every endpoint except the two auth endpoints uses this check (Stage 3, section 4.2.1).
    if credentials is None:
        raise HTTPException(status_code=401, detail="Token is missing", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user = db.get(User, int(payload["sub"]))
    except (jwt.InvalidTokenError, KeyError, ValueError) as error:
        raise HTTPException(
            status_code=401, detail="Token is not valid", headers={"WWW-Authenticate": "Bearer"}
        ) from error
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="Token is not valid", headers={"WWW-Authenticate": "Bearer"})
    return user


def allow_roles(*roles: str, detail: str):
    # Returns a check for the endpoints of some roles only. Another role gets 403 with detail.
    # Example: Depends(allow_roles("provider", detail="Only providers can submit quotes"))
    def check(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail=detail)
        return user

    return check
