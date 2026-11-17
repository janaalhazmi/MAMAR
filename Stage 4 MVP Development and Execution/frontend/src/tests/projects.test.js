import { describe, it, expect } from "vitest";
import { zoneToPoints, thumbTone, getStats, buildActivity, getProjectMeta, STATUS_FILTERS } from "../services/projects";

describe("project helpers", () => {
  it("returns null for missing or malformed work zones", () => {
    expect(zoneToPoints(null)).toBeNull();
    expect(zoneToPoints({ rings: [] })).toBeNull();
    expect(zoneToPoints({ rings: [[["bad", 1]]] })).toBeNull();
  });
  it("keeps valid WGS84 points as longitude/latitude pairs", () => {
    expect(zoneToPoints({ rings: [[[46.6, 24.7], [46.7, 24.8], [46.8, 24.9]]] })).toEqual([
      [46.6, 24.7], [46.7, 24.8], [46.8, 24.9],
    ]);
  });
  it("converts Web Mercator coordinates to geographic coordinates", () => {
    const points = zoneToPoints({ spatialReference: { wkid: 3857 }, rings: [
      [[5190000, 2860000], [5191000, 2860000], [5190000, 2861000]],
    ] });
    expect(points).toHaveLength(3);
    expect(points[0][0]).toBeGreaterThan(40);
    expect(points[0][0]).toBeLessThan(50);
    expect(points[0][1]).toBeGreaterThan(20);
    expect(points[0][1]).toBeLessThan(30);
  });
  it("assigns thumbnail tones based on status tone", () => {
    expect(thumbTone({ statusTone: "completed" })).toBe("green");
    expect(thumbTone({ statusTone: "planned" })).toBe("grey");
    expect(thumbTone({ statusTone: "cancelled" })).toBe("grey");
    expect(thumbTone({ statusTone: "pending" })).toBe("orange");
  });
  it("calculates project statistics", () => {
    expect(getStats([
      { statusLabel: "In Progress" }, { statusLabel: "Completed" },
      { statusLabel: "Pending Quotes" }, { statusLabel: "In Progress" },
    ])).toEqual({ total: 4, inProgress: 2, completed: 1, pendingQuotes: 1 });
  });
  it("builds newest-first activity and respects its limit", () => {
    const activity = buildActivity([
      { id: 1, name: "Old", createdAt: "2026-01-01T00:00:00Z" },
      { id: 2, name: "New", createdAt: "2026-02-01T00:00:00Z" },
    ], 1);
    expect(activity).toHaveLength(1);
    expect(activity[0]).toMatchObject({ id: "created-2", title: "Project created", text: "New" });
  });
  it("reads project metadata and status filters", () => {
    localStorage.setItem("mamarProjectMeta", JSON.stringify({ 12: { location: "Riyadh" } }));
    expect(getProjectMeta(12)).toEqual({ location: "Riyadh" });
    expect(STATUS_FILTERS).toContain("Completed");
  });
});

