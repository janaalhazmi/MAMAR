import { getCurrentUser } from "./api";

// The login stays in sessionStorage (not localStorage): it is gone when the browser closes and
// is never written to disk. The open tabs share it through a BroadcastChannel: a new tab asks
// the other tabs for the login, and a logout or a new login in one tab reaches all of them.
const KEY = "mamarSession";
// The user_id of the last account that signed in on this tab.
const LAST_USER_KEY = "mamarLastUser";
// Kept when the account changes: the login itself and a sign up that is waiting for its code.
const KEEP_KEYS = [KEY, LAST_USER_KEY, "mamarPendingRegistration"];

// The token that the backend already accepted, so normal navigation does not ask again.
let checkedToken = null;

const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("mamar-session");

function tell(message) {
  try {
    channel?.postMessage(message);
  } catch {
    // A tab without BroadcastChannel keeps its own login.
  }
}

// Clears the login of this tab only (the login page does this before signing in).
export function forgetSessionHere() {
  sessionStorage.removeItem(KEY);
  localStorage.removeItem("mamarUsers");
  checkedToken = null;
}

// Logs out of every open tab.
export function logout() {
  forgetSessionHere();
  tell({ type: "logout" });
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
  sessionStorage.setItem(KEY, JSON.stringify(data));
  localStorage.removeItem("mamarUsers");
  if (!getSession()) throw new Error("Invalid or expired login token.");
  tell({ type: "session", session: data });
}

export function updateSessionUser(userData) {
  const session = getSession();

  if (!session || !userData) return;

  const updatedUser = {
    ...session.user,
    ...userData,
  };

  sessionStorage.setItem(
    KEY,
    JSON.stringify({
      ...session,
      user: updatedUser,
    })
  );

  tell({ type: "session", session: JSON.parse(sessionStorage.getItem(KEY)) });

  window.dispatchEvent(
    new CustomEvent("mamar:session-user-updated", {
      detail: updatedUser,
    })
  );
}

// Answers the other tabs, and follows their logins and logouts.
let waitingForLogin = null;
if (channel) {
  channel.onmessage = ({ data }) => {
    if (data?.type === "ask") {
      const raw = sessionStorage.getItem(KEY);
      if (raw && getSession()) tell({ type: "session", session: JSON.parse(raw) });
      return;
    }
    if (data?.type === "logout") {
      if (!sessionStorage.getItem(KEY)) return;
      forgetSessionHere();
      window.location.reload();
      return;
    }
    if (data?.type !== "session" || !data.session?.user) return;
    const mine = getSession();
    const sameUser = mine && String(mine.user.user_id) === String(data.session.user.user_id);
    if (sameUser && mine.access_token === data.session.access_token) return;
    clearPreviousAccountWork(data.session.user.user_id);
    sessionStorage.setItem(KEY, JSON.stringify(data.session));
    checkedToken = null;
    if (waitingForLogin) {
      waitingForLogin();
      waitingForLogin = null;
    } else if (!sameUser) {
      // Another account signed in, in another tab: show this tab as that account.
      window.location.reload();
    }
  };
}

// Called once before the app is shown: a new tab gets the login from an open tab.
export function loadSessionFromOtherTabs(waitMs = 300) {
  if (getSession() || !channel) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      waitingForLogin = null;
      resolve();
    };
    const timer = setTimeout(done, waitMs);
    waitingForLogin = done;
    tell({ type: "ask" });
  });
}
