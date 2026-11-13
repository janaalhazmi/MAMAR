from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

from app.core.config import FRONTEND_ORIGINS
from app.core.limits import MAX_BODY_BYTES
from app.db.init_db import add_admin_account, add_demo_accounts, add_demo_providers, create_tables, upgrade_tables
from app.routers import admin, extras, reviews, notifications, assignments, auth, devices, field_work, health, payments, projects, provider, quotes, service_requests, workflow


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once when the server starts.
    create_tables()
    upgrade_tables()
    add_demo_providers()
    add_admin_account()
    add_demo_accounts()
    yield


app = FastAPI(title="MAMAR API", lifespan=lifespan)


@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    # Refuses a huge upload before it is read, so one request cannot fill the server.
    length = request.headers.get("content-length")
    if length and length.isdigit() and int(length) > MAX_BODY_BYTES:
        return JSONResponse(status_code=413, content={"detail": "The request is too big"})
    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(service_requests.router)
app.include_router(quotes.router)
app.include_router(assignments.router)
app.include_router(workflow.router)
app.include_router(field_work.router)
app.include_router(devices.router)
app.include_router(provider.router)
app.include_router(payments.router)
app.include_router(notifications.router)
app.include_router(admin.router)
app.include_router(extras.router)
app.include_router(reviews.router)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, error: RequestValidationError):
    # Stage 3 error format {"detail": "message"}, also for 422 errors.
    # FastAPI sends a list of problems by default, so we join them in one message.
    messages = []
    for problem in error.errors():
        field = ".".join(part for part in problem["loc"][1:] if isinstance(part, str))
        # Pydantic adds "Value error, " before the messages we write ourselves.
        message = problem["msg"].removeprefix("Value error, ")
        messages.append(f"{field}: {message}" if field else message)
    return JSONResponse(status_code=422, content={"detail": "; ".join(messages)})


@app.get("/", include_in_schema=False)
def root():
    # Opening the server address shows the API documentation.
    return RedirectResponse(url="/docs")
