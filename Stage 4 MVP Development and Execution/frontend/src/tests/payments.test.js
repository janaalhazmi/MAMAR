import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCompletedPayment, readPendingPayment, clearPendingPayment, finishPayment } from "../services/Contractor/payments";
import { getSession } from "../services/auth";
import { fetchProjectPayments, postCancelPayment, postCapturePayment } from "../services/api";

vi.mock("../services/auth", () => ({ getSession: vi.fn(() => ({ access_token: "token-1" })) }));
vi.mock("../services/api", () => ({
  fetchProjectPayments: vi.fn(async () => [{ id: 1, status: "pending" }, { id: 2, status: "completed" }]),
  postCancelPayment: vi.fn(async () => ({ cancelled: true })),
  postCapturePayment: vi.fn(async () => ({ captured: true })),
  postStartPayment: vi.fn(),
}));

describe("contractor payment helpers", () => {
  beforeEach(() => { vi.clearAllMocks(); getSession.mockReturnValue({ access_token: "token-1" }); sessionStorage.clear(); });
  it("returns null when no project ID is provided", async () => {
    await expect(getCompletedPayment()).resolves.toBeNull();
    expect(fetchProjectPayments).not.toHaveBeenCalled();
  });
  it("selects the completed payment", async () => {
    await expect(getCompletedPayment(44)).resolves.toEqual({ id: 2, status: "completed" });
    expect(fetchProjectPayments).toHaveBeenCalledWith("token-1", 44);
  });
  it("reads pending payment details from session storage", () => {
    sessionStorage.setItem("mamarPendingPayment", JSON.stringify({ project: { id: 3 }, quotation: { id: 5 } }));
    expect(readPendingPayment()).toEqual({ project: { id: 3 }, quotation: { id: 5 } });
  });
  it("returns null for malformed pending payment data", () => {
    sessionStorage.setItem("mamarPendingPayment", "{bad");
    expect(readPendingPayment()).toBeNull();
  });
  it("clears pending payment details", () => {
    sessionStorage.setItem("mamarPendingPayment", "{}");
    clearPendingPayment();
    expect(sessionStorage.getItem("mamarPendingPayment")).toBeNull();
  });
  it("captures an order when payment is not cancelled", async () => {
    await finishPayment("ORDER-1", false);
    expect(postCapturePayment).toHaveBeenCalledWith("token-1", "ORDER-1");
  });
  it("cancels an order when payment is cancelled", async () => {
    await finishPayment("ORDER-2", true);
    expect(postCancelPayment).toHaveBeenCalledWith("token-1", "ORDER-2");
  });
  it("requires a signed-in user to finish payment", async () => {
    getSession.mockReturnValue(null);
    await expect(finishPayment("ORDER-3", false)).rejects.toThrow("Please sign in");
  });
});

