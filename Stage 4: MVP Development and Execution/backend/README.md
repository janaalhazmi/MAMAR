# MAMAR Backend

FastAPI backend for MAMAR. It connects to a PostgreSQL database through SQLAlchemy, as planned in Stage 3.

This folder covers the Sprint 1 backend tasks:

- Set up FastAPI backend and PostgreSQL database.
- Begin frontend and backend API integration.

The database models and the 12 API endpoints described in Stage 3 are added in the next sprints.

## Folder Structure

```text
backend/
  app/
    core/
      config.py       # Reads the settings from the .env file
    db/
      database.py     # Database engine, sessions and the Base class for the models
    routers/
      health.py       # GET /health
    main.py           # Creates the FastAPI app, allows the frontend (CORS) and adds the routers
  tests/
    test_health.py    # pytest tests
  .env.example        # Example settings, without real passwords
  .gitignore
  README.md
  requirements.txt
```

Every folder inside `app` and `tests` also has an `__init__.py` file, so Python treats it as a package.

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

4. Start the server:

   ```powershell
   uvicorn app.main:app --reload
   ```

5. Check that everything works:

   - `http://127.0.0.1:8000/health` returns `{"status": "ok", "database": "connected"}`.
   - `http://127.0.0.1:8000/docs` opens the interactive API documentation.

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

## Run the Tests

PostgreSQL must be running and `.env` must be filled in.

```powershell
pytest
```

| Test | What it checks |
| --- | --- |
| `test_health_returns_ok_when_database_is_connected` | The API reaches PostgreSQL and returns 200 |
| `test_health_returns_503_when_database_is_down` | A database error returns 503 with `{"detail": "..."}` |
| `test_frontend_origin_is_allowed` | The React frontend on port 5173 is allowed by CORS |
| `test_unknown_origin_is_not_allowed` | Other websites are not allowed |

## Deploy on Render

| Setting | Value |
| --- | --- |
| Root Directory | `Stage 4: MVP Development and Execution/backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Environment Variables | `DATABASE_URL` with the Internal Database URL of the Render PostgreSQL database (it must start with `postgresql://`), and `FRONTEND_ORIGINS` with the Vercel address |
