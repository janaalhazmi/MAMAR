from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.db.database import get_db
from app.models import Provider, User
from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest, UserResponse
from app.schemas.error import ErrorResponse

router = APIRouter(prefix="/auth", tags=["auth"])

# The errors of each endpoint in Stage 3, shown in /docs.
REGISTER_ERRORS = {
    404: {"model": ErrorResponse, "description": "The provider_id does not exist"},
    409: {"model": ErrorResponse, "description": "The email is already registered"},
    422: {"model": ErrorResponse, "description": "A field is missing or not valid"},
}
LOGIN_ERRORS = {
    401: {"model": ErrorResponse, "description": "The email or password is wrong"},
    422: {"model": ErrorResponse, "description": "A field is missing or not valid"},
}


@router.post("/register", status_code=201, response_model=UserResponse, responses=REGISTER_ERRORS)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    # Creates a new user account (Stage 3, section 4.2.3). It does not need a token.
    if data.provider_id is not None and db.get(Provider, data.provider_id) is None:
        raise HTTPException(status_code=404, detail="Provider not found")

    if db.scalar(select(User).where(User.email == data.email)) is not None:
        raise HTTPException(status_code=409, detail="Email is already registered")

    user = User(
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        role=data.role,
        provider_id=data.provider_id,
    )
    user.set_password(data.password)
    db.add(user)
    try:
        db.commit()
    except IntegrityError as error:
        # Two requests with the same email at the same moment.
        db.rollback()
        raise HTTPException(status_code=409, detail="Email is already registered") from error
    db.refresh(user)
    return user.to_dict()


@router.post("/login", response_model=LoginResponse, responses=LOGIN_ERRORS)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    # Checks the email and password, then returns a token for the next requests (Stage 3, section 4.2.4).
    user = db.scalar(select(User).where(User.email == data.email))
    # The same message for a wrong email and a wrong password, so the API does not tell which one is wrong.
    if user is None or not user.is_active or not user.check_password(data.password):
        raise HTTPException(status_code=401, detail="Email or password is wrong")
    return {
        "access_token": create_access_token(user),
        "token_type": "bearer",
        "user": {
            "user_id": user.user_id,
            "full_name": user.full_name,
            "role": user.role,
            "provider_id": user.provider_id,
        },
    }
