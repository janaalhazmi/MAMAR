import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, func, select

from app.db.database import SessionLocal
from app.main import app
from app.models import Project, User
from app.models.project import PROJECT_STATUSES

# The fields of one project in Stage 3, section 4.2.5, in the same order.
PROJECT_FIELDS = [
    "project_id", "contractor_id", "project_name", "project_status",
    "closure_type", "start_date", "end_date", "description", "created_at",
]

# The example body from Stage 3, section 4.2.6.
PROJECT = {
    "project_name": "King Fahd Road Maintenance",
    "closure_type": "lane_closure",
    "start_date": "2026-11-01",
    "end_date": "2026-12-15",
    "description": "Night work on the right lane",
}


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def sign_in(client):
    # Registers a new account and logs in. The accounts and their projects are deleted after the test.
    emails = []

    def new_account(role="contractor", provider_id=None, domain="example.com"):
        email = f"test-{uuid.uuid4().hex[:12]}@{domain}"
        emails.append(email)
        body = {
            "full_name": "Sara Ahmed",
            "email": email,
            "password": "StrongPass123",
            "role": role,
            "provider_id": provider_id,
        }
        assert client.post("/auth/register", json=body).status_code == 201
        login = client.post("/auth/login", json={"email": email, "password": "StrongPass123"}).json()
        return login["user"]["user_id"], {"Authorization": f"Bearer {login['access_token']}"}

    yield new_account
    with SessionLocal() as db:
        user_ids = select(User.user_id).where(User.email.in_(emails))
        db.execute(delete(Project).where(Project.contractor_id.in_(user_ids)))
        db.execute(delete(User).where(User.email.in_(emails)))
        db.commit()


def create_project(client, headers, **changes):
    body = {**PROJECT, **changes}
    response = client.post("/projects", json=body, headers=headers)
    assert response.status_code == 201
    return response.json()


def count_projects(contractor_id):
    with SessionLocal() as db:
        return db.scalar(select(func.count()).select_from(Project).where(Project.contractor_id == contractor_id))


def test_create_project_returns_201_as_draft(client, sign_in):
    user_id, headers = sign_in()
    response = client.post("/projects", json=PROJECT, headers=headers)
    assert response.status_code == 201
    project = response.json()
    assert list(project) == PROJECT_FIELDS
    assert project["contractor_id"] == user_id
    assert project["project_status"] == "draft"
    for field, value in PROJECT.items():
        assert project[field] == value
    with SessionLocal() as db:
        saved = db.get(Project, project["project_id"])
        assert saved.contractor_id == user_id
        assert saved.project_status == "draft"


def test_create_project_without_description(client, sign_in):
    _, headers = sign_in()
    body = {field: value for field, value in PROJECT.items() if field != "description"}
    assert client.post("/projects", json=body, headers=headers).json()["description"] is None
    # An empty description is saved as null too.
    assert create_project(client, headers, description="  ")["description"] is None


def test_end_date_before_start_date_returns_422(client, sign_in):
    user_id, headers = sign_in()
    response = client.post("/projects", json={**PROJECT, "end_date": "2026-10-31"}, headers=headers)
    assert response.status_code == 422
    assert response.json() == {"detail": "end_date: cannot be before start_date"}
    assert count_projects(user_id) == 0
    # The same day for the start and the end is accepted.
    assert create_project(client, headers, end_date="2026-11-01")["end_date"] == "2026-11-01"


# Each case breaks one rule of the request body. The message starts with the field name.
@pytest.mark.parametrize(
    ("changes", "field"),
    [
        ({"project_name": None}, "project_name"),
        ({"project_name": "   "}, "project_name"),
        ({"project_name": "x" * 151}, "project_name"),
        ({"closure_type": ""}, "closure_type"),
        ({"closure_type": "x" * 51}, "closure_type"),
        ({"start_date": "2026-13-01"}, "start_date"),
        ({"end_date": "next week"}, "end_date"),
    ],
)
def test_create_project_with_an_invalid_body_returns_422(client, sign_in, changes, field):
    user_id, headers = sign_in()
    body = {**PROJECT, **changes}
    body = {key: value for key, value in body.items() if value is not None}
    response = client.post("/projects", json=body, headers=headers)
    assert response.status_code == 422
    assert response.json()["detail"].startswith(f"{field}: ")
    assert count_projects(user_id) == 0


def test_projects_need_a_token(client):
    for response in (
        client.get("/projects"),
        client.post("/projects", json=PROJECT),
        client.patch("/projects/1", json={"project_status": "active"}),
    ):
        assert response.status_code == 401
        assert response.json() == {"detail": "Token is missing"}


@pytest.mark.parametrize("role", ["provider", "worker"])
def test_only_contractors_can_use_projects(client, sign_in, role):
    _, contractor = sign_in()
    project = create_project(client, contractor)
    # Demo provider 1 has the website tcmksa.com, so its accounts use @tcmksa.com.
    _, headers = sign_in(role=role, provider_id=1, domain="tcmksa.com")
    for response in (
        client.get("/projects", headers=headers),
        client.post("/projects", json=PROJECT, headers=headers),
        client.patch(f"/projects/{project['project_id']}", json={"project_status": "active"}, headers=headers),
    ):
        assert response.status_code == 403
        assert response.json() == {"detail": "Only contractors can use the projects endpoints"}


def test_list_returns_only_my_projects_newest_first(client, sign_in):
    _, headers = sign_in()
    _, other = sign_in()
    first = create_project(client, headers, project_name="First project")
    second = create_project(client, headers, project_name="Second project")
    create_project(client, other, project_name="Another contractor's project")

    response = client.get("/projects", headers=headers)
    assert response.status_code == 200
    projects = response.json()
    assert [project["project_id"] for project in projects] == [second["project_id"], first["project_id"]]
    assert all(list(project) == PROJECT_FIELDS for project in projects)
    assert len(client.get("/projects", headers=other).json()) == 1


def test_list_without_projects_returns_an_empty_list(client, sign_in):
    _, headers = sign_in()
    response = client.get("/projects", headers=headers)
    assert response.status_code == 200
    assert response.json() == []


def test_list_filters_by_project_status(client, sign_in):
    _, headers = sign_in()
    draft = create_project(client, headers)
    active = create_project(client, headers)
    client.patch(f"/projects/{active['project_id']}", json={"project_status": "active"}, headers=headers)

    def ids(status):
        response = client.get(f"/projects?project_status={status}", headers=headers)
        assert response.status_code == 200
        return [project["project_id"] for project in response.json()]

    assert ids("active") == [active["project_id"]]
    assert ids("draft") == [draft["project_id"]]
    assert ids("completed") == []
    response = client.get("/projects?project_status=open", headers=headers)
    assert response.status_code == 422
    assert response.json()["detail"].startswith("project_status: ")


def test_patch_changes_only_the_sent_fields(client, sign_in):
    user_id, headers = sign_in()
    project = create_project(client, headers)
    url = f"/projects/{project['project_id']}"

    response = client.patch(url, json={"project_status": "active"}, headers=headers)
    assert response.status_code == 200
    assert response.json() == {**project, "project_status": "active"}

    changes = {"project_name": "King Fahd Road Phase 2", "closure_type": "full_closure", "end_date": "2027-01-10"}
    assert client.patch(url, json=changes, headers=headers).json() == {**project, "project_status": "active", **changes}

    # description can be removed with null. Fields that are not in Stage 3 are ignored.
    response = client.patch(url, json={"description": None, "contractor_id": 999, "project_id": 5}, headers=headers)
    assert response.json()["description"] is None
    assert response.json()["contractor_id"] == user_id
    assert response.json()["project_id"] == project["project_id"]


def test_patch_moves_the_status_between_the_four_statuses(client, sign_in):
    _, headers = sign_in()
    project = create_project(client, headers)
    for status in PROJECT_STATUSES:
        response = client.patch(f"/projects/{project['project_id']}", json={"project_status": status}, headers=headers)
        assert response.status_code == 200
        assert response.json()["project_status"] == status


@pytest.mark.parametrize(
    ("body", "detail"),
    [
        ({"project_status": "open"}, "project_status: "),
        ({"project_status": "Active"}, "project_status: "),
        ({"project_name": None}, "project_name: cannot be null"),
        ({"start_date": None}, "start_date: cannot be null"),
        ({"project_name": ""}, "project_name: "),
        ({}, "Send at least one of: "),
        ({"unknown_field": 1}, "Send at least one of: "),
    ],
)
def test_patch_with_invalid_data_returns_422(client, sign_in, body, detail):
    _, headers = sign_in()
    project = create_project(client, headers)
    response = client.patch(f"/projects/{project['project_id']}", json=body, headers=headers)
    assert response.status_code == 422
    assert response.json()["detail"].startswith(detail)
    # Nothing changed.
    assert client.get("/projects", headers=headers).json() == [project]


def test_patch_checks_the_dates_together(client, sign_in):
    _, headers = sign_in()
    project = create_project(client, headers)  # 2026-11-01 to 2026-12-15
    url = f"/projects/{project['project_id']}"
    for body in ({"end_date": "2026-10-31"}, {"start_date": "2026-12-16"}, {"start_date": "2027-01-02", "end_date": "2027-01-01"}):
        response = client.patch(url, json=body, headers=headers)
        assert response.status_code == 422
        assert response.json() == {"detail": "end_date: cannot be before start_date"}
    response = client.patch(url, json={"start_date": "2026-12-20", "end_date": "2027-01-05"}, headers=headers)
    assert response.status_code == 200
    assert (response.json()["start_date"], response.json()["end_date"]) == ("2026-12-20", "2027-01-05")


def test_patch_a_project_of_another_contractor_returns_403(client, sign_in):
    _, owner = sign_in()
    _, other = sign_in()
    project = create_project(client, owner)
    response = client.patch(f"/projects/{project['project_id']}", json={"project_status": "cancelled"}, headers=other)
    assert response.status_code == 403
    assert response.json() == {"detail": "This project belongs to another contractor"}
    assert client.get("/projects", headers=owner).json()[0]["project_status"] == "draft"


def test_patch_an_unknown_project_returns_404(client, sign_in):
    _, headers = sign_in()
    with SessionLocal() as db:
        unknown_id = (db.scalar(select(func.max(Project.project_id))) or 0) + 1000
    response = client.patch(f"/projects/{unknown_id}", json={"project_status": "active"}, headers=headers)
    assert response.status_code == 404
    assert response.json() == {"detail": "Project not found"}


def test_update_status_accepts_only_the_four_statuses():
    project = Project(project_status="draft")
    project.update_status("active")
    assert project.project_status == "active"
    with pytest.raises(ValueError):
        project.update_status("open")
    assert project.project_status == "active"


def test_frontend_can_send_a_patch_with_the_token(client):
    response = client.options(
        "/projects/1",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "PATCH",
            "Access-Control-Request-Headers": "Authorization, Content-Type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert "PATCH" in response.headers["access-control-allow-methods"]


# The five project types of the Create Project form (frontend/src/pages/CreateProjectPage.jsx).
FORM_PROJECT_TYPES = [
    "Infrastructure",
    "Road Maintenance",
    "Construction",
    "Utility Work",
    "Event Traffic Control",
]


def form_to_body(form):
    # The same mapping as the frontend: name, type, startDate, endDate, description.
    return {
        "project_name": form["name"],
        "closure_type": form["type"],
        "start_date": form["startDate"],
        "end_date": form["endDate"],
        "description": form["description"],
    }


@pytest.mark.parametrize("project_type", FORM_PROJECT_TYPES)
def test_create_project_form_is_saved_and_listed(client, sign_in, project_type):
    # Issue #28: the Create Project form is saved in PostgreSQL for the signed-in
    # contractor, returns a project_id, and GET /projects returns it.
    user_id, headers = sign_in()
    form = {
        "name": "  King Fahd Road – Water Line  ",
        "type": project_type,
        "startDate": "2026-11-01",
        "endDate": "2026-11-20",
        "description": "Water line work on the right lane",
    }
    response = client.post("/projects", json=form_to_body(form), headers=headers)
    assert response.status_code == 201
    project = response.json()
    assert isinstance(project["project_id"], int) and project["project_id"] > 0
    assert project["project_name"] == "King Fahd Road – Water Line"
    assert project["closure_type"] == project_type

    with SessionLocal() as db:
        saved = db.get(Project, project["project_id"])
        assert saved.contractor_id == user_id
        assert saved.project_name == "King Fahd Road – Water Line"
        assert saved.closure_type == project_type
        assert str(saved.start_date) == "2026-11-01"
        assert str(saved.end_date) == "2026-11-20"
        assert saved.description == "Water line work on the right lane"
        assert saved.project_status == "draft"

    listed = client.get("/projects", headers=headers).json()
    assert listed[0] == project


def test_going_back_to_step_1_updates_the_same_project(client, sign_in):
    # When the contractor goes back to Project Details, the frontend sends PATCH with the
    # saved project_id, so no second project is created.
    user_id, headers = sign_in()
    project = create_project(client, headers)
    changes = {"project_name": "King Fahd Road – Phase 2", "closure_type": "Utility Work"}
    response = client.patch(f"/projects/{project['project_id']}", json=changes, headers=headers)
    assert response.status_code == 200
    assert response.json()["project_id"] == project["project_id"]
    assert count_projects(user_id) == 1
    assert client.get("/projects", headers=headers).json()[0]["project_name"] == "King Fahd Road – Phase 2"


@pytest.mark.parametrize("method", ["POST", "GET"])
def test_frontend_can_create_and_list_projects_with_the_token(client, method):
    # The browser asks first (CORS preflight) because the request has the Authorization header.
    response = client.options(
        "/projects",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": method,
            "Access-Control-Request-Headers": "Authorization, Content-Type",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert method in response.headers["access-control-allow-methods"]
    assert "authorization" in response.headers["access-control-allow-headers"].lower()
