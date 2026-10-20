# Importing every model here registers its table on Base.metadata.
from app.models.assignment import Assignment
from app.models.email_passcode import EmailPasscode
from app.models.project import Project
from app.models.provider import Provider
from app.models.quote import Quote
from app.models.service_request import ServiceRequest
from app.models.user import User

__all__ = ["Assignment", "EmailPasscode", "Project", "Provider", "Quote", "ServiceRequest", "User"]
