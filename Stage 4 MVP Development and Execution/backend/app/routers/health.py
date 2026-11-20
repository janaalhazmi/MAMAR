from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.database import get_db

router = APIRouter(tags=["health"])


@router.api_route("/health", methods=["GET", "HEAD"])
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError as error:
        raise HTTPException(status_code=503, detail="Database connection failed") from error
    return {"status": "ok", "database": "connected"}
