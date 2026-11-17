import { describe, it, expect } from "vitest";
import {
  parseServerDate, formatDateTime, formatTime, absUrl, toUiPhoto,
  formatDate, formatDateRange, formatPrice, SERVICE_LABELS, KEYS,
  getCurrentProject, getSelectedProviderIds, getSelectedQuotationId,
} from "../services/projectFlow";
import { API_BASE_URL } from "../services/api";

describe("projectFlow formatters and storage helpers", () => {
  it("parses timestamps without timezone as UTC", () => {
    expect(parseServerDate("2026-01-15T10:30:00").toISOString()).toBe("2026-01-15T10:30:00.000Z");
  });
  it("preserves explicit timezone offsets", () => {
    expect(parseServerDate("2026-01-15T13:30:00+03:00").toISOString()).toBe("2026-01-15T10:30:00.000Z");
  });
  it("returns null for empty and invalid dates", () => {
    expect(parseServerDate("")).toBeNull();
    expect(parseServerDate("not-a-date")).toBeNull();
  });
  it("formats date/time safely", () => {
    expect(formatDateTime("not-a-date")).toBe("");
    expect(formatTime("not-a-date")).toBe("");
    expect(formatDateTime("2026-01-15T10:30:00Z")).toContain("15");
  });
  it("formats date and date range", () => {
    expect(formatDate("")).toBe("Not specified");
    expect(formatDate("not-a-date")).toBe("not-a-date");
    expect(formatDateRange("", "2026-01-16")).toBe("Not specified");
    expect(formatDateRange("2026-01-15", "2026-01-16")).toContain("–");
  });
  it("formats SAR amounts", () => {
    expect(formatPrice(1200)).toBe("SAR 1,200");
    expect(formatPrice(0)).toBe("SAR 0");
  });
  it("resolves absolute and relative image URLs", () => {
    expect(absUrl("https://cdn.example.com/a.jpg")).toBe("https://cdn.example.com/a.jpg");
    expect(absUrl("")).toBe("");
    expect(absUrl("/uploads/a.jpg")).toBe(`${API_BASE_URL}/uploads/a.jpg`);
  });
  it("normalizes a photo object", () => {
    expect(toUiPhoto({ photo_id: 4, url: "/a.jpg", created_at: "2026-01-15T10:30:00Z" })).toMatchObject({
      id: 4, src: `${API_BASE_URL}/a.jpg`, caption: "Site photo",
    });
  });
  it("exposes expected project service labels and keys", () => {
    expect(SERVICE_LABELS["ttc-plan"]).toContain("Temporary Traffic Control");
    expect(KEYS.project).toBe("mamarNewProject");
  });
  it("reads project draft and selected provider IDs from session storage", () => {
    sessionStorage.setItem(KEYS.project, JSON.stringify({ projectId: 22, name: "Road work" }));
    sessionStorage.setItem(KEYS.providerIds, JSON.stringify([1, 3]));
    sessionStorage.setItem(KEYS.quotationId, JSON.stringify(8));
    expect(getCurrentProject()).toMatchObject({ projectId: 22, name: "Road work" });
    expect(getSelectedProviderIds()).toEqual([1, 3]);
    expect(getSelectedQuotationId()).toBe(8);
  });
  it("handles malformed project storage safely", () => {
    sessionStorage.setItem(KEYS.project, "{broken");
    sessionStorage.setItem(KEYS.providerIds, "{broken");
    expect(getCurrentProject()).toMatchObject({ name: "", services: [], id: null });
    expect(getSelectedProviderIds()).toEqual([]);
  });
});

