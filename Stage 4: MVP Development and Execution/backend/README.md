# MAMAR Backend

FastAPI backend for MAMAR. It connects to a PostgreSQL database through SQLAlchemy, as planned in Stage 3.

This folder covers the Sprint 1 backend tasks:

- Set up FastAPI backend and PostgreSQL database.
- Begin frontend and backend API integration.

The six database models follow the approved Stage 3 ER diagram. The 12 API endpoints described in Stage 3 are added in the next sprints.

## Folder Structure

```text
backend/
  app/
    core/
      config.py            # Reads the settings from the .env file
    db/
      database.py          # Database engine, sessions and the Base class for the models
      init_db.py           # Creates the tables when the server starts
    models/
      user.py              # users table
      provider.py          # providers table
      project.py           # projects table
      service_request.py   # service_requests table
      quote.py             # quotes table
      assignment.py        # assignments table
    routers/
      health.py            # GET /health
    main.py                # Creates the FastAPI app, allows the frontend (CORS) and adds the routers
  tests/
    test_health.py         # Health check and CORS tests
    test_models.py         # Checks the tables against the Stage 3 database schema
  .env.example             # Example settings, without real passwords
  .gitignore
  README.md
  requirements.txt
```

Every folder inside `app` and `tests` also has an `__init__.py` file, so Python treats it as a package.

## Database Models

Each class from the Stage 3 class design is a SQLAlchemy model with its own table in PostgreSQL. The columns, types and rules are the same as the Stage 3 database schema.

| Model | Table | Rules from Stage 3 |
| --- | --- | --- |
| `User` | `users` | `email` is unique. `role` is one of `contractor`, `provider`, `worker`, `admin` |
| `Provider` | `providers` | `is_verified` is false by default |
| `Project` | `projects` | `project_status` is one of `draft`, `active`, `completed`, `cancelled` |
| `ServiceRequest` | `service_requests` | `status` is one of `open`, `awarded`, `closed` |
| `Quote` | `quotes` | `status` is one of `pending`, `accepted`, `rejected`. One quote per provider per request |
| `Assignment` | `assignments` | `status` is one of `active`, `completed`, `cancelled`. A worker is assigned to a project only once |

The tables are created automatically when the server starts. Tables that already exist are not changed. The class methods from Stage 3, such as `set_password()` and `award()`, are added with their endpoints in the next sprints.

## Requirements

- Python 3.11 or newer
- PostgreSQL

## Run Locally (Windows PowerShell)

1. Create a database named `mamar` in PostgreSQL, for example from pgAdmin or with psql:

   ```powershell
   psql -U postgres -c "CREATE DATABASE mamar;"
   ```

2. Open the `backend` folder in the terminal, then create a virtual environment and install the libraries:

   ```powershell
   python -m venv venv
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

   `Set-ExecutionPolicy` only allows the activation script to run in the current terminal window.

3. Copy `.env.example` to `.env`, then put your PostgreSQL password in `DATABASE_URL`:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Start the server. PostgreSQL must be running first, because the tables are created when the server starts:

   ```powershell
   uvicorn app.main:app --reload
   ```

5. Check that everything works:

   - `http://127.0.0.1:8000/health` returns `{"status": "ok", "database": "connected"}`.
   - `http://127.0.0.1:8000/docs` opens the interactive API documentation.
   - `http://127.0.0.1:8000/` opens the same documentation page.
   - In pgAdmin, the `mamar` database has the six tables: `users`, `providers`, `projects`, `service_requests`, `quotes` and `assignments`.

On macOS, activate the environment with `source venv/bin/activate` and copy the settings with `cp .env.example .env`.

## Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:your_password@localhost:5432/mamar` |
| `FRONTEND_ORIGINS` | Frontend addresses allowed to call the API, separated by commas | `http://localhost:5173,http://127.0.0.1:5173` |

The `.env` file is ignored by Git, so passwords are never committed.

## Health Check

`GET /health` is a setup endpoint. It is not one of the 12 MVP endpoints in Stage 3, and it does not need a token. It checks that the API is running and can reach PostgreSQL.

| Case | Status code | Response |
| --- | --- | --- |
| Database connected | 200 | `{"status": "ok", "database": "connected"}` |
| Database not reachable | 503 | `{"detail": "Database connection failed"}` |

The error follows the Stage 3 error format `{"detail": "message"}`.

## Frontend Integration

The React frontend runs on Vite at `http://localhost:5173`, which is allowed in `FRONTEND_ORIGINS`. CORS allows the methods used by the API (`GET`, `POST` and `PATCH`) and the `Authorization` and `Content-Type` headers, so the frontend can send JSON and the token in the next sprints. After the frontend is deployed on Vercel, its address is added to `FRONTEND_ORIGINS` on Render, separated by a comma.

The frontend can test the connection with:

```javascript
fetch("http://127.0.0.1:8000/health")
  .then((response) => response.json())
  .then((data) => console.log(data));
```

### Integration Notes

| Item | Value |
| --- | --- |
| Backend base URL (local) | `http://127.0.0.1:8000` |
| Backend base URL (Render) | `https://mamar-api.onrender.com` |
| Test endpoint | `GET /health` |
| Success response | `{"status": "ok", "database": "connected"}` |
| Error response | `{"detail": "message"}`, so the frontend can show `detail` to the user |
| Allowed frontend origins | `http://localhost:5173` and `http://127.0.0.1:5173` |

Required adjustment: the login and register pages send the role `field-worker`, but the `users` table and the Stage 3 API accept `worker`. The frontend should send `worker`. The button can still say "Field Worker".

## Run the Tests

PostgreSQL must be running and `.env` must be filled in.

```powershell
pytest
```

| Test | What it checks |
| --- | --- |
| `test_health_returns_ok_when_database_is_connected` | The API reaches PostgreSQL and returns 200 |
| `test_health_returns_503_when_database_is_down` | A database error returns 503 with `{"detail": "..."}` |
| `test_root_opens_the_api_documentation` | Opening the server address goes to `/docs` |
| `test_frontend_origin_is_allowed` | The React frontend on port 5173 is allowed by CORS |
| `test_unknown_origin_is_not_allowed` | Other websites are not allowed |
| `test_tables_and_columns_match_the_er_diagram` | The six tables have the same columns as the Stage 3 database schema |
| `test_foreign_keys_match_the_relationships` | The foreign keys match the Stage 3 relationships table |
| `test_unique_rules` | `email`, one quote per provider per request, and one assignment per worker per project are unique |

## Deploy on Render

The backend is deployed at `https://mamar-api.onrender.com` (free instance). It sleeps after 15 minutes without requests, so the first request after that takes about a minute.

| Setting | Value |
| --- | --- |
| Language | Python 3 |
| Root Directory | Empty. Render only accepts letters, numbers, `-`, `_`, `.` and `/` in this field, so the commands below enter the folder instead |
| Build Command | `cd "Stage 4: MVP Development and Execution/backend" && pip install -r requirements.txt` |
| Start Command | `cd "Stage 4: MVP Development and Execution/backend" && uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| `DATABASE_URL` | Added with **Add variable > Datastore URL**, linked to the Render PostgreSQL database (internal URL), so the password is never typed by hand |
| `FRONTEND_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173`. The Vercel address is added after the frontend is deployed |

The free Render PostgreSQL database expires 30 days after it is created.
