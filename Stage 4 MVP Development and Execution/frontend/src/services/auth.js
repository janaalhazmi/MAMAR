import { getCurrentUser } from "./api";

const KEY = "mamarSession";

// The token that the backend already accepted, so normal navigation does not ask again.
let checkedToken = null;

export function logout() {
  sessionStorage.removeItem(KEY);
  localStorage.removeItem("mamarUsers");
  checkedToken = null;
}

export function getSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(KEY));
    if (!session?.access_token || !session?.user) return null;
    const payload = session.access_token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(normalized.padEnd(
      Math.ceil(normalized.length / 4) * 4, "="
    )));
    if (!Number.isFinite(claims.exp) || claims.exp * 1000 <= Date.now()) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    // The saved user must be the user of the token, so editing the saved role does not open other pages.
    if (claims.role !== session.user.role || String(claims.sub) !== String(session.user.user_id)) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return { ...session, expiresAt: claims.exp * 1000 };
  } catch {
    sessionStorage.removeItem(KEY);
    return null;
  }
}

export async function verifySession() {
  // Asks the backend if the saved token is still valid. Returns false only when the
  // backend refuses it (401) or the saved role is not the role of the account, and then
  // removes the session. A network error keeps the session, because the free server can
  // be asleep and the token is checked again on the next page.
  const session = getSession();
  if (!session) return false;
  if (checkedToken === session.access_token) return true;

  try {
    const user = await getCurrentUser(session.access_token);
    if (user.role !== session.user.role || user.user_id !== session.user.user_id) {
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
    return true;
  }
}

export function saveSession(data) {
  if (!data?.access_token || !data?.user?.role) {
    throw new Error("Invalid login response.");
  }
  sessionStorage.setItem(KEY, JSON.stringify(data));
  localStorage.removeItem("mamarUsers");
  if (!getSession()) throw new Error("Invalid or expired login token.");
}
