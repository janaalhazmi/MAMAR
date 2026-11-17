import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchMyProfile, updateMyProfile, changeMyPassword, uploadMyProfilePicture, deleteMyProfilePicture } from "../services/Contractor/profileService";
import { authed } from "../services/api";
import { getSession } from "../services/auth";

vi.mock("../services/auth", () => ({ getSession: vi.fn(() => ({ access_token: "test-token" })) }));
vi.mock("../services/api", () => ({
  authed: vi.fn(() => Promise.resolve({ ok: true })),
  JSON_H: { "Content-Type": "application/json" },
  asJson: (value) => JSON.stringify(value),
}));

describe("contractor profile service", () => {
  beforeEach(() => { vi.clearAllMocks(); getSession.mockReturnValue({ access_token: "test-token" }); });
  it("fetches the current profile", async () => {
    await fetchMyProfile();
    expect(authed).toHaveBeenCalledWith("/auth/me", "test-token");
  });
  it("updates profile fields with PATCH", async () => {
    const profile = { full_name: "Jana", phone: "0500000000" };
    await updateMyProfile(profile);
    expect(authed).toHaveBeenCalledWith("/auth/me", "test-token", expect.objectContaining({
      method: "PATCH", body: JSON.stringify(profile),
    }));
  });
  it("changes password using the expected backend fields", async () => {
    await changeMyPassword("old", "new");
    expect(authed).toHaveBeenCalledWith("/auth/change-password", "test-token", expect.objectContaining({
      method: "POST", body: JSON.stringify({ current_password: "old", new_password: "new" }),
    }));
  });
  it("uploads the avatar as multipart form data", async () => {
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    await uploadMyProfilePicture(file);
    const options = authed.mock.calls[0][2];
    expect(options.method).toBe("POST");
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get("file")).toBe(file);
  });
  it("deletes the current avatar", async () => {
    await deleteMyProfilePicture();
    expect(authed).toHaveBeenCalledWith("/auth/me/avatar", "test-token", { method: "DELETE" });
  });
  it("rejects unauthenticated profile requests", async () => {
    getSession.mockReturnValue(null);
    await expect(fetchMyProfile()).rejects.toThrow("Please sign in");
  });
});

