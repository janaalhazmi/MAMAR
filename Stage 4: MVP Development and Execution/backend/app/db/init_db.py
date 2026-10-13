# Importing the models package loads the six models, so Base knows their tables.
import app.models  # noqa: F401
from app.db.database import Base, engine


def create_tables():
    # Creates the tables that do not exist yet. Existing tables are not changed.
    Base.metadata.create_all(bind=engine)
