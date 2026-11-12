import { getCurrentUser } from "./api";

// The login is kept in localStorage, so every tab of the browser shares it: a new tab opens
// already signed in, and logging out in one tab logs out all of them. The work of a page
// (the project being created, selected providers...) stays in sessionStorage, per tab.
const KEY = "mamarSession";
// The user_id of the account whose work this tab holds.
const LAST_USER_KEY = "mamarLastUser";
// Kept when the account changes: the login itself and a sign up that is waiting for its code.
const KEEP_KEYS = [KEY, LAST_USER_KEY, "mamarPendingRegistration"];

// The token that the backend already accepted, so normal navigation does not ask again.
let checkedToken = null;

// Logins saved before the session moved to localStorage are moved over once.
try {
  const old = sessionStorage.getItem(KEY);
  if (old && !localStorage.getItem(KEY)) localStorage.setItem(KEY, old);
  sessionStorage.removeItem(KEY);
} catch {
  // Storage can be blocked (private mode); the user then signs in again.
}

export function logout() {
  localStorage.removeItem(KEY);
  localStorage.removeItem("mamarUsers");
  checkedToken = null;
}

export function getSession() {
  try {
    const session = JSON.parse(localStorage.getItem(KEY));
    if (!session?.access_token || !session?.user) return null;
    const payload = session.access_token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(normalized.padEnd(
      Math.ceil(normalized.length / 4) * 4, "="
    )));
    if (!Number.isFinite(claims.exp) || claims.exp * 1000 <= Date.now()) {
      localStorage.removeItem(KEY);
      return null;
    }
    // The saved user must be the user of the token, so editing the saved role does not open other pages.
    if (claims.role !== session.user.role || String(claims.sub) !== String(session.user.user_id)) {
      localStorage.removeItem(KEY);
      return null;
    }
    return { ...session, expiresAt: claims.exp * 1000 };
  } catch {
    localStorage.removeItem(KEY);
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

// When another account signs in on the same tab, the work of the previous account (its project,
// selected providers, quotations, payment, notifications) is removed, so it does not show up for
// the new account. The same account signing in again (for example after the token expired)
// keeps its work.
function clearPreviousAccountWork(userId) {
  const lastUser = sessionStorage.getItem(LAST_USER_KEY);
  if (lastUser !== null && lastUser !== String(userId)) {
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
  if (!getSession()) throw new Error("Invalid or expired login token.");
}

export function updateSessionUser(userData) {
  const session = getSession();

  if (!session || !userData) return;

  const updatedUser = {
    ...session.user,
    ...userData,
  };

  localStorage.setItem(
    KEY,
    JSON.stringify({
      ...session,
      user: updatedUser,
    })
  );

  window.dispatchEvent(
    new CustomEvent("mamar:session-user-updated", {
      detail: updatedUser,
    })
  );
}

// Another tab signed in, switched account or logged out: this tab follows. Its work is cleared
// when the account changed, and the page reloads so it shows the right pages (or the login).
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== KEY && event.key !== null) return;
    const userOf = (value) => {
      try {
        return JSON.parse(value)?.user?.user_id ?? null;
      } catch {
        return null;
      }
    };
    // A profile change of the same account (new name or picture) needs no reload.
    if (event.newValue && userOf(event.newValue) === userOf(event.oldValue)) return;
    checkedToken = null;
    const session = getSession();
    if (session) clearPreviousAccountWork(session.user.user_id);
    window.location.reload();
  });
}
