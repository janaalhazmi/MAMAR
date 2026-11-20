# Importing every model here registers its table on Base.metadata.
from app.models.activity import Activity
from app.models.ai_result import AIResult
from app.models.attendance import Attendance
from app.models.assignment import Assignment
from app.models.device import ProjectDevice
from app.models.email_passcode import EmailPasscode
from app.models.notification import Notification
from app.models.payment import Payment
from app.models.project import Project
from app.models.provider import Provider
from app.models.quote import Quote
from app.models.review import Review
from app.models.service_request import ServiceRequest
from app.models.site_photo import SitePhoto
from app.models.user import User
from app.models.project_milestone import ProjectMilestone

__all__ = ["AIResult", "Activity", "Attendance", "Assignment", "EmailPasscode", "Notification", "Payment", "Project", "ProjectDevice", "Provider", "Quote", "Review", "ServiceRequest", "SitePhoto", "User", "ProjectMilestone"]
