from sqlalchemy import text
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
        "company_name": "Traffic and Construction Management TCM",
        "service_type": "Traffic Management",
        "city": "Riyadh",
        "phone": "+966503064427",
        "website": "https://tcmksa.com",
    },
    {
        "provider_id": 2,
        "company_name": "Safety Arabia Co. LTD",
        "service_type": "Traffic Devices",
        "city": "Riyadh",
        "phone": "+966114792531",
        "website": "https://redanational.com",
    },
    {
        "provider_id": 3,
        "company_name": "Shawahid Roads Industrial Co.",
        "service_type": "Road Safety",
        "city": "Riyadh",
        "phone": "+966590177041",
        "website": "https://shawahidts.com",
    },
    {
        "provider_id": 4,
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


def add_demo_providers():
    # Adds the demo providers that are missing. A provider_id that already exists
    # is skipped and not changed, so this is safe to run every time the server starts.
    with SessionLocal() as db:
        db.execute(insert(Provider).values(DEMO_PROVIDERS).on_conflict_do_nothing(index_elements=["provider_id"]))
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
