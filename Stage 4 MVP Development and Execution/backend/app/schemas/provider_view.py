from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.schemas.project import ProjectResponse
from app.schemas.quote import QuoteResponse
from app.schemas.service_request import ServiceRequestResponse
from app.schemas.workflow import PhotoResponse, TeamMember

# The tabs of the provider's Projects page.
ProjectTab = Literal["Active", "Upcoming", "Completed"]


class ProviderRequest(ServiceRequestResponse):
    # An open request the provider was invited to, with its project and the quote the
    # provider's company sent (null when it has not sent one yet).
    project: ProjectResponse
    quoted: bool
    my_quote: QuoteResponse | None


class ProviderProject(BaseModel):
    # A project the provider's company won (its quote was accepted).
    project: ProjectResponse
    status: Literal["Active", "Upcoming", "Completed", "Cancelled"]
    site_status: str
    progress: int
    field_team_count: int
    last_check_in: datetime | None
    completion_submitted: bool
    quote: QuoteResponse


class ProviderProjectDetail(ProviderProject):
    submitted_at: datetime | None
    change_note: str | None
    team: list[TeamMember]
    photos: list[PhotoResponse]


class ProviderStats(BaseModel):
    assigned: int
    active: int
    upcoming: int
    completed: int


class ProviderOverview(BaseModel):
    # workers_active: field workers of the company working on an active project now.
    # field_workers: all the active field worker accounts of the company.
    workers_active: int
    sites_active: int
    field_workers: int


class ProviderDashboard(BaseModel):
    stats: ProviderStats
    pending_quotes: int
    new_requests: list[ProviderRequest]
    next_project: ProviderProject | None
    active_projects: list[ProviderProject]
    overview: ProviderOverview


# The filters of the provider's Field Team page.
WorkerStatus = Literal["Active", "Available", "On Leave"]


class WorkerProject(BaseModel):
    project_id: int
    project_name: str


class ProviderWorker(BaseModel):
    # A field worker account of the provider's company.
    # status: Active (working on an open project now), Available (no open project),
    # On Leave (the account is turned off).
    user_id: int
    full_name: str
    email: str
    phone: str | None
    status: WorkerStatus
    project: WorkerProject | None
    active_projects: int
    last_activity: datetime | None
    created_at: datetime
