from fastapi.testclient import TestClient
from sqlalchemy import inspect

from app.db.database import engine
from app.main import app

# The tables and their columns: the Stage 3 database schema, then the columns added for the
# frontend workflow (services, site execution, quote start date, invited providers) and the site_photos table.
EXPECTED_COLUMNS = {
    "users": [
        "user_id", "full_name", "email", "password_hash", "phone",
        "role", "provider_id", "is_active", "created_at",
        "avatar_token", "avatar_content_type", "avatar_data",
    ],
    "providers": [
        "provider_id", "company_name", "service_type", "city",
        "phone", "website", "is_verified", "created_at", "email_domain",
    ],
    "projects": [
        "project_id", "contractor_id", "project_name", "project_status",
        "closure_type", "start_date", "end_date", "description", "created_at",
        "services", "site_status", "last_check_in", "completion_submitted", "submitted_at", "change_note",
        "location", "latitude", "longitude", "work_zone",
    ],
    "service_requests": [
        "request_id", "project_id", "title", "details",
        "required_by", "status", "created_at", "provider_ids", "declined_provider_ids",
    ],
    "quotes": [
        "quote_id", "request_id", "provider_id", "price",
        "duration_days", "notes", "status", "created_at", "start_date", "services",
    ],
    "assignments": [
        "assignment_id", "project_id", "provider_id", "worker_id",
        "assigned_at", "status",
    ],
    "site_photos": [
        "photo_id", "token", "project_id", "worker_id", "caption",
        "content_type", "data", "created_at",
    ],
    "payments": [
        "payment_id", "project_id", "quote_id", "contractor_id", "amount", "currency",
        "charged_amount", "charged_currency", "paypal_order_id", "paypal_capture_id",
        "status", "created_at", "paid_at",
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
    ("site_photos", "project_id"): "projects",
    ("site_photos", "worker_id"): "users",
    ("payments", "project_id"): "projects",
    ("payments", "quote_id"): "quotes",
    ("payments", "contractor_id"): "users",
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
