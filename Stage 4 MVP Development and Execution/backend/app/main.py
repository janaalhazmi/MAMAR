from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

from app.core.config import FRONTEND_ORIGINS
from app.db.init_db import add_demo_providers, create_tables
from app.routers import assignments, auth, health, projects, quotes, service_requests


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once when the server starts.
    create_tables()
    add_demo_providers()
    yield


app = FastAPI(title="MAMAR API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(service_requests.router)
app.include_router(quotes.router)
app.include_router(assignments.router)


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
