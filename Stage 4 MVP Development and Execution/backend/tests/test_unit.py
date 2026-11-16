# Unit tests: one function at a time, no database, no server, no internet.
# Run only these with:  python -m pytest -m unit -v
import pytest
from fastapi import HTTPException

from app.core import arcgis, traffic, ttc_plan, weather
from app.routers import attendance, devices

pytestmark = pytest.mark.unit

OLAYA_ZONE = [[46.6790, 24.6990], [46.6810, 24.6990], [46.6810, 24.7010], [46.6790, 24.7010]]


def test_distance_between_two_points():
    # 0.001 degree of latitude is about 111 m.
    assert arcgis.distance_m(24.7, 46.68, 24.7, 46.68) == 0
    assert 110 <= arcgis.distance_m(24.700, 46.68, 24.701, 46.68) <= 112


@pytest.mark.parametrize("current, free, closed, level", [
    (72, 80, False, "Light"),      # 10% slower
    (50, 80, False, "Moderate"),   # 38% slower
    (20, 80, False, "Heavy"),      # 75% slower
    (0, 80, True, "Closed"),
    (None, 80, False, "Unknown"),
])
def test_traffic_level(current, free, closed, level):
    assert traffic.level_for(current, free, closed)[0] == level


def test_taper_length_uses_the_right_formula():
    # 3.6 m lane: W x S x 0.62 at 80 km/h, W x S^2 / 155 at 50 km/h.
    assert ttc_plan.taper_length(80, 3.6) == 179
    assert ttc_plan.taper_length(50, 3.6) == 59


@pytest.mark.parametrize("code, text", [(0, "Clear"), (63, "Rain"), (95, "Thunderstorm"), (None, "Unknown")])
def test_weather_code_to_text(code, text):
    assert weather.describe(code) == text


def test_weather_alerts():
    assert weather.alerts_for(30, 0, 10) == []
    assert len(weather.alerts_for(47, 5, 60)) == 3


def test_site_code_is_stable_and_different_per_project():
    assert attendance.site_code(7) == attendance.site_code(7)
    assert attendance.site_code(7) != attendance.site_code(8)
    assert len(attendance.site_code(7)) == 10


def test_point_inside_the_work_zone():
    assert attendance.inside((24.7000, 46.6800), OLAYA_ZONE)
    assert not attendance.inside((24.7100, 46.6800), OLAYA_ZONE)


def test_device_code_is_cleaned():
    assert devices.clean_code(" tc-014 ") == "TC-014"
    with pytest.raises(HTTPException):
        devices.clean_code("TC 014; DROP")
