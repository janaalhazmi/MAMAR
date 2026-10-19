# MAMAR Backend

FastAPI backend for MAMAR. It connects to a PostgreSQL database through SQLAlchemy, as planned in Stage 3.

This folder covers the Sprint 1 backend tasks:

- Set up FastAPI backend and PostgreSQL database.
- Begin frontend and backend API integration.

The six database models follow the approved Stage 3 ER diagram. The two `auth` endpoints from Stage 3, `POST /auth/register` and `POST /auth/login`, are ready, with the token check that the other endpoints will use. The other 10 endpoints are added in the next sprints.

## Folder Structure

```text
backend/
  app/
    core/
      config.py            # Reads the settings from the .env file
      security.py          # Login tokens (JWT) and the token check for protected endpoints
    db/
      database.py          # Database engine, sessions and the Base class for the models
      init_db.py           # Creates the tables and adds the demo providers when the server starts
    models/
      user.py              # users table
      provider.py          # providers table
      project.py           # projects table
      service_request.py   # service_requests table
      quote.py             # quotes table
      assignment.py        # assignments table
    routers/
      auth.py              # POST /auth/register and POST /auth/login
      health.py            # GET /health
    schemas/
      auth.py              # Request and response formats of the auth endpoints
      error.py             # The error format {"detail": "message"}
    main.py                # Creates the FastAPI app, allows the frontend (CORS) and adds the routers
  tests/
    test_auth.py           # Register, login and token tests
    test_demo_providers.py # Demo providers tests
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

The tables are created automatically when the server starts. Tables that already exist are not changed.

### Demo Providers

Stage 3 says the provider records are prepared in advance, so a user cannot link themselves to any company. When the server starts, it adds these four providers to the `providers` table if they are missing. They are the same companies and `provider_id` values as the `MAMAR_Providers` layer in ArcGIS Online, so the map and the database match.

| `provider_id` | `company_name` | `service_type` |
| --- | --- | --- |
| 1 | Traffic and Construction Management TCM | Traffic Management |
| 2 | Safety Arabia Co. LTD | Traffic Devices |
| 3 | Shawahid Roads Industrial Co. | Road Safety |
| 4 | Safety Triangle Company | Road Safety |

A provider that already exists is not changed. New providers start from `provider_id` 5.

The `User` methods from Stage 3 are ready: `set_password()` hashes the password with Argon2 and saves only the hash, `check_password()` compares a password with the saved hash, and `to_dict()` returns the user without the password hash. The methods of the other classes, such as `award()`, are added with their endpoints in the next sprints.

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

3. Copy `.env.example` to `.env`, then put your PostgreSQL password in `DATABASE_URL`. For `SECRET_KEY`, put the long random value that the second command prints:

   ```powershell
   Copy-Item .env.example .env
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

4. Start the server. PostgreSQL must be running first, because the tables are created when the server starts:

   ```powershell
   uvicorn app.main:app --reload
   ```

5. Check that everything works:

   - `http://127.0.0.1:8000/health` returns `{"status": "ok", "database": "connected"}`.
   - `http://127.0.0.1:8000/docs` opens the interactive API documentation.
   - `http://127.0.0.1:8000/` opens the same documentation page.
   - In `/docs`, open `POST /auth/register` and click **Try it out**, then **Execute**. It creates an account with the Stage 3 example and returns 201. Executing it again returns 409, because the email is already registered. Then `POST /auth/login` with the same email and password returns the token.
   - In pgAdmin, the `mamar` database has the six tables: `users`, `providers`, `projects`, `service_requests`, `quotes` and `assignments`, and the `providers` table has the four demo providers.

On macOS, activate the environment with `source venv/bin/activate` and copy the settings with `cp .env.example .env`.

## Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:your_password@localhost:5432/mamar` |
| `SECRET_KEY` | Long random value that signs the login tokens (JWT). Every computer and Render has its own | Output of `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `FRONTEND_ORIGINS` | Frontend addresses allowed to call the API, separated by commas | `http://localhost:5173,http://127.0.0.1:5173` |

The `.env` file is ignored by Git, so passwords are never committed.

## Health Check

`GET /health` is a setup endpoint. It is not one of the 12 MVP endpoints in Stage 3, and it does not need a token. It checks that the API is running and can reach PostgreSQL.

| Case | Status code | Response |
| --- | --- | --- |
| Database connected | 200 | `{"status": "ok", "database": "connected"}` |
| Database not reachable | 503 | `{"detail": "Database connection failed"}` |

The error follows the Stage 3 error format `{"detail": "message"}`.

## Auth Endpoints

The two `auth` endpoints follow Stage 3 (sections 4.2.3 and 4.2.4). They are the only endpoints that do not need a token.

### Register

`POST /auth/register` creates a new user account.

Request body. `phone` is optional, and `provider_id` is required only when `role` is `provider` or `worker`:

```json
{
  "full_name": "Sara Ahmed",
  "email": "sara@example.com",
  "password": "StrongPass123",
  "phone": "0500000000",
  "role": "contractor",
  "provider_id": null
}
```

| Case | Status code | Response |
| --- | --- | --- |
| Account created | 201 | The new user as JSON, with the same fields as the Stage 3 example. The password is never returned |
| `provider_id` does not exist | 404 | `{"detail": "Provider not found"}` |
| Email already registered | 409 | `{"detail": "Email is already registered"}` |
| A field is missing or not valid | 422 | `{"detail": "full_name: Field required"}` |

The request is checked before anything is saved:

| Rule | Source |
| --- | --- |
| `full_name` has up to 100 characters, `email` up to 255 and `phone` up to 20 | Column sizes of the `users` table |
| `role` is `contractor`, `provider`, `worker` or `admin` | `users` table |
| `provider_id` is required for `provider` and `worker`, and `null` for `contractor` and `admin` | Register endpoint and `users` table |
| The email is saved in lowercase without spaces, so `Sara@Example.com` and `sara@example.com` are the same account | The register page does the same |
| The password has at least 6 characters | The register page asks for the same |

The password is hashed with Argon2 by `set_password()`, so the real password is never stored. Every error, including 422, follows the Stage 3 format `{"detail": "message"}`. FastAPI sends 422 errors as a list by default, so `main.py` joins them in one message that the frontend can show directly.

### Login

`POST /auth/login` checks the email and password. The email can be written in capital letters, the same as in register.

```json
{
  "email": "sara@example.com",
  "password": "StrongPass123"
}
```

| Case | Status code | Response |
| --- | --- | --- |
| Correct email and password | 200 | `{"access_token": "<token>", "token_type": "bearer", "user": {"user_id": 7, "full_name": "Sara Ahmed", "role": "contractor", "provider_id": null}}` |
| Wrong email or password | 401 | `{"detail": "Email or password is wrong"}`. The message is the same for both, so the API does not tell which one is wrong |
| A field is missing | 422 | `{"detail": "password: Field required"}` |

The token is a JWT signed with `SECRET_KEY`. It keeps the user id and role, and it expires after 60 minutes, so the user signs in again after that.

### Token for the Other Endpoints

The other 10 endpoints in Stage 3 need the header `Authorization: Bearer <token>`. They will use `get_current_user()` from `app/core/security.py`, which returns the signed-in user:

| Case | Status code | Response |
| --- | --- | --- |
| No token | 401 | `{"detail": "Token is missing"}` |
| Wrong, expired or changed token | 401 | `{"detail": "Token is not valid"}` |

## Frontend Integration

The React frontend runs on Vite at `http://localhost:5173`, which is allowed in `FRONTEND_ORIGINS`. CORS allows the methods used by the API (`GET`, `POST` and `PATCH`) and the `Authorization` and `Content-Type` headers, so the frontend can send JSON and the token in the next sprints. The deployed frontend, `https://mammar-blush.vercel.app`, is also allowed in `FRONTEND_ORIGINS` on Render.

The frontend can test the connection with:

```javascript
fetch("http://127.0.0.1:8000/health")
  .then((response) => response.json())
  .then((data) => console.log(data));
```

The register page can create an account like this. `API_BASE_URL` is the same constant as in `src/services/api.js`:

```javascript
export async function registerUser(user) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail);
  }
  return data;
}
```

The login page works the same way with `POST /auth/login`. It keeps `access_token` and sends it with the next requests:

```javascript
headers: { Authorization: `Bearer ${accessToken}` }
```

### Integration Notes

| Item | Value |
| --- | --- |
| Backend base URL (local) | `http://127.0.0.1:8000` |
| Backend base URL (Render) | `https://mamar-api.onrender.com` |
| Test endpoint | `GET /health` |
| Register endpoint | `POST /auth/register` |
| Login endpoint | `POST /auth/login` |
| Token header for the other endpoints | `Authorization: Bearer <token>` |
| Success response | `{"status": "ok", "database": "connected"}` |
| Error response | `{"detail": "message"}`, so the frontend can show `detail` to the user |
| Allowed frontend origins | `http://localhost:5173` and `http://127.0.0.1:5173`, and `https://mammar-blush.vercel.app` on Render |
| Provider IDs for testing | 1 to 4, see [Demo Providers](#demo-providers) |

To connect the register page to `POST /auth/register`:

- Send the role `worker` instead of `field-worker`, because the `users` table and the Stage 3 API accept `worker`. The button can still say "Field Worker". The login page should use `worker` too.
- Add a full name field. `full_name` is required in Stage 3, and the page now asks only for the email, the password and the role.
- `provider` and `worker` accounts need a `provider_id`. Use one of the demo providers, 1 to 4. Another number returns 404 `Provider not found`.

## Run the Tests

PostgreSQL must be running and `.env` must be filled in. The register tests create their own test accounts and delete them at the end, so the database stays clean.

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
| `test_demo_providers_are_added_when_the_server_starts` | The four demo providers exist with the same data as the `MAMAR_Providers` layer |
| `test_adding_them_again_does_not_change_existing_providers` | Starting the server again does not overwrite a provider that already exists |
| `test_a_new_provider_does_not_reuse_a_demo_provider_id` | A new provider gets a `provider_id` after the demo providers |
| `test_register_a_provider_account_with_a_demo_provider` | A `provider` account with `provider_id` 1 is registered and can log in |
| `test_register_creates_the_user` | A new account returns 201 with the same fields as Stage 3, without the password |
| `test_register_saves_only_the_password_hash` | Only the Argon2 hash is saved, and `check_password()` accepts the right password only |
| `test_register_with_an_existing_email_returns_409` | The same email cannot register twice, even in capital letters |
| `test_register_with_a_missing_field_returns_422` | A missing field returns 422 with `{"detail": "message"}` |
| `test_register_with_an_invalid_body_returns_422` | A wrong role, a wrong email, a short password and the two `provider_id` rules return 422 (5 cases) |
| `test_register_with_an_unknown_provider_returns_404` | A `provider_id` that does not exist returns 404 |
| `test_register_a_worker_of_an_existing_provider` | A worker of an existing provider is registered |
| `test_frontend_can_send_the_register_request` | The browser can send JSON from the React frontend to the register endpoint (CORS) |
| `test_login_returns_a_token_and_the_user` | Login returns 200 with the token and the user, like Stage 3, and the token keeps the user id and role |
| `test_login_with_a_wrong_password_returns_401` | A wrong password returns 401 |
| `test_login_with_an_unknown_email_returns_401` | An email that is not registered returns the same 401 |
| `test_protected_endpoint_accepts_the_login_token` | The login token opens an endpoint that needs a token |
| `test_protected_endpoint_without_a_valid_token_returns_401` | No token, a wrong token, an expired token and a token signed with another key all return 401 |

## Deploy on Render

The backend is deployed at `https://mamar-api.onrender.com` (free instance). It sleeps after 15 minutes without requests, so the first request after that takes about a minute.

| Setting | Value |
| --- | --- |
| Language | Python 3 |
| Root Directory | Empty. Render only accepts letters, numbers, `-`, `_`, `.` and `/` in this field, so the commands below enter the folder instead |
| Build Command | `cd "Stage 4 MVP Development and Execution/backend" && pip install -r requirements.txt` |
| Start Command | `cd "Stage 4 MVP Development and Execution/backend" && uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| `DATABASE_URL` | Added with **Add variable > Datastore URL**, linked to the Render PostgreSQL database (internal URL), so the password is never typed by hand |
| `SECRET_KEY` | Added with the **Generate** button on Render, so the value is random and never typed by hand |
| `FRONTEND_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173,https://mammar-blush.vercel.app` |

The free Render PostgreSQL database expires 30 days after it is created.
