from fastapi.testclient import TestClient
from sqlalchemy import inspect

from app.db.database import engine
from app.main import app

# The six tables and their columns, in the same order as the Stage 3 database schema.
EXPECTED_COLUMNS = {
    "users": [
        "user_id", "full_name", "email", "password_hash", "phone",
        "role", "provider_id", "is_active", "created_at",
    ],
    "providers": [
        "provider_id", "company_name", "service_type", "city",
        "phone", "website", "is_verified", "created_at",
    ],
    "projects": [
        "project_id", "contractor_id", "project_name", "project_status",
        "closure_type", "start_date", "end_date", "description", "created_at",
    ],
    "service_requests": [
        "request_id", "project_id", "title", "details",
        "required_by", "status", "created_at",
    ],
    "quotes": [
        "quote_id", "request_id", "provider_id", "price",
        "duration_days", "notes", "status", "created_at",
    ],
    "assignments": [
        "assignment_id", "project_id", "provider_id", "worker_id",
        "assigned_at", "status",
    ],
}

# The relationships table in Stage 3: (child table, column) -> parent table.
EXPECTED_FOREIGN_KEYS = {
    ("users", "provider_id"): "providers",
    ("projects", "contractor_id"): "users",
    ("service_requests", "project_id"): "projects",
    ("quotes", "request_id"): "service_requests",
    ("quotes", "provider_id"): "providers",
    ("assignments", "project_id"): "projects",
    ("assignments", "provider_id"): "providers",
    ("assignments", "worker_id"): "users",
}


def start_app_and_inspect_database():
    # Starting the app creates the tables. Then we read them back from PostgreSQL.
    with TestClient(app):
        pass
    return inspect(engine)


def test_tables_and_columns_match_the_er_diagram():
    inspector = start_app_and_inspect_database()
    for table, columns in EXPECTED_COLUMNS.items():
        assert [column["name"] for column in inspector.get_columns(table)] == columns


def test_foreign_keys_match_the_relationships():
    inspector = start_app_and_inspect_database()
    found = {}
    for table in EXPECTED_COLUMNS:
        for foreign_key in inspector.get_foreign_keys(table):
            found[(table, foreign_key["constrained_columns"][0])] = foreign_key["referred_table"]
    assert found == EXPECTED_FOREIGN_KEYS


def test_unique_rules():
    inspector = start_app_and_inspect_database()
    unique = {
        table: [constraint["column_names"] for constraint in inspector.get_unique_constraints(table)]
        for table in ("users", "quotes", "assignments")
    }
    assert ["email"] in unique["users"]
    assert ["request_id", "provider_id"] in unique["quotes"]
    assert ["project_id", "worker_id"] in unique["assignments"]
