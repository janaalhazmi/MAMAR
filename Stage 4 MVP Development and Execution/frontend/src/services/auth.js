import { getCurrentUser } from "./api";

const KEY = "mamarSession";
const LAST_USER_KEY = "mamarLastUser";
const KEEP_KEYS = [LAST_USER_KEY, "mamarPendingRegistration"];

// The token that the backend already accepted.
let checkedToken = null;

export function logout() {
  localStorage.removeItem(KEY);
  localStorage.removeItem("mamarUsers");
  checkedToken = null;
}

export function getSession() {
  try {
    const session = JSON.parse(localStorage.getItem(KEY));

    if (!session?.access_token || !session?.user) {
      return null;
    }

    const payload = session.access_token.split(".")[1];

    if (!payload) {
      throw new Error("Invalid token.");
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");

    const claims = JSON.parse(
      atob(
        normalized.padEnd(
          Math.ceil(normalized.length / 4) * 4,
          "="
        )
      )
    );

    if (
      !Number.isFinite(claims.exp) ||
      claims.exp * 1000 <= Date.now()
    ) {
      localStorage.removeItem(KEY);
      checkedToken = null;
      return null;
    }

    // Verify that the saved user matches the JWT.
    if (
      claims.role !== session.user.role ||
      String(claims.sub) !== String(session.user.user_id)
    ) {
      localStorage.removeItem(KEY);
      checkedToken = null;
      return null;
    }

    return {
      ...session,
      expiresAt: claims.exp * 1000,
    };
  } catch {
    localStorage.removeItem(KEY);
    checkedToken = null;
    return null;
  }
}

export async function verifySession() {
  const session = getSession();

  if (!session) return false;

  if (checkedToken === session.access_token) {
    return true;
  }

  try {
    const user = await getCurrentUser(session.access_token);

    if (
      user.role !== session.user.role ||
      String(user.user_id) !== String(session.user.user_id)
    ) {
      logout();
      return false;
    }

    checkedToken = session.access_token;
    return true;
  } catch (error) {
    if (error.status === 401) {
      logout();
      return false;
    }

    // Keep the session if the server is temporarily unavailable.
    return true;
  }
}

// Clear previous account work in this tab when the account changes.
function clearPreviousAccountWork(userId) {
  const lastUser = sessionStorage.getItem(LAST_USER_KEY);

  if (
    lastUser !== null &&
    lastUser !== String(userId)
  ) {
    Object.keys(sessionStorage)
      .filter((key) => !KEEP_KEYS.includes(key))
      .forEach((key) => sessionStorage.removeItem(key));

    localStorage.removeItem("providerQuotationDraft");
  }

  sessionStorage.setItem(LAST_USER_KEY, String(userId));
}

export function saveSession(data) {
  if (!data?.access_token || !data?.user?.role) {
    throw new Error("Invalid login response.");
  }

  clearPreviousAccountWork(data.user.user_id);

  localStorage.setItem(KEY, JSON.stringify(data));
  localStorage.removeItem("mamarUsers");

  checkedToken = null;

  if (!getSession()) {
    throw new Error("Invalid or expired login token.");
  }
}

export function updateSessionUser(userData) {
  const session = getSession();

  if (!session || !userData) return;

  const updatedUser = {
    ...session.user,
    ...userData,
  };

  const updatedSession = {
    ...session,
    user: updatedUser,
  };

  localStorage.setItem(KEY, JSON.stringify(updatedSession));

  window.dispatchEvent(
    new CustomEvent("mamar:session-user-updated", {
      detail: updatedUser,
    })
  );
}

// Synchronize login, logout, and account changes across browser tabs.
window.addEventListener("storage", (event) => {
  if (event.key !== KEY) return;

  checkedToken = null;

  // Another tab logged out.
  if (event.newValue === null) {
    window.dispatchEvent(
      new CustomEvent("mamar:logout")
    );

    return;
  }

  try {
    const newSession = JSON.parse(event.newValue);

    if (
      !newSession?.access_token ||
      !newSession?.user?.user_id
    ) {
      return;
    }

    // Clear this tab's previous account data if the account changed.
    clearPreviousAccountWork(newSession.user.user_id);

    window.dispatchEvent(
      new CustomEvent("mamar:session-user-updated", {
        detail: newSession.user,
      })
    );
  } catch {
    // Ignore invalid session data.
  }
});