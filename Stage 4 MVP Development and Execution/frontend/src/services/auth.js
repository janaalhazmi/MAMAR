const KEY = "mamarSession";

export function logout() {
  sessionStorage.removeItem(KEY);
  localStorage.removeItem("mamarUsers");
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
    return { ...session, expiresAt: claims.exp * 1000 };
  } catch {
    sessionStorage.removeItem(KEY);
    return null;
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
