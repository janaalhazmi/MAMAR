import { describe, it, expect, vi } from "vitest";
import {
  formatDistance, distanceInMeters, getPlannedLocation, MAX_DISTANCE_METERS,
  SITE_STATUSES, captureCurrentLocation,
} from "../fieldWork";

describe("field worker helpers", () => {
  it("formats distances in metres and kilometres", () => {
    expect(formatDistance(null)).toBe("–");
    expect(formatDistance(49.6)).toBe("50 m");
    expect(formatDistance(1500)).toBe("1.5 km");
  });
  it("calculates zero distance for identical coordinates", () => {
    expect(distanceInMeters(
      { latitude: 24.7136, longitude: 46.6753 },
      { latitude: 24.7136, longitude: 46.6753 },
    )).toBe(0);
  });
  it("calculates a positive distance between different coordinates", () => {
    expect(distanceInMeters(
      { latitude: 24.7136, longitude: 46.6753 },
      { latitude: 24.7146, longitude: 46.6753 },
    )).toBeGreaterThan(100);
  });
  it("returns null when project location is missing", () => {
    expect(getPlannedLocation(1, null)).toBeNull();
    expect(getPlannedLocation(1, {})).toBeNull();
  });
  it("normalizes coordinates and work zone", () => {
    expect(getPlannedLocation(1, {
      latitude: "24.7", longitude: "46.6", work_zone: { rings: [] },
    })).toEqual({ latitude: 24.7, longitude: 46.6, workZone: { rings: [] } });
  });
  it("keeps work-zone-only projects usable", () => {
    expect(getPlannedLocation(1, { work_zone: { rings: [] } })).toEqual({
      latitude: null, longitude: null, workZone: { rings: [] },
    });
  });
  it("exposes the backend geofence and supported statuses", () => {
    expect(MAX_DISTANCE_METERS).toBe(50);
    expect(SITE_STATUSES).toEqual(["Not Started", "Work in Progress", "Paused", "Completed"]);
  });
  it("rejects location capture when geolocation is unavailable", async () => {
    const original = navigator.geolocation;
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: undefined });
    await expect(captureCurrentLocation(null)).rejects.toThrow("does not support location services");
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: original });
  });
  it("translates geolocation permission errors", async () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition: (_ok, fail) => fail({ code: 1 }) },
    });
    await expect(captureCurrentLocation(null)).rejects.toThrow("permission was denied");
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: undefined });
  });
});

