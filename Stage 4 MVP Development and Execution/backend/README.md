# MAMAR Backend

FastAPI backend for MAMAR. It connects to a PostgreSQL database through SQLAlchemy, as planned in Stage 3.

This folder covers the Sprint 1 backend tasks:

- Set up FastAPI backend and PostgreSQL database.
- Begin frontend and backend API integration.

And the backend part of the Sprint 2 tasks:

- Finalize Authentication API and Database Integration.
- Implement Logout and Session Management, see [Session and Logout](#session-and-logout).

The six database models follow the approved Stage 3 ER diagram. The two `auth` endpoints from Stage 3, `POST /auth/register` and `POST /auth/login`, are ready, with the token check that the other endpoints use. The three [projects endpoints](#projects-endpoints), `GET`, `POST` and `PATCH /projects`, are ready too (Sprint 1, T09). The other 7 endpoints of the provider workflow are ready too, see [Requests, Quotes and Assignments](#requests-quotes-and-assignments), so all 12 MVP endpoints of Stage 3 are implemented. [Email verification](#email-verification) with a 6-digit passcode is ready too, and it stays off until the frontend sends the passcode. `GET /auth/me` checks a saved login token, see [Session and Logout](#session-and-logout).

## Folder Structure

```text
backend/
  app/
    core/
      access.py            # Who can see or change a project (contractor, provider, field worker)
      arcgis.py            # Reads the planned device points from ArcGIS and measures distances
      config.py            # Reads the settings from the .env file
      email.py             # Sends the registration passcode with EmailJS
      security.py          # Login tokens (JWT) and the token check for protected endpoints
    db/
      database.py          # Database engine, sessions and the Base class for the models
      init_db.py           # Creates the tables, adds the new columns and the demo providers when the server starts
    models/
      user.py              # users table
      provider.py          # providers table
      project.py           # projects table
      service_request.py   # service_requests table
      quote.py             # quotes table
      assignment.py        # assignments table
      email_passcode.py    # email_passcodes table (email verification, extra to Stage 3)
      site_photo.py        # site_photos table (field worker photos, extra to Stage 3)
    routers/
      auth.py              # POST /auth/send-passcode, /auth/register and /auth/login
      health.py            # GET /health
      projects.py          # GET /projects, POST /projects and PATCH /projects/{id}
      service_requests.py  # POST /projects/{id}/requests, GET /requests and POST /requests/{id}/award
      quotes.py            # POST and GET /requests/{id}/quotes
      assignments.py       # POST /projects/{id}/assignments and GET /assignments
      workflow.py          # Quotations, confirm provider, monitoring and completion (contractor pages)
      field_work.py        # Field worker projects, status, check-in and photos, and GET /photos/{token}
      devices.py           # POST /devices/{device}/verify
      provider.py          # GET /provider/requests, /provider/projects, /provider/projects/{id}, /provider/workers and /provider/dashboard
    schemas/
      auth.py              # Request and response formats of the auth endpoints
      error.py             # The error format {"detail": "message"}
      project.py           # Request and response formats of the projects endpoints
      service_request.py   # Request and response formats of the requests endpoints
      quote.py             # Request and response formats of the quotes endpoints
      assignment.py        # Request and response formats of the assignments endpoints
      workflow.py          # Request and response formats of the workflow, field work and devices endpoints
      provider_view.py     # Response formats of the provider pages
    main.py                # Creates the FastAPI app, allows the frontend (CORS) and adds the routers
  tests/
    conftest.py            # The api fixture: accounts, projects, requests and quotes for the provider workflow tests
    test_assignments.py    # Assignments endpoints tests
    test_quotes.py         # Quotes endpoints tests
    test_service_requests.py # Requests endpoints tests
    test_auth.py           # Register, login and token tests
    test_demo_providers.py # Demo providers tests
    test_email_verification.py # Email verification tests
    test_health.py         # Health check and CORS tests
    test_models.py         # Checks the tables against the Stage 3 database schema
    test_projects.py       # Projects endpoints tests
    test_session.py        # GET /auth/me (session check) tests
    test_workflow.py       # Quotations, field work, photos, completion and device verification tests
    test_provider.py       # Provider requests, projects and dashboard tests
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
| `Project` | `projects` | `project_status` is one of `draft`, `active`, `completed`, `cancelled`. A new project starts as `draft` |
| `ServiceRequest` | `service_requests` | `status` is one of `open`, `awarded`, `closed` |
| `Quote` | `quotes` | `status` is one of `pending`, `accepted`, `rejected`. One quote per provider per request |
| `Assignment` | `assignments` | `status` is one of `active`, `completed`, `cancelled`. A worker is assigned to a project only once |

The tables are created automatically when the server starts. For the frontend workflow, some columns were added after Stage 3. `upgrade_tables()` in `init_db.py` adds them to a database that already exists (the one on Render) with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, so nothing is lost and it is safe on every start:

| Table | New columns |
| --- | --- |
| `projects` | `services` (the ids chosen on Select Service), `site_status`, `last_check_in`, `completion_submitted`, `submitted_at`, `change_note`, `location`, `latitude`, `longitude`, `work_zone` (the Location page, so the provider and the field team see the same place) |
| `quotes` | `start_date`, `services` (optional) |
| `service_requests` | `provider_ids` (optional): the providers the contractor invited. `null` means every provider |

A new table, `site_photos`, keeps the photos that field workers upload. They are saved in PostgreSQL because the free Render server deletes uploaded files on every deploy.

One more table, `email_passcodes`, keeps the passcodes sent to emails that are not registered yet. It is extra to the Stage 3 schema and does not change the six tables, see [Email Verification](#email-verification).

### Demo Providers

Stage 3 says the provider records are prepared in advance, so a user cannot link themselves to any company. When the server starts, it adds these four providers to the `providers` table if they are missing. They are the same companies and `provider_id` values as the `MAMAR_Providers` layer in ArcGIS Online, so the map and the database match.

| `provider_id` | `company_name` | `service_type` | Company email |
| --- | --- | --- | --- |
| 1 | Traffic and Construction Management TCM | Traffic Management | `@tcmksa.com` |
| 2 | Safety Arabia Co. LTD | Traffic Devices | `@redanational.com` |
| 3 | Shawahid Roads Industrial Co. | Road Safety | `@shawahidts.com` |
| 4 | Safety Triangle Company | Road Safety | `@safetytriangle.com.sa` |

A provider that already exists is not changed. New providers start from `provider_id` 5.

The company email is the domain of the provider's `website`, without `www.`. A `provider` or `worker` account of a company must register with that email, see [Register](#register).

The `User` methods from Stage 3 are ready: `set_password()` hashes the password with Argon2 and saves only the hash, `check_password()` compares a password with the saved hash, and `to_dict()` returns the user without the password hash. The `Project` methods are ready too: `update_status(status)` moves `project_status` between `draft`, `active`, `completed` and `cancelled`, and `to_dict()` returns the project as JSON. The methods of the other classes are ready too: `ServiceRequest.award(quote_id)` accepts the chosen quote, rejects the others and marks the request as `awarded`, `close()` closes an open request, `Quote.accept()` and `reject()` are only called from `award()`, and `Assignment.complete()` marks an active assignment as `completed`. Each one has `to_dict()`.

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

### Setup Issues

The problems we met while setting up the project, and how we solved them.

| Problem | Cause | Solution |
| --- | --- | --- |
| `git clone` or `git checkout` on Windows fails with `error: invalid path 'Stage 4: MVP Development and Execution/...'` | Windows does not allow `:` in folder names, and the Stage folders had `:` in their names | The Stage folders were renamed without `:`, for example `Stage 4 MVP Development and Execution`. Clone the repository again, or pull the latest changes |
| `fatal: Unable to create '.git/index.lock': File exists` | A git command stopped in the middle and left its lock file behind | Close the other terminals and editors that use git, then delete the lock file with `Remove-Item .git\index.lock` |
| The Render deploy fails with `Could not open requirements file` after the folders were renamed | The Render Build and Start commands still used the old folder name | The commands now use `cd "Stage 4 MVP Development and Execution/backend"`, see [Deploy on Render](#deploy-on-render) |
| The deployed site shows "Unable to connect to the server" on the login and register pages, while `https://mamar-api.onrender.com/health` works | `FRONTEND_ORIGINS` on Render had the Vercel share link `https://mammar-blush.vercel.app?_vercel_share=...` instead of the site address. The browser sends the origin `https://mammar-blush.vercel.app`, which did not match, so CORS blocked every request from the site | `FRONTEND_ORIGINS` on Render was set back to the site address. `config.py` now keeps only the site address (`scheme://host:port`) of each origin, so a copied link still works |

## Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:your_password@localhost:5432/mamar` |
| `SECRET_KEY` | Long random value that signs the login tokens (JWT). Every computer and Render has its own | Output of `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `FRONTEND_ORIGINS` | Frontend addresses allowed to call the API, separated by commas. Only the site address of each one is used, so a copied link with a path or `?...` still works | `http://localhost:5173,http://127.0.0.1:5173` |
| `EMAIL_VERIFICATION` | `on` or `off`. Optional, `off` by default | `off` |
| `EMAILJS_SERVICE_ID` | EmailJS Gmail service that sends the passcode emails. Optional: without the four EmailJS values, the passcode is written in the server log | Empty on a local computer |
| `EMAILJS_TEMPLATE_ID` | EmailJS template of the passcode email | `template_xxxxxxx` |
| `EMAILJS_PUBLIC_KEY` | EmailJS public key (Account > General) | Empty on a local computer |
| `EMAILJS_PRIVATE_KEY` | EmailJS private key (Account > Security). Secret, like a password | Empty on a local computer |

The `.env` file is ignored by Git, so passwords are never committed.

## Health Check

`GET /health` is a setup endpoint. It is not one of the 12 MVP endpoints in Stage 3, and it does not need a token. It checks that the API is running and can reach PostgreSQL.

| Case | Status code | Response |
| --- | --- | --- |
| Database connected | 200 | `{"status": "ok", "database": "connected"}` |
| Database not reachable | 503 | `{"detail": "Database connection failed"}` |

The error follows the Stage 3 error format `{"detail": "message"}`.

## Auth Endpoints

The two `auth` endpoints follow Stage 3 (sections 4.2.3 and 4.2.4). They do not need a token, and neither does `POST /auth/send-passcode`. `GET /auth/me` needs the token, see [Session and Logout](#session-and-logout).

### Register

`POST /auth/register` creates a new user account.

Request body. `phone` is optional, and `provider_id` is required only when `role` is `provider` or `worker`. `passcode` is required only when [email verification](#email-verification) is on:

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
| `role` is `admin` | 422 | `{"detail": "role: Input should be 'contractor', 'provider' or 'worker'"}` |
| A `provider` or `worker` email is not the company email | 422 | `{"detail": "email: use your company email (@tcmksa.com)"}` |
| The provider has no `website`, so it has no company email | 422 | `{"detail": "provider_id: this provider has no company website yet"}` |

The request is checked before anything is saved:

| Rule | Source |
| --- | --- |
| `full_name` has up to 100 characters, `email` up to 255 and `phone` up to 20 | Column sizes of the `users` table |
| `role` is `contractor`, `provider` or `worker`. `admin` is not accepted, because anyone could open this endpoint and make themselves an admin. The `users` table still allows `admin` for accounts the team adds | `users` table and Sprint 1 review |
| `provider_id` is required for `provider` and `worker`, and `null` for `contractor` | Register endpoint and `users` table |
| A `provider` or `worker` registers with the company email of its provider, for example `@tcmksa.com` for provider 1 | Stage 3: a user cannot link themselves freely to any provider |
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

### Email Verification

Email verification is an addition to the Stage 3 API. When `EMAIL_VERIFICATION` is `on`, an account is created only with the 6-digit passcode that was sent to its email. This follows the Create Account pages in the frontend (`RegisterVerificationPage` and `WorkerVerificationPage`): the user fills the register form, receives the passcode, enters it, and then the account is created.

1. The register form sends `POST /auth/send-passcode` with the email. The passcode is sent to that email.
2. The passcode page sends `POST /auth/register` with the register form and `"passcode": "042917"`.
3. With the right passcode, register returns 201 as before and the account can log in.

It is `off` on Render until the frontend sends the passcode. While it is off, `passcode` is not needed and register works as before. Turning it on is one change in the Render settings and needs no new deploy. Accounts that already exist are not affected.

| Rule | Value |
| --- | --- |
| Passcode | 6 random digits. Only its Argon2 hash is saved, like the passwords |
| Expires after | 10 minutes |
| Wrong passcodes | After 5 wrong passcodes, the passcode stops working and a new one is needed |
| New passcode | Once a minute, with `POST /auth/send-passcode` again. The old passcode stops working |
| Used once | The passcode is deleted when the account is created |

`POST /auth/send-passcode` with `{"email": "sara@example.com"}`:

| Case | Status code | Response |
| --- | --- | --- |
| Passcode sent | 200 | `{"message": "Passcode sent"}` |
| Email already registered | 409 | `{"detail": "Email is already registered"}` |
| The email is not valid | 422 | `{"detail": "email: value is not a valid email address"}` |
| Less than a minute since the last passcode | 429 | `{"detail": "Wait a minute before asking for a new passcode"}` |
| EmailJS could not send the email | 502 | `{"detail": "Could not send the email, try again later"}`. The user can try again right away |

`POST /auth/register` when verification is on, in addition to the register cases above:

| Case | Status code | Response |
| --- | --- | --- |
| No `passcode` | 422 | `{"detail": "passcode: Field required"}` |
| The passcode is not 6 digits | 422 | `{"detail": "passcode: the passcode has 6 digits"}` |
| No passcode was asked for this email | 400 | `{"detail": "Ask for a passcode first"}` |
| Wrong passcode | 400 | `{"detail": "Passcode is wrong"}` |
| Passcode expired | 400 | `{"detail": "Passcode has expired, ask for a new passcode"}` |
| 5 wrong passcodes | 429 | `{"detail": "Too many wrong passcodes, ask for a new passcode"}` |

The emails are sent from the team's Gmail account with the [EmailJS](https://www.emailjs.com) API over HTTPS, because the free Render plan blocks the SMTP ports, so Gmail SMTP cannot send from Render. The free EmailJS plan sends 200 emails a month. We first tried Brevo, but Brevo asks for a phone verification code before it creates an API key, and the code never arrived. On a local computer without the EmailJS values, the passcode is written in the server terminal instead, for example `The passcode for sara@example.com is 042917`.

To turn it on:

1. Create a free EmailJS account. In **Email Services**, add a **Gmail** service and connect the Gmail account that sends the passcodes.
2. In **Email Templates**, create a template with **To Email** `{{to_email}}`, **From Name** `MAMAR`, **Subject** `Your MAMAR passcode`, and this content:

   ```text
   Your MAMAR passcode is {{passcode}}.
   Enter it on the Create Account page. It expires in 10 minutes.
   If you did not ask for a MAMAR account, ignore this email.
   ```

3. In **Account > Security**, turn on **Allow EmailJS API for non-browser applications** and **Use Private Key**, because the backend calls EmailJS from the server.
4. On Render (Backend service > Environment), add `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY` and `EMAILJS_PRIVATE_KEY`, and `EMAIL_VERIFICATION` with `on`. Render restarts the backend.

When EmailJS refuses a request, the reason it gives is written in the server log, for example `EmailJS returned 403: API calls are disabled for non-browser applications`.

While verification is on, `provider` and `worker` accounts receive the passcode at their company email (for example `@tcmksa.com`), so test those accounts with verification off. The worker page says the passcode comes from the service provider. For now the worker receives it from MAMAR like the other roles. A passcode sent by the provider needs a provider screen and endpoint, which are not built yet.

### Token for the Other Endpoints

Every endpoint except `/health`, `POST /auth/register`, `POST /auth/login` and `POST /auth/send-passcode` needs the header `Authorization: Bearer <token>`. The [projects endpoints](#projects-endpoints) and the other 7 endpoints in Stage 3 use `get_current_user()` from `app/core/security.py`, which returns the signed-in user:

| Case | Status code | Response |
| --- | --- | --- |
| No token | 401 | `{"detail": "Token is missing"}` |
| Wrong, expired or changed token | 401 | `{"detail": "Token is not valid"}` |

### Session and Logout

`GET /auth/me` returns the signed-in user, with the same fields as the register response. It is an addition to the Stage 3 API for the Sprint 2 task "Implement Logout and Session Management". The frontend sends it with the saved token when a protected page opens, so a token is not trusted only because it is saved in the browser. A changed token, a token signed with another key, an expired token, or the token of a deactivated or deleted account returns 401.

```text
GET /auth/me
Authorization: Bearer <token>
```

| Case | Status code | Response |
| --- | --- | --- |
| Valid token | 200 | The user as JSON, for example `{"user_id": 7, "full_name": "Sara Ahmed", "email": "sara@example.com", "phone": null, "role": "contractor", "provider_id": null, "is_active": true, "created_at": "2026-10-23T10:00:00"}` |
| No token | 401 | `{"detail": "Token is missing"}` |
| Wrong, changed or expired token, or the account is deactivated or deleted | 401 | `{"detail": "Token is not valid"}` |

Logout happens in the frontend. The token is a JWT, so the server does not keep a list of sessions: logging out removes the saved token from the browser, and every token stops working by itself 60 minutes after login. When `GET /auth/me` or any other endpoint returns 401, the frontend removes the saved token and opens the login page.

## Projects Endpoints

The three `projects` endpoints follow Stage 3 (sections 4.2.5 to 4.2.7). Only a contractor can use them, with the login token in the header `Authorization: Bearer <token>`. A contractor sees and changes only their own projects.

| Endpoint | What it does |
| --- | --- |
| `GET /projects` | Lists the projects of the signed-in contractor, newest first. `?project_status=active` filters the list |
| `POST /projects` | Creates a project as `draft` and returns it with its new `project_id`. Optional: `services`, `location` (the address), `latitude`, `longitude` and `work_zone` (`[[longitude, latitude], ...]`, up to 500 points) |
| `PATCH /projects/{id}` | Changes only the fields that are sent, for example `{"project_status": "active"}` |

`POST /projects` body. `description` is optional, and so is `services`, a list of `ttc-plan`, `cones-barriers` and `road-signs` (the Select Service page). The response has `services` too:

```json
{
  "project_name": "King Fahd Road Maintenance",
  "closure_type": "lane_closure",
  "start_date": "2026-11-01",
  "end_date": "2026-12-15",
  "description": "Night work on the right lane"
}
```

`POST` returns 201 and `PATCH` returns 200 with the project. `GET` returns a list of the same objects:

```json
{
  "project_id": 12,
  "contractor_id": 7,
  "project_name": "King Fahd Road Maintenance",
  "project_status": "draft",
  "closure_type": "lane_closure",
  "start_date": "2026-11-01",
  "end_date": "2026-12-15",
  "description": "Night work on the right lane",
  "created_at": "2026-10-20T10:05:00"
}
```

| Case | Status code | Response |
| --- | --- | --- |
| No token | 401 | `{"detail": "Token is missing"}` |
| Wrong or expired token | 401 | `{"detail": "Token is not valid"}` |
| The user is a `provider` or `worker` | 403 | `{"detail": "Only contractors can use the projects endpoints"}` |
| `PATCH` on a project of another contractor | 403 | `{"detail": "This project belongs to another contractor"}` |
| `PATCH` on a project that does not exist | 404 | `{"detail": "Project not found"}` |
| `end_date` is before `start_date` | 422 | `{"detail": "end_date: cannot be before start_date"}` |
| A field is missing or not valid | 422 | `{"detail": "project_name: Field required"}` |
| `project_status` is not one of the four statuses | 422 | `{"detail": "project_status: Input should be 'draft', 'active', 'completed' or 'cancelled'"}` |
| `PATCH` with none of the six fields | 422 | `{"detail": "Send at least one of: project_name, project_status, closure_type, start_date, end_date, description, services"}` |

| Rule | Source |
| --- | --- |
| `project_name` has up to 150 characters and `closure_type` up to 50 | Column sizes of the `projects` table |
| A new project is `draft`. `contractor_id` is the signed-in contractor, so it cannot be sent | Stage 3, section 4.2.6 |
| `project_status` is `draft`, `active`, `completed` or `cancelled`, and only `PATCH` changes it, with `update_status()` | Stage 3, sections 2.2.3 and 4.2.7 |
| `end_date` is the same day as `start_date` or later. `PATCH` checks the new date with the saved one, also when only one date is sent | Stage 3, section 4.2.6 |
| `project_name`, `closure_type`, `start_date`, `end_date` and `project_status` cannot be `null` in `PATCH`. `description` can be `null` to remove it | `NOT NULL` columns of the `projects` table |
| Fields that are not in Stage 3, like `contractor_id` or `project_id`, are ignored in `PATCH` | Stage 3, section 4.2.7 |

### Work Zone Polygon

The work zone polygon is not saved in PostgreSQL. As in Stage 3 (sections 2.3 and 3.1), the frontend first sends `POST /projects`, then saves the polygon in the `MAMAR_Projects` layer in ArcGIS Online with the returned `project_id`, using the ArcGIS Maps SDK (`applyEdits`). The backend never connects to ArcGIS Online.

| Item | Value |
| --- | --- |
| Layer | `MAMAR_Projects`: `https://services5.arcgis.com/kGzNyz7ldsPH1gDF/arcgis/rest/services/MAMAR_Web_Map_WFL1/FeatureServer/4` |
| Editing | The five layers allow only `Query` now. Editing (Create and Update) has to be turned on in ArcGIS Online before the frontend can save the polygon |
| `closure_type` | The layer accepts `No Closure`, `Partial Closure` or `Full Closure`. The API accepts any text up to 50 characters, so the frontend can send the same value to both |
| `project_status` | The API saves `draft`. The layer's values are `Draft`, `RFQ`, `Active`, `Completed` and `Cancelled`, so the frontend writes `Draft` in the layer |

## Requests, Quotes and Assignments

The provider workflow from Stage 3, sections 3.2, 4.2.8 to 4.2.14. All of them need the token, and every error is `{"detail": "message"}`.

| Endpoint | Who | What it does |
| --- | --- | --- |
| `POST /projects/{id}/requests` | Contractor of the project | Creates a service request as `open`. Body: `title`, `required_by`, and optional `details` and `provider_ids` (the providers chosen on Select Provider, for example `[1, 3]`). Without `provider_ids` every provider sees the request |
| `GET /requests` | Contractor, provider | A contractor sees the requests of their projects. A provider sees the open requests it was invited to, and with `?status=awarded` (or `closed`) the requests its company won. Optional `?status=` and `?project_id=`. Newest first |
| `POST /requests/{id}/quotes` | Provider invited to the request | Sends a quote as `pending`. Body: `price`, `duration_days`, and optional `notes`. `provider_id` comes from the token |
| `GET /requests/{id}/quotes` | Contractor of the request, provider | The contractor sees all the quotes, cheapest first. A provider sees only the quote of their company |
| `POST /requests/{id}/award` | Contractor of the request | Body `{"quote_id": 54}`. Accepts that quote, rejects the others and marks the request as `awarded` |
| `POST /projects/{id}/assignments` | Provider that won a request of the project | Body `{"worker_id": 15}`. Assigns a field worker of the same company as `active` |
| `GET /assignments` | Provider, field worker | A worker sees their own assignments. A provider sees the assignments of their company. Optional `?status=` and `?project_id=`. Newest first |

The workflow: the contractor creates a request, providers send quotes, the contractor awards one quote, then the winning provider assigns its field workers.

| Case | Status code | `detail` |
| --- | --- | --- |
| Wrong role (for example a worker on `GET /requests`) | 403 | `Only contractors and providers can view service requests` |
| Request or quote of another contractor | 403 | `This request belongs to another contractor` |
| Project or request that does not exist | 404 | `Project not found` or `Request not found` |
| Quote for a request that is awarded or closed | 400 | `The request is awarded, quotes are only sent to open requests` |
| A second quote from the same company | 409 | `Your company already sent a quote for this request` |
| A quote from a company the contractor did not invite | 403 | `The contractor did not invite your company to this request` |
| A `provider_id` in `provider_ids` that does not exist, or an empty list | 422 | `provider_ids: provider 999 does not exist` |
| Awarding a request that is not open | 400 | `The request is already awarded` |
| `quote_id` of another request | 404 | `Quote not found for this request` |
| Assigning without an accepted quote on the project | 403 | `Your company did not win a request for this project` |
| A worker of another company, or a user that is not a worker | 404 | `Worker not found in your company` |
| The same worker twice on a project | 409 | `This worker is already assigned to this project` |
| `price` not above 0 or with more than 2 decimals, `duration_days` below 1, `title` empty | 422 | `price: ...`, `duration_days: ...`, `title: ...` |

`price` is in SAR and is a number in JSON, for example `18500.0`. One quote per company per request is also a `UNIQUE` rule in the `quotes` table, and one assignment per worker per project is a `UNIQUE` rule in the `assignments` table.

## Frontend Workflow (Quotations to Completion)

The endpoints that `frontend/src/services/projectFlow.js` and `fieldWork.js` call. All of them need the token except `GET /photos/{token}`, and every error is `{"detail": "message"}`.

| Endpoint | Who | What it does |
| --- | --- | --- |
| `GET /projects/{id}` | Contractor of the project, a provider that can quote on it or won it, an assigned field worker | One project, with `services` |
| `POST /quotations` | Provider | The Prepare Quotation page. Body: `project_id`, `price`, `duration_days`, optional `start_date`, `services`, `notes`. The quote goes to the open request of the project |
| `GET /projects/{id}/quotations` | Contractor of the project | Every quote of the project with its `provider` (`provider_id`, `company_name`, `service_type`), cheapest first |
| `POST /quotes/{id}/reject` | Contractor of the project | Rejects a `pending` quote |
| `POST /projects/{id}/confirm-provider` | Contractor of the project | Body `{"quote_id": 54}`. Accepts the quote, rejects the others, marks the request `awarded` and the project `active` |
| `GET /projects/{id}/monitoring` | Contractor of the project | `site_status`, `progress`, `field_team_count`, `last_check_in`, `completion_submitted`, `provider`, `quote` and `photos` |
| `GET /projects/{id}/completion` | Contractor of the project | The same data, for Review Completion |
| `POST /projects/{id}/complete` | Contractor of the project | After the field team submits: the project becomes `completed` and its assignments too |
| `POST /projects/{id}/request-changes` | Contractor of the project | Body `{"note": "..."}`. Sends the work back: `Work in Progress`, and the worker sees the note |
| `GET /field-worker/projects` | Field worker | The projects the worker is assigned to, newest first |
| `GET /field-worker/projects/{id}` | Assigned field worker | The project, `site_status`, `progress`, `team`, `photos` and the contractor's `change_note` |
| `PATCH /field-worker/projects/{id}/status` | Assigned field worker | Body `{"status": "Completed"}`. One of `Not Started`, `Work in Progress`, `Paused`, `Completed`. `Completed` turns on `completion_submitted` |
| `POST /field-worker/projects/{id}/check-in` | Assigned field worker | Saves the check-in time. A site that was `Not Started` becomes `Work in Progress` |
| `POST /field-worker/projects/{id}/photos` | Assigned field worker | `multipart/form-data`: one `photos` field per file and optional `captions`. JPEG, PNG or WebP, up to 5 MB each and 10 per upload |
| `GET /photos/{token}` | Anyone with the link | The photo file. The URL has a random value, so `<img>` can show it without the token header |
| `POST /devices/{device}/verify` | Assigned field worker | `device` is the `device_id` (3001) or `device_code` (TC-001) in the MAMAR Traffic Devices layer. Body: `project_id`, `latitude`, `longitude`, optional `accuracy`. The server reads the planned point from ArcGIS and refuses more than 50 m |

`progress` comes from `site_status`: `Not Started` 0, `Work in Progress` and `Paused` 50, `Completed` 100, and 100 for a completed project. Photo URLs are paths like `/photos/3f2a...`, so the frontend adds the API address before them.

| Case | Status code | `detail` |
| --- | --- | --- |
| A quotation for a project without an open request | 400 | `This project is not asking for quotations` |
| A second quotation from the same company | 409 | `Your company already sent a quotation for this project` |
| A quotation from a company the contractor did not invite | 403 | `The contractor did not invite your company to this project` |
| Rejecting a quote that is not pending | 400 | `The quote is already rejected` |
| Confirming twice, or a rejected quote | 400 | `A provider is already confirmed for this project` or `The quote is rejected` |
| A quote of another project | 404 | `Quote not found for this project` |
| Complete or request changes before the worker submits | 400 | `The field team has not submitted the work yet` |
| A worker who is not assigned to the project | 403 | `You are not assigned to this project` |
| Changing a completed or cancelled project | 400 | `The project is completed` |
| A photo that is not JPEG, PNG or WebP, no photo, or more than 10 | 422 | `notes.txt: only JPEG, PNG or WebP photos` |
| A photo bigger than 5 MB | 413 | `big.jpg: the photo is bigger than 5 MB` |
| The worker is more than 50 m from the device | 422 | `You are 200 m from the planned location. Move within 50 m and capture again.` |
| The device is not in the layer for this project | 404 | `Device not found for this project` |
| ArcGIS cannot be reached | 502 | `Could not read the planned device location: ...` |

The work zone polygon is still saved in ArcGIS by the frontend, as in Stage 3 (see [Work Zone Polygon](#work-zone-polygon)). Saving needs **Create** and **Update** turned on for the MAMAR Projects layer in ArcGIS Online. Until then the project is saved in PostgreSQL and the Review page shows that the map copy could not be saved.

## Provider Pages

The data of the provider's Dashboard, Service Requests and Projects pages. Only a `provider` token opens them (others get 403 `Only providers can view this page`), and each one returns only the data of the provider's own company (`provider_id` in the token). A new company gets `[]`, `null` and zeros, not an error.

| Endpoint | What it returns |
| --- | --- |
| `GET /provider/requests` | The open requests the company was invited to, newest first. Each one has the request fields, `project` (name, dates, `closure_type`, `services`), `quoted` and `my_quote` (the company's quote or `null`). `?quoted=false` keeps only the requests still waiting for a quote |
| `GET /provider/projects` | The projects the company won (its quote was accepted), without cancelled ones. Each one has `project`, `status` (`Active`, `Upcoming` or `Completed`), `site_status`, `progress`, `field_team_count`, `last_check_in`, `completion_submitted` and `quote`. `?status=Active` picks one tab |
| `GET /provider/projects/{id}` | One won project with the same fields plus `submitted_at`, `change_note`, `team` and `photos`. 403 `Your company did not win this project` for other companies |
| `GET /provider/workers` | The Field Team page: every field worker account of the company, newest first. Each one has `user_id`, `full_name`, `email`, `phone`, `status` (`Active` on an open project, `Available`, or `On Leave` when the account is turned off), `project` (the current project or `null`), `active_projects`, `last_activity` (the last photo or assignment) and `created_at`. `?status=Available` picks one filter. A worker added on the page is listed here as soon as the account is created |
| `GET /provider/dashboard` | `stats` (`assigned`, `active`, `upcoming`, `completed`), `pending_quotes`, `new_requests` (not quoted yet), `next_project` (the first upcoming one, or `null`), `active_projects` and `overview` (`workers_active`, `sites_active`, `field_workers`). Every number is counted by the server |

`status` of a won project: `Completed` after the contractor approves it, `Active` when the start date came or the field team already checked in, otherwise `Upcoming`. Today is the date in Riyadh. `progress` is the same as on Project Monitoring.

## Frontend Integration

The React frontend runs on Vite at `http://localhost:5173`, which is allowed in `FRONTEND_ORIGINS`. CORS allows the methods used by the API (`GET`, `POST` and `PATCH`) and the `Authorization` and `Content-Type` headers, so the frontend can send JSON and the token. The deployed frontend, `https://mammar-blush.vercel.app`, is also allowed in `FRONTEND_ORIGINS` on Render.

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

The create project pages can save the project like this, then save the work zone polygon with `project.project_id` (see [Work Zone Polygon](#work-zone-polygon)):

```javascript
export async function createProject(project, accessToken) {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(project),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail);
  }
  return data;
}
```

### Project Creation Integration (Issue #28)

How the Create Project form (`frontend/src/pages/CreateProjectPage.jsx`) maps to `POST /projects`:

| Form field | API field | Rule |
| --- | --- | --- |
| Project Name (`name`) | `project_name` | Required, up to 150 characters, spaces at the ends are removed |
| Project Type (`type`) | `closure_type` | Required, up to 50 characters. The five form types are accepted as they are |
| Start Date (`startDate`) | `start_date` | Required, `YYYY-MM-DD` (the value of `<input type="date">`) |
| End Date (`endDate`) | `end_date` | Required, the same day as `start_date` or later |
| Description (`description`) | `description` | Optional in the API, an empty text is saved as `null` |

The flow the API supports:

1. **Project Details → Next**: `POST /projects` with `Authorization: Bearer <access_token>` from the saved session. Keep `project_id` from the response in `mamarNewProject` in `sessionStorage`.
2. **Back to Project Details → Next again**: if `mamarNewProject` already has a `project_id`, send `PATCH /projects/{project_id}` instead, so no second project is created.
3. **Location step**: save the work zone polygon in `MAMAR_Projects` with the same `project_id` (see [Work Zone Polygon](#work-zone-polygon)).
4. **Dashboard (My Projects)**: `GET /projects` with the token returns the contractor's projects, newest first.

| Response | What the page shows |
| --- | --- |
| 201 | Go to the next step with `project_id` |
| 401 | The session ended: remove the session and open the login page |
| 403 | Only contractor accounts can create projects |
| 422 | `detail`, for example `end_date: cannot be before start_date` |
| Network error | `Unable to connect to the server. Please try again.` (the free Render server can take about a minute to wake up) |

Integration results (backend):

| Check | Result |
| --- | --- |
| The form data is saved in PostgreSQL with the signed-in contractor's `user_id` and status `draft` | Passed, `test_create_project_form_is_saved_and_listed` |
| `POST /projects` returns a valid `project_id` | Passed |
| A new project is returned by `GET /projects`, newest first, only to its contractor | Passed |
| Going back to step 1 updates the same project | Passed, `test_going_back_to_step_1_updates_the_same_project` |
| The browser can send `POST`, `GET` and `PATCH` with the token (CORS) | Passed |
| Missing or invalid fields, wrong dates, no token and non-contractor accounts return clear `detail` messages | Passed |

Remaining issues (frontend side of issue #28):

- The project is now saved when the contractor presses **Confirm & Find Providers** on the Review page (`submitProject()` in `projectFlow.js`), with the form fields above and `services`.
- The My Projects table and the statistics on `ContractorDashboard` still show sample projects instead of `GET /projects`.

### Integration Notes

| Item | Value |
| --- | --- |
| Backend base URL (local) | `http://127.0.0.1:8000` |
| Backend base URL (Render) | `https://mamar-api.onrender.com` |
| Test endpoint | `GET /health` |
| Register endpoint | `POST /auth/register` |
| Login endpoint | `POST /auth/login` |
| Session check | `GET /auth/me` with the token. 401 means the saved token must be removed |
| Projects endpoints | `GET /projects`, `POST /projects` and `PATCH /projects/{id}`, for contractors only |
| Provider workflow | Requests, quotes, award and assignments, see [Requests, Quotes and Assignments](#requests-quotes-and-assignments) |
| Token header for the other endpoints | `Authorization: Bearer <token>` |
| Success response | `{"status": "ok", "database": "connected"}` |
| Error response | `{"detail": "message"}`, so the frontend can show `detail` to the user |
| Allowed frontend origins | `http://localhost:5173` and `http://127.0.0.1:5173`, and `https://mammar-blush.vercel.app` on Render |
| Provider IDs for testing | 1 to 4, see [Demo Providers](#demo-providers) |
| Email verification | `POST /auth/send-passcode`, then `passcode` in `POST /auth/register` (off on Render for now) |

To connect the register page to `POST /auth/register`:

- Send the role `worker` instead of `field-worker`, because the `users` table and the Stage 3 API accept `worker`. The button can still say "Field Worker". The login page should use `worker` too.
- Add a full name field. `full_name` is required in Stage 3, and the page now asks only for the email, the password and the role.
- `provider` and `worker` accounts need a `provider_id`. Use one of the demo providers, 1 to 4, with its company email, for example `test@tcmksa.com` for provider 1. Another number returns 404 `Provider not found`, and another email returns 422.

To connect the Create Account (passcode) pages before email verification is turned on:

- `RegisterPage`: before going to the passcode page, send `POST /auth/send-passcode` with the email, and show `detail` if it fails (for example 409 when the email is already registered).
- `RegisterVerificationPage` and `WorkerVerificationPage`: on **Create Account**, send `POST /auth/register` with the saved registration and `passcode`. On 201, remove `mamarPendingRegistration` from `sessionStorage` and open the login page. Otherwise show `detail`.
- A "send a new passcode" button can send `POST /auth/send-passcode` again (once a minute).

## Run the Tests

PostgreSQL must be running and `.env` must be filled in. The register and projects tests create their own test accounts and projects and delete them at the end, so the database stays clean.

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
| `test_frontend_origins_keep_only_the_site_address` | A copied link with a path, a `/` or `?...` in `FRONTEND_ORIGINS` is cut to the site address that the browser sends |
| `test_tables_and_columns_match_the_er_diagram` | The tables have the Stage 3 columns plus the new workflow columns, in the same order on a new and an upgraded database |
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
| `test_register_with_an_invalid_body_returns_422` | A wrong role, the `admin` role, a wrong email, a short password and the two `provider_id` rules return 422 (6 cases) |
| `test_register_with_an_unknown_provider_returns_404` | A `provider_id` that does not exist returns 404 |
| `test_register_a_worker_of_an_existing_provider` | A worker of an existing provider is registered with the company email |
| `test_register_with_an_email_outside_the_company_returns_422` | A `provider` or `worker` with another email returns 422 and nothing is saved (2 cases) |
| `test_register_with_a_provider_without_a_website_returns_422` | A provider without a website cannot have `provider` or `worker` accounts yet |
| `test_company_domain_comes_from_the_provider_website` | The company email domain is the website domain without `www.` (4 cases) |
| `test_frontend_can_send_the_register_request` | The browser can send JSON from the React frontend to the register endpoint (CORS) |
| `test_login_returns_a_token_and_the_user` | Login returns 200 with the token and the user, like Stage 3, and the token keeps the user id and role |
| `test_login_with_a_wrong_password_returns_401` | A wrong password returns 401 |
| `test_login_with_an_unknown_email_returns_401` | An email that is not registered returns the same 401 |
| `test_protected_endpoint_accepts_the_login_token` | The login token opens an endpoint that needs a token |
| `test_protected_endpoint_without_a_valid_token_returns_401` | No token, a wrong token, an expired token and a token signed with another key all return 401 |
| `test_me_returns_the_signed_in_user` | `GET /auth/me` with the login token returns the user, with the same fields as register |
| `test_me_without_a_token_returns_401` | `GET /auth/me` without a token returns 401 |
| `test_me_with_an_invalid_or_expired_token_returns_401` | A wrong, changed or expired token, and a token signed with another key, return 401 |
| `test_me_after_the_account_is_deactivated_returns_401` | The token of a deactivated account stops working |
| `test_me_after_the_account_is_deleted_returns_401` | The token of a deleted account stops working |
| `test_frontend_can_check_the_token` | The browser can send the token to `GET /auth/me` from the React frontend (CORS) |
| `test_verification_is_off_by_default` | With the switch off, register works without a passcode, as before |
| `test_register_with_the_right_passcode_creates_the_account` | The right passcode creates the account, it can log in, and the passcode is used once |
| `test_register_without_a_passcode_returns_422` | With the switch on, `passcode` is required |
| `test_register_before_asking_for_a_passcode_returns_400` | A passcode that was never asked for returns 400 |
| `test_wrong_passcode_returns_400_and_creates_nothing` | A wrong passcode returns 400 and no account is saved |
| `test_too_many_wrong_passcodes_block_the_passcode` | After 5 wrong passcodes, even the right one returns 429 |
| `test_expired_passcode_returns_400` | A passcode older than 10 minutes returns 400 |
| `test_passcode_must_have_6_digits` | Passcodes that are not 6 digits return 422 (4 cases) |
| `test_only_the_hash_of_the_passcode_is_saved` | The passcode is saved as an Argon2 hash |
| `test_new_passcode_waits_a_minute_and_replaces_the_old_one` | A new passcode waits a minute, and then only the new one works |
| `test_new_passcode_after_wrong_passcodes_works` | A new passcode works after 5 wrong ones |
| `test_send_passcode_to_a_registered_email_returns_409` | A registered email cannot get a passcode |
| `test_send_passcode_with_an_invalid_email_returns_422` | An email that is not valid returns 422 |
| `test_send_passcode_returns_502_when_the_email_cannot_be_sent` | When EmailJS fails, it returns 502 and the user can try again right away |
| `test_emailjs_request` | The request to EmailJS has the right address, service, template, keys, receiver and passcode |
| `test_emailjs_error_is_explained` | When EmailJS refuses the request, its reason is kept in the error for the server log |
| `test_without_emailjs_the_passcode_is_written_in_the_log` | Without EmailJS, nothing is sent and the passcode is written in the server log |
| `test_create_project_returns_201_as_draft` | A contractor creates a project with the Stage 3 example. It returns 201 with the Stage 3 fields, as `draft`, and saves the contractor's `user_id` |
| `test_create_project_without_description` | `description` is optional, and an empty description is saved as `null` |
| `test_project_saves_the_location_and_work_zone` | The address, pin and work zone are saved, returned by GET, and can be changed. An empty work zone is saved as `null` |
| `test_project_without_location_returns_nulls` | A project without a location returns `null` for the four fields |
| `test_project_with_a_location_out_of_range_returns_422` | A latitude, longitude or work zone point out of range returns 422 |
| `test_end_date_before_start_date_returns_422` | `end_date` before `start_date` returns 422 and nothing is saved. The same day is accepted |
| `test_create_project_with_an_invalid_body_returns_422` | A missing or empty name, too long name or closure type, and dates that are not valid return 422 and nothing is saved (7 cases) |
| `test_projects_need_a_token` | `GET`, `POST` and `PATCH` without a token return 401 |
| `test_only_contractors_can_use_projects` | A `provider` and a `worker` get 403 on the three endpoints (2 cases) |
| `test_list_returns_only_my_projects_newest_first` | A contractor sees only their own projects, newest first |
| `test_list_without_projects_returns_an_empty_list` | A contractor without projects gets `[]` |
| `test_list_filters_by_project_status` | `?project_status=` filters the list, and an unknown status returns 422 |
| `test_patch_changes_only_the_sent_fields` | `PATCH` changes only the sent fields, removes `description` with `null`, and ignores `contractor_id` and `project_id` |
| `test_patch_moves_the_status_between_the_four_statuses` | `project_status` can be `draft`, `active`, `completed` and `cancelled` |
| `test_patch_with_invalid_data_returns_422` | An unknown status, `null` for a required field, an empty name and a body without the six fields return 422 and change nothing (7 cases) |
| `test_patch_checks_the_dates_together` | A new date is checked with the saved one, also when only one date is sent |
| `test_patch_a_project_of_another_contractor_returns_403` | A contractor cannot change another contractor's project |
| `test_patch_an_unknown_project_returns_404` | A project that does not exist returns 404 |
| `test_update_status_accepts_only_the_four_statuses` | `update_status()` accepts only the four Stage 3 statuses |
| `test_frontend_can_send_a_patch_with_the_token` | The browser can send `PATCH` with the token from the React frontend (CORS) |
| `test_create_project_form_is_saved_and_listed` | The Create Project form, with each of its five project types, is saved in PostgreSQL for the signed-in contractor, returns a `project_id`, and `GET /projects` returns it first (5 cases) |
| `test_going_back_to_step_1_updates_the_same_project` | `PATCH` with the saved `project_id` changes the same project, so going back to Project Details does not create a second one |
| `test_frontend_can_create_and_list_projects_with_the_token` | The browser can send `POST` and `GET /projects` with the token from the React frontend (CORS) (2 cases) |
| `test_create_request_returns_201_as_open` | A contractor creates a request with the Stage 3 example. It returns 201 with the Stage 3 fields as `open` |
| `test_create_request_without_details` | `details` is optional, and empty details are saved as `null` |
| `test_create_request_with_an_invalid_body_returns_422` | An empty or too long title and a wrong or missing date return 422 (4 cases) |
| `test_create_request_rules` | No token 401, another contractor's project 403, a provider 403, an unknown project 404 |
| `test_contractor_sees_only_the_requests_of_their_projects` | A contractor sees only their own requests, newest first, and `?project_id=` filters them |
| `test_provider_sees_open_requests_and_the_requests_it_won` | A provider sees the open requests, and with `?status=awarded` only the requests its company won |
| `test_provider_sees_only_the_requests_it_was_invited_to` | `provider_ids` is saved once per provider, only the invited companies see the request, and another company cannot quote it |
| `test_create_request_with_unknown_or_empty_provider_ids_returns_422` | An unknown provider or an empty list returns 422 |
| `test_list_requests_rules` | No token 401, a worker 403, an unknown status 422 |
| `test_award_accepts_one_quote_and_rejects_the_others` | Award accepts the chosen quote, rejects the other one and returns the Stage 3 response |
| `test_award_rules` | Another contractor 403, a provider 403, unknown request 404, quote of another request 404, missing `quote_id` 422, awarding twice 400 |
| `test_award_and_close_methods` | `award()` and `close()` change the statuses and refuse a request that is not open |
| `test_frontend_can_send_a_request_with_the_token` | The browser can send `POST` with the token from the React frontend (CORS) |
| `test_provider_submits_a_quote` | A provider sends a quote. It returns 201 with the Stage 3 fields, `pending`, the provider of the token and a number price |
| `test_a_worker_of_the_provider_cannot_send_a_quote_and_provider_id_is_not_taken_from_the_body` | A worker and a contractor get 403, and a `provider_id` in the body is ignored |
| `test_one_quote_per_company` | A second employee of the same company gets 409 |
| `test_quote_rules` | No token 401, unknown request 404, a request that is already awarded 400 |
| `test_quote_with_an_invalid_body_returns_422` | A price of 0, below 0, with 3 decimals or too big, a missing price, and a wrong `duration_days` return 422 (7 cases) |
| `test_who_sees_the_quotes` | The contractor sees all the quotes cheapest first, a provider sees only their own, another contractor and a worker get 403, an unknown request 404 |
| `test_the_winning_provider_assigns_its_worker` | The winning provider assigns its worker. It returns 201 with the Stage 3 fields as `active` |
| `test_assignment_rules` | No token 401, a worker 403, a provider that lost 403, unknown project 404, a worker of another company, a contractor or an unknown user 404, missing `worker_id` 422, the same worker twice 409 |
| `test_a_provider_with_a_rejected_or_pending_quote_cannot_assign` | Only an accepted quote on an awarded request allows assignments |
| `test_who_sees_the_assignments` | A provider sees its company's assignments newest first, a worker sees only their own, another provider sees none, a contractor 403, no token 401, an unknown status 422 |
| `test_complete_method` | `complete()` finishes an active assignment and refuses a finished one |
| `test_project_saves_the_services_once` | `services` is saved without repeats, is `[]` by default, and can be changed with `PATCH` |
| `test_unknown_service_returns_422` | A service id that is not on the Select Service page returns 422 |
| `test_get_one_project_for_each_role` | `GET /projects/{id}` works for the contractor, the winning provider and the assigned worker, and returns 403 for others and 404 for an unknown project |
| `test_provider_can_view_a_project_that_asks_for_quotations` | A provider can open a project with an open request |
| `test_provider_sends_a_quotation_for_a_project` | `POST /quotations` saves the price, start date, services and notes as `pending`, and a second one returns 409 |
| `test_quotation_errors` | No open request 400, unknown project 404, a contractor 403, a price of 0 returns 422 |
| `test_contractor_sees_the_quotations_cheapest_first` | The quotations come with their company, cheapest first, and another contractor gets 403 |
| `test_contractor_rejects_a_quotation` | A pending quote is rejected once. Another contractor 403, unknown quote 404 |
| `test_confirm_provider_accepts_one_quote_and_activates_the_project` | The chosen quote is accepted, the others rejected, the project is `active`, and a second confirm returns 400 |
| `test_confirm_provider_errors` | A rejected quote 400, a quote of another project 404, a provider 403 |
| `test_field_worker_sees_only_assigned_projects` | A worker sees only their projects with the provider and team. Others get `[]` or 403 |
| `test_check_in_and_status_reach_the_contractor` | Check-in and the status `Completed` show on the contractor's monitoring and completion data |
| `test_worker_uploads_photos_that_the_contractor_can_open` | Uploaded photos are served at `/photos/{token}` with the right type and appear in monitoring |
| `test_photo_upload_rules` | A text file 422, a photo over 5 MB 413, more than 10 photos 422, a worker of another project 403 |
| `test_contractor_approves_the_completion` | Complete before submitting returns 400. After it, the project and its assignments are completed and the worker cannot change it |
| `test_contractor_requests_changes` | The note reaches the worker, the site goes back to `Work in Progress`, and an empty note returns 422 |
| `test_device_verified_within_50_m` | 20 m from the planned point is verified (ArcGIS is replaced by a fixed point in the test) |
| `test_device_too_far_is_rejected_by_the_server` | 200 m away returns 422 even if the phone said it was close |
| `test_device_errors` | Device not in the layer 404, ArcGIS offline 502, a worker of another project 403, a latitude of 95 returns 422 |
| `test_device_found_by_code` | A device is found by its code, for example `TC-014` |
| `test_device_filter_accepts_ids_and_codes_only` | Only a number or a code made of letters, digits, `-` and `_` reaches the ArcGIS query |
| `test_haversine_matches_the_frontend` | The distance formula gives the same result as `distanceInMeters()` in the frontend |
| `test_provider_pages_need_a_provider_token` | The four provider pages return 401 without a token and 403 for a contractor or a worker |
| `test_new_provider_gets_empty_lists_and_zeros` | A company without projects gets `[]`, `null` and zeros |
| `test_provider_requests_have_the_project_and_the_quoted_flag` | Each request has its project, and `quoted` and `my_quote` change after the quotation. `?quoted=` filters |
| `test_provider_requests_follow_the_invitation` | Only the invited company sees the request, can open the project and can send a quotation |
| `test_provider_projects_have_progress_and_tabs` | Won projects are `Active` or `Upcoming` with their progress and quote, `?status=` filters, and another company sees none of them |
| `test_provider_project_detail_has_the_team_and_photos` | The detail has the team, check-in, photos and progress, and becomes `Completed` with 100 after approval |
| `test_provider_project_detail_errors` | Another company gets 403 and a missing project 404 |
| `test_provider_dashboard_counts_its_own_data` | The dashboard counts the company's projects, pending quotes, new requests and active workers |
| `test_provider_workers_need_a_provider_token` | The workers list returns 401 without a token and 403 for a contractor |
| `test_provider_workers_lists_the_company_workers_after_they_register` | A registered worker is listed as `Available` for its own company only |
| `test_provider_workers_shows_the_current_project_and_filters` | An assigned worker is `Active` with its project and last activity, `?status=` filters, and the worker is `Available` again after the project is approved |
| `test_awarded_request_leaves_the_new_requests` | After the contractor confirms, the request leaves the new requests and appears in `?status=awarded` |

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
| `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY` | From the EmailJS account, see [Email Verification](#email-verification). `EMAILJS_PRIVATE_KEY` is secret |
| `EMAIL_VERIFICATION` | Not added yet, so it is `off`. Added as `on` when the frontend sends the passcode, see [Email Verification](#email-verification) |

The free Render PostgreSQL database expires 30 days after it is created.
