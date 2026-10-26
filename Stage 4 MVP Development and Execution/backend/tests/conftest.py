import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, or_, select

from app.db.database import SessionLocal
from app.main import app
from app.models import Assignment, Project, Quote, ServiceRequest, User

# The examples from Stage 3, sections 4.2.6, 4.2.8 and 4.2.10.
PROJECT = {
    "project_name": "King Fahd Road Maintenance",
    "closure_type": "lane_closure",
    "start_date": "2026-11-01",
    "end_date": "2026-12-15",
}
REQUEST = {
    "title": "Lane closure signs and barriers",
    "details": "20 cones, 4 warning signs and 1 detour",
    "required_by": "2026-11-25",
}
QUOTE = {"price": 18500.00, "duration_days": 5, "notes": "Includes installation and removal"}

# The company email of the demo providers (see init_db.py).
DOMAINS = {None: "example.com", 1: "tcmksa.com", 2: "redanational.com", 3: "shawahidts.com"}


class Api:
    # Makes accounts, projects, requests and quotes through the API, and deletes them after the test.
    def __init__(self, client):
        self.client = client
        self.emails = []

    def account(self, role="contractor", provider_id=None):
        email = f"test-{uuid.uuid4().hex[:12]}@{DOMAINS[provider_id]}"
        self.emails.append(email)
        body = {"full_name": "Sara Ahmed", "email": email, "password": "StrongPass123", "role": role, "provider_id": provider_id}
        assert self.client.post("/auth/register", json=body).status_code == 201
        login = self.client.post("/auth/login", json={"email": email, "password": "StrongPass123"}).json()
        return login["user"]["user_id"], {"Authorization": f"Bearer {login['access_token']}"}

    def project(self, headers):
        response = self.client.post("/projects", json=PROJECT, headers=headers)
        assert response.status_code == 201
        return response.json()["project_id"]

    def request(self, headers, project_id, **changes):
        response = self.client.post(f"/projects/{project_id}/requests", json={**REQUEST, **changes}, headers=headers)
        assert response.status_code == 201
        return response.json()

    def quote(self, headers, request_id, **changes):
        response = self.client.post(f"/requests/{request_id}/quotes", json={**QUOTE, **changes}, headers=headers)
        assert response.status_code == 201
        return response.json()

    def award(self, headers, request_id, quote_id):
        return self.client.post(f"/requests/{request_id}/award", json={"quote_id": quote_id}, headers=headers)

    def won_project(self, provider_id=1):
        # A contractor's project whose request was awarded to a provider of provider_id.
        _, contractor = self.account()
        _, provider = self.account("provider", provider_id)
        project_id = self.project(contractor)
        request = self.request(contractor, project_id)
        quote = self.quote(provider, request["request_id"])
        assert self.award(contractor, request["request_id"], quote["quote_id"]).status_code == 200
        return project_id, contractor, provider

    def cleanup(self):
        with SessionLocal() as db:
            user_ids = select(User.user_id).where(User.email.in_(self.emails))
            project_ids = select(Project.project_id).where(Project.contractor_id.in_(user_ids))
            request_ids = select(ServiceRequest.request_id).where(ServiceRequest.project_id.in_(project_ids))
            db.execute(delete(Assignment).where(or_(Assignment.project_id.in_(project_ids), Assignment.worker_id.in_(user_ids))))
            db.execute(delete(Quote).where(Quote.request_id.in_(request_ids)))
            db.execute(delete(ServiceRequest).where(ServiceRequest.project_id.in_(project_ids)))
            db.execute(delete(Project).where(Project.contractor_id.in_(user_ids)))
            db.execute(delete(User).where(User.email.in_(self.emails)))
            db.commit()


@pytest.fixture
def api():
    with TestClient(app) as client:
        helper = Api(client)
        yield helper
        helper.cleanup()
