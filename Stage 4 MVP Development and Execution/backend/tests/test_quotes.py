import pytest

from tests.conftest import QUOTE

# The fields of one quote in Stage 3, section 4.2.10, in the same order.
QUOTE_FIELDS = ["quote_id", "request_id", "provider_id", "price", "duration_days", "notes", "status", "created_at"]


def test_provider_submits_a_quote(api):
    _, contractor = api.account()
    _, provider = api.account("provider", 3)
    request = api.request(contractor, api.project(contractor))
    response = api.client.post(f"/requests/{request['request_id']}/quotes", json=QUOTE, headers=provider)
    assert response.status_code == 201
    quote = response.json()
    assert list(quote) == QUOTE_FIELDS
    # provider_id comes from the token, and the price is a number in JSON.
    assert (quote["request_id"], quote["provider_id"], quote["status"]) == (request["request_id"], 3, "pending")
    assert quote["price"] == 18500.0 and quote["duration_days"] == 5 and quote["notes"] == QUOTE["notes"]


def test_a_worker_of_the_provider_cannot_send_a_quote_and_provider_id_is_not_taken_from_the_body(api):
    _, contractor = api.account()
    _, worker = api.account("worker", 1)
    _, provider = api.account("provider", 1)
    request_id = api.request(contractor, api.project(contractor))["request_id"]
    response = api.client.post(f"/requests/{request_id}/quotes", json=QUOTE, headers=worker)
    assert (response.status_code, response.json()) == (403, {"detail": "Only providers can submit quotes"})
    assert api.client.post(f"/requests/{request_id}/quotes", json=QUOTE, headers=contractor).status_code == 403
    assert api.quote(provider, request_id, provider_id=2)["provider_id"] == 1


def test_one_quote_per_company(api):
    _, contractor = api.account()
    _, first_employee = api.account("provider", 1)
    _, second_employee = api.account("provider", 1)
    request_id = api.request(contractor, api.project(contractor))["request_id"]
    api.quote(first_employee, request_id)
    response = api.client.post(f"/requests/{request_id}/quotes", json=QUOTE, headers=second_employee)
    assert (response.status_code, response.json()) == (409, {"detail": "Your company already sent a quote for this request"})


def test_quote_rules(api):
    _, contractor = api.account()
    _, provider = api.account("provider", 1)
    _, late_provider = api.account("provider", 2)
    request_id = api.request(contractor, api.project(contractor))["request_id"]
    assert api.client.post(f"/requests/{request_id}/quotes", json=QUOTE).status_code == 401
    response = api.client.post("/requests/999999999/quotes", json=QUOTE, headers=provider)
    assert (response.status_code, response.json()) == (404, {"detail": "Request not found"})
    quote = api.quote(provider, request_id)
    api.award(contractor, request_id, quote["quote_id"])
    response = api.client.post(f"/requests/{request_id}/quotes", json=QUOTE, headers=late_provider)
    assert (response.status_code, response.json()) == (400, {"detail": "The request is awarded, quotes are only sent to open requests"})


@pytest.mark.parametrize(
    ("changes", "field"),
    [({"price": 0}, "price"), ({"price": -5}, "price"), ({"price": 100.555}, "price"), ({"price": 12345678901.5}, "price"),
     ({"price": None}, "price"), ({"duration_days": 0}, "duration_days"), ({"duration_days": "five"}, "duration_days")],
)
def test_quote_with_an_invalid_body_returns_422(api, changes, field):
    _, contractor = api.account()
    _, provider = api.account("provider", 1)
    request_id = api.request(contractor, api.project(contractor))["request_id"]
    response = api.client.post(f"/requests/{request_id}/quotes", json={**QUOTE, **changes}, headers=provider)
    assert response.status_code == 422
    assert response.json()["detail"].startswith(f"{field}: ")


def test_who_sees_the_quotes(api):
    _, owner = api.account()
    _, other_contractor = api.account()
    _, tcm = api.account("provider", 1)
    _, shawahid = api.account("provider", 3)
    _, worker = api.account("worker", 1)
    request_id = api.request(owner, api.project(owner))["request_id"]
    expensive = api.quote(tcm, request_id, price=30000)
    cheap = api.quote(shawahid, request_id, price=12000, notes="")
    assert cheap["notes"] is None
    url = f"/requests/{request_id}/quotes"
    # The contractor sees all the quotes, cheapest first.
    assert [q["quote_id"] for q in api.client.get(url, headers=owner).json()] == [cheap["quote_id"], expensive["quote_id"]]
    # A provider sees only their own quote.
    assert [q["quote_id"] for q in api.client.get(url, headers=tcm).json()] == [expensive["quote_id"]]
    response = api.client.get(url, headers=other_contractor)
    assert (response.status_code, response.json()) == (403, {"detail": "This request belongs to another contractor"})
    assert api.client.get(url, headers=worker).status_code == 403
    assert api.client.get("/requests/999999999/quotes", headers=owner).status_code == 404
