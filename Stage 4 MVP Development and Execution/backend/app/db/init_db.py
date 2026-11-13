from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql import insert

# Importing the models package loads the six models, so Base knows their tables.
import app.models  # noqa: F401
from app.db.database import Base, SessionLocal, engine
from app.models import Provider

# Stage 3 says the provider records are prepared in advance, so users cannot link
# themselves to any company. These are the same companies and provider_id values as
# the MAMAR_Providers layer in ArcGIS Online, so the map and the database match.
DEMO_PROVIDERS = [
    {
        "provider_id": 1,
        "email_domain": "tcm.com",
        "company_name": "Traffic and Construction Management TCM",
        "service_type": "Traffic Management",
        "city": "Riyadh",
        "phone": "+966503064427",
        "website": "https://tcmksa.com",
    },
    {
        "provider_id": 2,
        "email_domain": "safetyarabia.com",
        "company_name": "Safety Arabia Co. LTD",
        "service_type": "Traffic Devices",
        "city": "Riyadh",
        "phone": "+966114792531",
        "website": "https://redanational.com",
    },
    {
        "provider_id": 3,
        "email_domain": "shawahid.com",
        "company_name": "Shawahid Roads Industrial Co.",
        "service_type": "Road Safety",
        "city": "Riyadh",
        "phone": "+966590177041",
        "website": "https://shawahidts.com",
    },
    {
        "provider_id": 4,
        "email_domain": "safetytriangle.com",
        "company_name": "Safety Triangle Company",
        "service_type": "Road Safety",
        "city": "Riyadh",
        "phone": "+966530500118",
        "website": "https://www.safetytriangle.com.sa",
    },
]


def create_tables():
    # Creates the tables that do not exist yet. Existing tables are not changed.
    Base.metadata.create_all(bind=engine)


# Columns added after the first deploy. create_all() does not change a table that already
# exists, so they are added here. IF NOT EXISTS makes it safe to run on every start.
NEW_COLUMNS = [
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS services JSON NOT NULL DEFAULT '[]'",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_status VARCHAR(30) NOT NULL DEFAULT 'Not Started'",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_check_in TIMESTAMP",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS completion_submitted BOOLEAN NOT NULL DEFAULT false",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS change_note TEXT",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS location VARCHAR(255)",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS work_zone JSON",
    "ALTER TABLE quotes ADD COLUMN IF NOT EXISTS start_date DATE",
    "ALTER TABLE quotes ADD COLUMN IF NOT EXISTS services JSON",
    "ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS provider_ids JSON",
    "ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS declined_provider_ids JSON",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_token VARCHAR(32)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_content_type VARCHAR(30)",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_data BYTEA",
    "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_avatar_token ON users (avatar_token)",
    "ALTER TABLE providers ADD COLUMN IF NOT EXISTS email_domain VARCHAR(100)",
]

# A project keeps one open request. Going back from Quotations used to add a new request each
# time, so providers saw the same project twice. This closes the extra open requests that have
# no quote, and keeps the one with quotes or the newest one. It changes nothing the second time.
CLOSE_DUPLICATE_REQUESTS = """
UPDATE service_requests AS r SET status = 'closed'
WHERE r.status = 'open'
  AND NOT EXISTS (SELECT 1 FROM quotes q WHERE q.request_id = r.request_id)
  AND EXISTS (
    SELECT 1 FROM service_requests o
    WHERE o.project_id = r.project_id AND o.status = 'open' AND o.request_id <> r.request_id
      AND (o.request_id > r.request_id OR EXISTS (SELECT 1 FROM quotes q2 WHERE q2.request_id = o.request_id))
  )
"""


def upgrade_tables():
    # Adds the new columns to the tables of an existing database (the one on Render).
    with engine.begin() as connection:
        for statement in NEW_COLUMNS:
            connection.execute(text(statement))
        connection.execute(text(CLOSE_DUPLICATE_REQUESTS))


def add_demo_providers():
    # Adds the demo providers that are missing. A provider_id that already exists
    # is skipped and not changed, so this is safe to run every time the server starts.
    with SessionLocal() as db:
        db.execute(insert(Provider).values(DEMO_PROVIDERS).on_conflict_do_nothing(index_elements=["provider_id"]))
        # Companies saved before email_domain existed get their demo email domain once.
        for demo in DEMO_PROVIDERS:
            db.execute(
                text("UPDATE providers SET email_domain = :domain WHERE provider_id = :id AND email_domain IS NULL"),
                {"domain": demo["email_domain"], "id": demo["provider_id"]},
            )
        # We chose the provider_id values ourselves, so PostgreSQL's counter for new
        # providers did not move. This moves it after the biggest provider_id, so the
        # next provider gets 5 and not 1 again.
        db.execute(
            text(
                "SELECT setval(pg_get_serial_sequence('providers', 'provider_id'), "
                "(SELECT MAX(provider_id) FROM providers))"
            )
        )
        db.commit()


def add_admin_account():
    # Creates the admin account from ADMIN_EMAIL and ADMIN_PASSWORD (never written in the code).
    from app.core import config
    from app.models import User

    if not config.ADMIN_EMAIL or len(config.ADMIN_PASSWORD) < 8:
        return
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == config.ADMIN_EMAIL))
        if user is None:
            user = User(full_name="MAMAR Admin", email=config.ADMIN_EMAIL, role="admin")
            db.add(user)
        elif user.role != "admin":
            # An existing contractor, provider or worker account is never turned into an admin.
            print(f"ADMIN_EMAIL {config.ADMIN_EMAIL} belongs to a {user.role} account; no admin was made")
            return
        if not user.password_hash or not user.check_password(config.ADMIN_PASSWORD):
            user.set_password(config.ADMIN_PASSWORD)
        user.is_active = True
        db.commit()


# The demo accounts: one provider and one field worker for each company, for example
# provider@tcm.com and fieldworker@tcm.com. Their password is DEMO_PASSWORD on Render
# (never written in the code); without it no demo account is made.
DEMO_ROLES = (("provider", "provider", "Provider"), ("fieldworker", "worker", "Field Worker"))
DEMO_NAMES = {1: "TCM", 2: "Safety Arabia", 3: "Shawahid", 4: "Safety Triangle"}


def add_demo_accounts():
    from app.core import config
    from app.models import User

    if len(config.DEMO_PASSWORD) < 8:
        return
    with SessionLocal() as db:
        for demo in DEMO_PROVIDERS:
            for local_part, role, label in DEMO_ROLES:
                email = f"{local_part}@{demo['email_domain']}"
                user = db.scalar(select(User).where(User.email == email))
                if user is None:
                    user = User(
                        full_name=f"{DEMO_NAMES[demo['provider_id']]} {label}",
                        email=email,
                        role=role,
                        provider_id=demo["provider_id"],
                    )
                    db.add(user)
                elif user.role != role or user.provider_id != demo["provider_id"]:
                    continue
                if not user.password_hash or not user.check_password(config.DEMO_PASSWORD):
                    user.set_password(config.DEMO_PASSWORD)
        db.commit()
