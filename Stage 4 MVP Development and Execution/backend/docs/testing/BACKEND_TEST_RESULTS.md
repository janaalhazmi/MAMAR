# Backend Testing Results: Pytest

**Related task:** #72 (Backend Unit & Integration Testing Using Pytest)
**Date:** 20 November 2026
**Application commit:** develop `6976f8f` + fixes for #79 and #80
**Tools:** Python 3.13, pytest 9.1.1, pytest-cov 7.1.0, FastAPI TestClient, PostgreSQL 16

## Summary

| Type | What it tests | Tests | Passed | Failed | Skipped | Time |
|---|---|---:|---:|---:|---:|---:|
| Unit | One function at a time, no database, no network | 15 | 15 | 0 | 0 | 0.09 s |
| Integration | Full API requests through FastAPI TestClient, role checks and a real PostgreSQL test database | 240 | 240 | 0 | 0 | 120 s |
| **Total** | | **255** | **255** | **0** | **0** | |

Statement coverage of `app/` from the integration run: **93%** (3,399 statements, 249 missed).

The tests never touch the deployed database: locally they use a separate test database, and on GitHub
Actions a temporary PostgreSQL service that is deleted after each run.

## How to run

From the `backend/` folder:

```bash
python -m pytest -m unit -v                  # unit tests only (no database needed)
python -m pytest -m integration -v           # integration tests (needs DATABASE_URL to a test database)
python -m pytest -m integration --cov=app    # with coverage
```

`tests/test_unit.py` is marked `unit`; `tests/conftest.py` marks every other test `integration`.
GitHub Actions (`.github/workflows/backend-tests.yml`) runs both on every pull request that changes the backend.

## Integration tests by file

| File | Tests | Covers |
|---|---:|---|
| test_projects.py | 42 | Project creation, updates, work zone, status transitions |
| test_auth.py | 25 | Register, login, tokens, role-based access |
| test_workflow.py | 23 | Request → quote → award → assignment → execution → completion |
| test_service_requests.py | 20 | Service request creation, invited providers, retrieval |
| test_email_verification.py | 20 | Registration passcode by email |
| test_provider.py | 17 | Provider dashboard, projects, field team |
| test_quotes.py | 12 | Quotation submission, acceptance, rejection |
| test_ai.py | 10 | Photo safety check, traffic plan, quote comparison, daily summary (AI mocked) |
| test_extras.py | 9 | Weather location, traffic, receipts, reviews |
| test_milestones.py | 8 | Project milestones: created once, updated by the provider, invalid status and other users rejected |
| test_security.py | 7 | Access by the wrong user or role |
| test_health.py | 7 | `/health` (GET and HEAD), database check |
| test_attendance.py | 7 | Site code, QR/GPS check-in and check-out |
| test_session.py | 6 | Session and token expiry |
| test_payments.py | 6 | PayPal sandbox orders and capture (mocked) |
| test_assignments.py | 5 | Assigning field workers |
| test_demo_providers.py | 4 | Demo provider accounts |
| test_admin.py | 4 | Admin account and pages |
| test_profile.py | 3 | Profile and avatar |
| test_models.py | 3 | Tables, columns and foreign keys match the ER diagram |
| test_devices.py | 2 | Device codes, saved GPS verification, who can see devices |

## Unit tests (tests/test_unit.py)

Distance between two points, traffic level (Light, Moderate, Heavy, Closed, Unknown), taper length
formula, weather code to text, weather alerts, site code, point inside the work zone, device code cleaning.

## Defects

| Issue | Found in | Status |
|---|---|---|
| #79 Field worker site photos are not displayed after upload | UAT (#78) | Fixed: a chosen photo is sent right away, with a clear saved / not saved message and Try again |
| #80 Service provider shows "Not assigned" in Completion Review | UAT (#78) | Fixed: the provider name comes from the completion API, not from the browser |

No backend test failed or was skipped.

Found while merging: `app/schemas/workflow.py` used `MilestoneResponse` before defining it, so the backend could not start on
Python 3.13 (every CI test stopped at import). Render runs Python 3.14, whose lazy type annotations hid the error, so production kept working. Fixed by importing the one definition from `app/schemas/milestone.py`.

## Evidence (this folder: `evidence/`)

- `pytest-unit.xml`, `pytest-integration.xml`: JUnit reports
- `pytest-unit-output.txt`, `pytest-integration-output.txt`: full console output with coverage
- `pytest-unit.png`, `pytest-integration.png`: screenshots of the runs
- GitHub Actions runs: https://github.com/janaalhazmi/MAMAR/actions/workflows/backend-tests.yml
