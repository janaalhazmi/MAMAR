from fastapi.testclient import TestClient
from sqlalchemy.exc import SQLAlchemyError

from app.db.database import get_db
from app.main import app

client = TestClient(app)


# A fake database session that always fails, used to test the error case.
class BrokenSession:
    def execute(self, statement):
        raise SQLAlchemyError("Database is down")


def get_broken_db():
    yield BrokenSession()


def test_health_returns_ok_when_database_is_connected():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}


def test_health_returns_503_when_database_is_down():
    app.dependency_overrides[get_db] = get_broken_db
    try:
        response = client.get("/health")
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 503
    assert response.json() == {"detail": "Database connection failed"}


def test_root_opens_the_api_documentation():
    response = client.get("/", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/docs"


def test_frontend_origin_is_allowed():
    response = client.get("/health", headers={"Origin": "http://localhost:5173"})
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_unknown_origin_is_not_allowed():
    response = client.get("/health", headers={"Origin": "http://example.com"})
    assert "access-control-allow-origin" not in response.headers
