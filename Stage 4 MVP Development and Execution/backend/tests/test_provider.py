from datetime import date, timedelta

from tests.conftest import REQUEST
from tests.test_workflow import PNG, active_project_with_worker, project_with_request, send_quotation

# The fields of each provider page, in the same order as the response.
PROVIDER_REQUEST_FIELDS = [
    "request_id", "project_id", "title", "details", "required_by", "status", "created_at", "provider_ids",
    "project", "quoted", "my_quote",
]
PROVIDER_PROJECT_FIELDS = [
    "project", "status", "site_status", "progress", "field_team_count", "last_check_in",
    "completion_submitted", "quote",
]
DETAIL_FIELDS = PROVIDER_PROJECT_FIELDS + ["submitted_at", "change_note", "team", "photos"]

EMPTY_DASHBOARD = {
    "stats": {"assigned": 0, "active": 0, "upcoming": 0, "completed": 0},
    "pending_quotes": 0,
    "new_requests": [],
    "next_project": None,
    "active_projects": [],
    "overview": {"workers_active": 0, "sites_active": 0, "field_workers": 0},
}


def future(days):
    return (date.today() + timedelta(days=days)).isoformat()


def confirmed_project(api, provider, provider_id=1, **project):
    # A contractor's project whose quote from this provider was confirmed.
    project_id, contractor = project_with_request(api, **project)
    quote = send_quotation(api, provider, project_id).json()
    assert api.client.post(
        f"/projects/{project_id}/confirm-provider", json={"quote_id": quote["quote_id"]}, headers=contractor
    ).status_code == 200
    return project_id, contractor


def test_provider_pages_need_a_provider_token(api):
    _, contractor = api.account()
    _, worker = api.account("worker", 1)
    for path in ("/provider/requests", "/provider/projects", "/provider/projects/1", "/provider/dashboard"):
        assert api.client.get(path).status_code == 401
        for headers in (contractor, worker):
            response = api.client.get(path, headers=headers)
            assert (response.status_code, response.json()) == (403, {"detail": "Only providers can view this page"})


def test_new_provider_gets_empty_lists_and_zeros(api):
    # A company with no accounts of its own yet (provider 3) so the counts are its own.
    _, provider = api.account("provider", 3)
    assert api.client.get("/provider/projects", headers=provider).json() == []
    dashboard = api.client.get("/provider/dashboard", headers=provider).json()
    # Other tests may leave open requests for every provider, so only the projects are checked as empty.
    assert dashboard["stats"] == EMPTY_DASHBOARD["stats"]
    assert dashboard["next_project"] is None
    assert dashboard["active_projects"] == []
    assert dashboard["overview"]["workers_active"] == 0
    assert dashboard["overview"]["sites_active"] == 0


def test_provider_requests_have_the_project_and_the_quoted_flag(api):
    _, provider = api.account("provider", 1)
    project_id, _ = project_with_request(api, services=["road-signs"])
    mine = lambda rows: [row for row in rows if row["project_id"] == project_id]  # noqa: E731

    rows = mine(api.client.get("/provider/requests", headers=provider).json())
    assert len(rows) == 1 and list(rows[0]) == PROVIDER_REQUEST_FIELDS
    assert rows[0]["project"]["project_id"] == project_id
    assert rows[0]["project"]["services"] == ["road-signs"]
    assert (rows[0]["quoted"], rows[0]["my_quote"]) == (False, None)

    quote = send_quotation(api, provider, project_id).json()
    rows = mine(api.client.get("/provider/requests", headers=provider).json())
    assert rows[0]["quoted"] is True and rows[0]["my_quote"]["quote_id"] == quote["quote_id"]
    assert mine(api.client.get("/provider/requests?quoted=false", headers=provider).json()) == []
    assert len(mine(api.client.get("/provider/requests?quoted=true", headers=provider).json())) == 1


def test_provider_requests_follow_the_invitation(api):
    _, contractor = api.account()
    _, invited = api.account("provider", 1)
    _, other = api.account("provider", 2)
    response = api.client.post("/projects", json={"project_name": "Olaya Street", "closure_type": "lane_closure",
                                                  "start_date": future(5), "end_date": future(9)}, headers=contractor)
    project_id = response.json()["project_id"]
    api.request(contractor, project_id, provider_ids=[1])
    ids = lambda headers: [r["project_id"] for r in api.client.get("/provider/requests", headers=headers).json()]  # noqa: E731
    assert project_id in ids(invited)
    assert project_id not in ids(other)
    # The company that was not invited cannot quote or open the project.
    response = send_quotation(api, other, project_id)
    assert (response.status_code, response.json()) == (403, {"detail": "The contractor did not invite your company to this project"})
    assert api.client.get(f"/projects/{project_id}", headers=other).status_code == 403
    assert send_quotation(api, invited, project_id).status_code == 201


def test_provider_projects_have_progress_and_tabs(api):
    _, provider = api.account("provider", 2)
    _, other = api.account("provider", 3)
    # Started on 2026-11-01 (conftest PROJECT): Active. Starts later: Upcoming.
    active_id, _ = confirmed_project(api, provider, 2)
    upcoming_id, _ = confirmed_project(api, provider, 2, start_date=future(10), end_date=future(20))

    projects = api.client.get("/provider/projects", headers=provider).json()
    by_id = {row["project"]["project_id"]: row for row in projects}
    assert {active_id, upcoming_id} <= set(by_id)
    assert list(by_id[active_id]) == PROVIDER_PROJECT_FIELDS
    assert (by_id[active_id]["status"], by_id[active_id]["progress"]) == ("Active", 0)
    assert by_id[upcoming_id]["status"] == "Upcoming"
    assert by_id[active_id]["quote"]["status"] == "accepted"

    tab = api.client.get("/provider/projects?status=Upcoming", headers=provider).json()
    assert upcoming_id in [row["project"]["project_id"] for row in tab]
    assert active_id not in [row["project"]["project_id"] for row in tab]
    assert api.client.get("/provider/projects?status=Other", headers=provider).status_code == 422

    # Another company does not see these projects.
    other_ids = [row["project"]["project_id"] for row in api.client.get("/provider/projects", headers=other).json()]
    assert active_id not in other_ids and upcoming_id not in other_ids


def test_provider_project_detail_has_the_team_and_photos(api):
    project_id, contractor, provider, worker = active_project_with_worker(api)
    api.client.post(f"/field-worker/projects/{project_id}/check-in", headers=worker)
    api.client.post(
        f"/field-worker/projects/{project_id}/photos",
        files=[("photos", ("zone.png", PNG, "image/png"))],
        data={"captions": "Work zone setup"},
        headers=worker,
    )
    response = api.client.get(f"/provider/projects/{project_id}", headers=provider)
    assert response.status_code == 200
    detail = response.json()
    assert list(detail) == DETAIL_FIELDS
    assert (detail["status"], detail["site_status"], detail["progress"]) == ("Active", "Work in Progress", 50)
    assert detail["field_team_count"] == 1 and len(detail["team"]) == 1
    assert detail["last_check_in"] is not None
    assert [photo["caption"] for photo in detail["photos"]] == ["Work zone setup"]

    # Completed by the worker, then approved by the contractor.
    api.client.patch(f"/field-worker/projects/{project_id}/status", json={"status": "Completed"}, headers=worker)
    assert api.client.get(f"/provider/projects/{project_id}", headers=provider).json()["completion_submitted"] is True
    api.client.post(f"/projects/{project_id}/complete", headers=contractor)
    detail = api.client.get(f"/provider/projects/{project_id}", headers=provider).json()
    assert (detail["status"], detail["progress"]) == ("Completed", 100)


def test_provider_project_detail_errors(api):
    project_id, _, _, _ = active_project_with_worker(api)
    _, other = api.account("provider", 2)
    response = api.client.get(f"/provider/projects/{project_id}", headers=other)
    assert (response.status_code, response.json()) == (403, {"detail": "Your company did not win this project"})
    assert api.client.get("/provider/projects/999999", headers=other).status_code == 404


def test_provider_dashboard_counts_its_own_data(api):
    _, provider = api.account("provider", 2)
    before = api.client.get("/provider/dashboard", headers=provider).json()

    # One new invited request, one quoted request, one active and one upcoming project.
    new_id, _ = project_with_request(api)
    quoted_id, _ = project_with_request(api)
    send_quotation(api, provider, quoted_id)
    active_id, _ = confirmed_project(api, provider, 2)
    upcoming_id, _ = confirmed_project(api, provider, 2, start_date=future(3), end_date=future(8))
    worker_id, _ = api.account("worker", 2)
    assert api.client.post(f"/projects/{active_id}/assignments", json={"worker_id": worker_id}, headers=provider).status_code == 201

    after = api.client.get("/provider/dashboard", headers=provider).json()
    assert list(after) == list(EMPTY_DASHBOARD)
    assert after["stats"]["assigned"] == before["stats"]["assigned"] + 2
    assert after["stats"]["active"] == before["stats"]["active"] + 1
    assert after["stats"]["upcoming"] == before["stats"]["upcoming"] + 1
    assert after["pending_quotes"] == before["pending_quotes"] + 1
    new_ids = [row["project_id"] for row in after["new_requests"]]
    assert new_id in new_ids and quoted_id not in new_ids
    assert active_id in [row["project"]["project_id"] for row in after["active_projects"]]
    assert after["next_project"] is not None and after["next_project"]["status"] == "Upcoming"
    assert after["overview"]["workers_active"] == before["overview"]["workers_active"] + 1
    assert after["overview"]["sites_active"] == after["stats"]["active"]
    assert after["overview"]["field_workers"] == before["overview"]["field_workers"] + 1


def test_awarded_request_leaves_the_new_requests(api):
    _, provider = api.account("provider", 1)
    project_id, contractor = project_with_request(api)
    quote = send_quotation(api, provider, project_id).json()
    api.client.post(f"/projects/{project_id}/confirm-provider", json={"quote_id": quote["quote_id"]}, headers=contractor)
    rows = api.client.get("/provider/requests", headers=provider).json()
    assert project_id not in [row["project_id"] for row in rows]
    won = api.client.get("/requests?status=awarded", headers=provider).json()
    assert project_id in [row["project_id"] for row in won]
    assert REQUEST["title"] in [row["title"] for row in won]
