import { getCurrentUser } from "./api";

const KEY = "mamarSession";
const LAST_USER_KEY = "mamarLastUser";
const KEEP_KEYS = [KEY, LAST_USER_KEY, "mamarPendingRegistration"];

const CHANNEL_NAME = "mamar_auth_channel";

let checkedToken = null;

const channel = null;
  

// Validate and read the session from this tab.
export function getSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(KEY));

    if (!session?.access_token || !session?.user) {
      return null;
    }

    const payload = session.access_token.split(".")[1];

    if (!payload) throw new Error("Invalid token");

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");

    const claims = JSON.parse(
      atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="))
    );

    if (
      !Number.isFinite(claims.exp) ||
      claims.exp * 1000 <= Date.now()
    ) {
      sessionStorage.removeItem(KEY);
      checkedToken = null;
      return null;
    }

    if (
      claims.role !== session.user.role ||
      String(claims.sub) !== String(session.user.user_id)
    ) {
      sessionStorage.removeItem(KEY);
      checkedToken = null;
      return null;
    }

    return {
      ...session,
      expiresAt: claims.exp * 1000,
    };
  } catch {
    sessionStorage.removeItem(KEY);
    checkedToken = null;
    return null;
  }
}

// Clear previous account data in this tab.
function clearPreviousAccountWork(userId) {
  const lastUser = sessionStorage.getItem(LAST_USER_KEY);

  if (lastUser !== null && lastUser !== String(userId)) {
    Object.keys(sessionStorage)
      .filter((key) => !KEEP_KEYS.includes(key))
      .forEach((key) => sessionStorage.removeItem(key));
  }

  sessionStorage.setItem(LAST_USER_KEY, String(userId));
}

// Save a session locally and optionally share it with other tabs.
function storeSession(data, broadcast = true) {
  if (!data?.access_token || !data?.user?.role) {
    throw new Error("Invalid login response.");
  }

  clearPreviousAccountWork(data.user.user_id);

  sessionStorage.setItem(KEY, JSON.stringify(data));
  checkedToken = null;

  if (!getSession()) {
    throw new Error("Invalid or expired login token.");
  }

  if (broadcast) {
    channel?.postMessage({
      type: "SESSION_UPDATED",
      session: data,
    });
  }
}

export function saveSession(data) {
  storeSession(data, true);
}

export function logout(broadcast = true) {
  sessionStorage.removeItem(KEY);
  checkedToken = null;

  if (broadcast) {
    channel?.postMessage({ type: "LOGOUT" });
  }

  window.dispatchEvent(new CustomEvent("mamar:logout"));
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

    // Keep the session during temporary network errors.
    return true;
  }
}

export function updateSessionUser(userData) {
  const session = getSession();

  if (!session || !userData) return;

  const updatedSession = {
    ...session,
    user: {
      ...session.user,
      ...userData,
    },
  };

  storeSession(updatedSession, true);

  window.dispatchEvent(
    new CustomEvent("mamar:session-user-updated", {
      detail: updatedSession.user,
    })
  );
}

// Ask other open tabs for an existing session.
export function requestSession() {
  if (!channel) return Promise.resolve(false);

  if (getSession()) return Promise.resolve(true);

  return new Promise((resolve) => {
    let attempts = 0;
    let finished = false;

    const finish = (result) => {
      if (finished) return;
      finished = true;
      clearInterval(timer);
      resolve(result);
    };

    const timer = setInterval(() => {
      if (getSession()) {
        finish(true);
        return;
      }

      if (attempts >= 10) {
        finish(false);
        return;
      }

      attempts++;

      channel.postMessage({ type: "SESSION_REQUEST" });
    }, 200);
  });
}

// Receive messages from other tabs.
if (channel) {
  channel.addEventListener("message", (event) => {
    const message = event.data;

    if (!message?.type) return;

    if (message.type === "SESSION_REQUEST") {
      const session = getSession();

      if (session) {
        channel.postMessage({
          type: "SESSION_UPDATED",
          session: {
            access_token: session.access_token,
            token_type: "bearer",
            user: session.user,
          },
        });
      }

      return;
    }

    if (message.type === "SESSION_UPDATED") {
      const currentSession = getSession();
      const newSession = message.session;

      if (!newSession?.access_token || !newSession?.user) return;

      if (
        currentSession &&
        String(currentSession.user.user_id) !==
          String(newSession.user.user_id)
      ) {
        Object.keys(sessionStorage)
          .filter((key) => !KEEP_KEYS.includes(key))
          .forEach((key) => sessionStorage.removeItem(key));
      }

      try {
        storeSession(newSession, false);

        window.dispatchEvent(
          new CustomEvent("mamar:session-user-updated", {
            detail: newSession.user,
          })
        );
      } catch {
        // Ignore invalid session messages.
      }

      return;
    }

    if (message.type === "LOGOUT") {
      logout(false);
    }
  });
}

// Request a session when this tab opens.
// Repeated requests allow an already-open tab time to respond.
