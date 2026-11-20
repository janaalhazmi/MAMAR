from tests.test_provider import confirmed_project
from tests.test_workflow import active_project_with_worker


def test_confirmed_project_has_three_milestones(api):
    _, provider = api.account("provider", 1)
    project_id, _ = confirmed_project(api, provider)

    response = api.client.get(
        f"/provider/projects/{project_id}/milestones",
        headers=provider,
    )

    assert response.status_code == 200
    milestones = response.json()

    assert len(milestones) == 3
    assert [item["name"] for item in milestones] == [
        "Site Preparation",
        "Traffic Control Installation",
        "Final Site Check",
    ]
    assert all(item["status"] == "pending" for item in milestones)


def test_getting_milestones_does_not_duplicate_them(api):
    _, provider = api.account("provider", 1)
    project_id, _ = confirmed_project(api, provider)
    url = f"/provider/projects/{project_id}/milestones"

    first = api.client.get(url, headers=provider)
    second = api.client.get(url, headers=provider)

    assert first.status_code == 200
    assert second.status_code == 200
    assert len(first.json()) == 3
    assert [item["milestone_id"] for item in first.json()] == [
        item["milestone_id"] for item in second.json()
    ]


def test_provider_can_update_milestone_to_in_progress(api):
    _, provider = api.account("provider", 1)
    project_id, _ = confirmed_project(api, provider)
    milestones = api.client.get(
        f"/provider/projects/{project_id}/milestones",
        headers=provider,
    ).json()

    response = api.client.patch(
        f"/provider/projects/{project_id}/milestones/{milestones[0]['milestone_id']}",
        json={"status": "in_progress"},
        headers=provider,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "in_progress"


def test_provider_can_complete_a_milestone(api):
    _, provider = api.account("provider", 1)
    project_id, _ = confirmed_project(api, provider)
    milestones = api.client.get(
        f"/provider/projects/{project_id}/milestones",
        headers=provider,
    ).json()

    response = api.client.patch(
        f"/provider/projects/{project_id}/milestones/{milestones[0]['milestone_id']}",
        json={"status": "completed"},
        headers=provider,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "completed"
    assert response.json()["updated_at"] is not None


def test_invalid_milestone_status_is_rejected(api):
    _, provider = api.account("provider", 1)
    project_id, _ = confirmed_project(api, provider)
    milestones = api.client.get(
        f"/provider/projects/{project_id}/milestones",
        headers=provider,
    ).json()

    response = api.client.patch(
        f"/provider/projects/{project_id}/milestones/{milestones[0]['milestone_id']}",
        json={"status": "invalid"},
        headers=provider,
    )

    assert response.status_code == 422


def test_other_provider_cannot_access_milestones(api):
    _, provider = api.account("provider", 1)
    _, other_provider = api.account("provider", 2)
    project_id, _ = confirmed_project(api, provider)

    response = api.client.get(
        f"/provider/projects/{project_id}/milestones",
        headers=other_provider,
    )

    assert response.status_code == 403


def test_non_provider_cannot_access_milestones(api):
    _, provider = api.account("provider", 1)
    project_id, contractor = confirmed_project(api, provider)

    response = api.client.get(
        f"/provider/projects/{project_id}/milestones",
        headers=contractor,
    )

    assert response.status_code == 403


def test_provider_cannot_update_milestone_after_submission(api):
    project_id, _, provider, worker = active_project_with_worker(api)
    milestones = api.client.get(
        f"/provider/projects/{project_id}/milestones",
        headers=provider,
    ).json()

    status_response = api.client.patch(
        f"/field-worker/projects/{project_id}/status",
        json={"status": "Completed"},
        headers=worker,
    )
    assert status_response.status_code == 200

    submitted = api.client.post(
        f"/provider/projects/{project_id}/submit-completion",
        headers=provider,
    )
    assert submitted.status_code == 200

    response = api.client.patch(
        f"/provider/projects/{project_id}/milestones/{milestones[0]['milestone_id']}",
        json={"status": "completed"},
        headers=provider,
    )

    assert response.status_code == 400
