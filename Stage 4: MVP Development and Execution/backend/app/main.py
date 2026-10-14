from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.core.config import FRONTEND_ORIGINS
from app.db.init_db import create_tables
from app.routers import health


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once when the server starts.
    create_tables()
    yield


app = FastAPI(title="MAMAR API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(health.router)


@app.get("/", include_in_schema=False)
def root():
    # Opening the server address shows the API documentation.
    return RedirectResponse(url="/docs")
