const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "https://mamar-api.onrender.com"
).replace(/\/+$/, "");

// Shared helpers (imported by Contractor.js and others)
export const JSON_H = { "Content-Type": "application/json" };
export const asJson = (body) => JSON.stringify(body);

// Needed to build relative image URLs like /photos/abc
export { API_BASE_URL };

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    throw new Error("Unable to connect to the server. Please try again.");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = data?.detail;

    let message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((item) => item.msg || "Invalid input").join(", ")
          : `Request failed (${response.status}).`;

    // These messages are for sign up only. The other endpoints use the same codes for other
    // errors (409: a second quotation, 502: ArcGIS cannot be reached), so they keep the
    // server's detail.
    const isAuth = path.startsWith("/auth/");
    if (isAuth && response.status === 409) {
      message = "This email is already registered. Please sign in.";
    } else if (isAuth && response.status === 429) {
      message =
        path === "/auth/send-passcode"
          ? "Please wait 60 seconds before requesting another code."
          : "Too many attempts. Please try again later.";
    } else if (isAuth && response.status === 502) {
      message = "The verification email could not be sent. Please try again.";
    }

    // The status lets the caller tell a refused token (401) from other errors.
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (data === null) {
    throw new Error("Invalid server response.");
  }

  return data;
}

function post(path, body) {
  return request(path, {
    method: "POST",
    headers: JSON_H,
    body: asJson(body),
  });
}

export function authed(path, accessToken, options = {}) {
  return request(path, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${accessToken}` },
  });
}

/* ---------- Auth ---------- */

export function testBackendConnection() {
  return request("/health");
}

export function sendPasscode(email) {
  return post("/auth/send-passcode", {
    email: email.trim().toLowerCase(),
  });
}

export function registerUser(user, passcode) {
  const payload = {
    full_name: user.full_name.trim(),
    email: user.email.trim().toLowerCase(),
    password: user.password,
    phone: user.phone ?? null,
    role: user.role,
    provider_id: user.role === "contractor" ? null : Number(user.provider_id),
    passcode: String(passcode).trim(),
  };

  return post("/auth/register", payload);
}

export function getCurrentUser(accessToken) {
  // Checks the saved login token with the backend (GET /auth/me).
  return request("/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function loginUser(email, password) {
  return post("/auth/login", {
    email: email.trim().toLowerCase(),
    password,
  });
}

/* ---------- Projects ---------- */

export function getProjects(accessToken, projectStatus) {
  const query = projectStatus ? `?project_status=${encodeURIComponent(projectStatus)}` : "";
  return authed(`/projects${query}`, accessToken);
}

export function createProject(accessToken, project) {
  return authed("/projects", accessToken, {
    method: "POST",
    headers: JSON_H,
    body: asJson(project),
  });
}

export function updateProject(accessToken, projectId, changes) {
  return authed(`/projects/${projectId}`, accessToken, {
    method: "PATCH",
    headers: JSON_H,
    body: asJson(changes),
  });
}

export function fetchProject(accessToken, projectId) {
  return authed(`/projects/${projectId}`, accessToken);
}

/* ---------- Legacy names (kept in case other files still import them) ---------- */

// contractor
export const createRequest = (t, projectId, body) =>
  authed(`/projects/${projectId}/requests`, t, {
    method: "POST",
    headers: JSON_H,
    body: asJson(body),
  });
export const getProjectQuotations = (t, id) => authed(`/projects/${id}/quotations`, t);
export const rejectQuote = (t, quoteId) =>
  authed(`/quotes/${quoteId}/reject`, t, { method: "POST" });
export const confirmProvider = (t, id, quote_id) =>
  authed(`/projects/${id}/confirm-provider`, t, {
    method: "POST",
    headers: JSON_H,
    body: asJson({ quote_id: Number(quote_id) }),
  });
export const getMonitoring = (t, id) => authed(`/projects/${id}/monitoring`, t);
export const getCompletion = (t, id) => authed(`/projects/${id}/completion`, t);
export const approveCompletion = (t, id) =>
  authed(`/projects/${id}/complete`, t, { method: "POST" });
export const requestChanges = (t, id, note) =>
  authed(`/projects/${id}/request-changes`, t, {
    method: "POST",
    headers: JSON_H,
    body: asJson({ note }),
  });

// provider
export const listRequests = (t, status = "open") => authed(`/requests?status=${status}`, t);
export const submitQuotation = (t, body) =>
  authed("/quotations", t, { method: "POST", headers: JSON_H, body: asJson(body) });
export const assignWorker = (t, projectId, worker_id) =>
  authed(`/projects/${projectId}/assignments`, t, {
    method: "POST",
    headers: JSON_H,
    body: asJson({ worker_id }),
  });
export const listAssignments = (t) => authed("/assignments", t);

// worker
export const getFieldProjects = (t) => authed("/field-worker/projects", t);
export const getFieldProject = (t, id) => authed(`/field-worker/projects/${id}`, t);
export const verifyDevice = (t, device, body) =>
  authed(`/devices/${device}/verify`, t, {
    method: "POST",
    headers: JSON_H,
    body: asJson(body),
  });

/* ---------- Contractor ---------- */

export const postServiceRequest = (token, projectId, body) =>
  authed(`/projects/${projectId}/requests`, token, {
    method: "POST",
    headers: JSON_H,
    body: asJson(body), // { title, required_by, details }
  });

export const fetchProjectQuotations = (token, projectId) =>
  authed(`/projects/${projectId}/quotations`, token);

export const postRejectQuote = (token, quoteId) =>
  authed(`/quotes/${quoteId}/reject`, token, { method: "POST" });

export const postConfirmProvider = (token, projectId, quoteId) =>
  authed(`/projects/${projectId}/confirm-provider`, token, {
    method: "POST",
    headers: JSON_H,
    body: asJson({ quote_id: Number(quoteId) }),
  });

export const fetchMonitoring = (token, projectId) =>
  authed(`/projects/${projectId}/monitoring`, token);

export const fetchCompletion = (token, projectId) =>
  authed(`/projects/${projectId}/completion`, token);

export const postCompleteProject = (token, projectId) =>
  authed(`/projects/${projectId}/complete`, token, { method: "POST" });

export const postRequestChanges = (token, projectId, note) =>
  authed(`/projects/${projectId}/request-changes`, token, {
    method: "POST",
    headers: JSON_H,
    body: asJson({ note }),
  });

// Get the contractor's work zone for an assigned service request.
export const fetchRequestWorkZone = (token, requestId) =>
  authed(`/requests/${encodeURIComponent(requestId)}/work-zone`, token);

/* ---------- Provider ---------- */

export const fetchOpenRequests = (token, status = "open") =>
  authed(`/requests?status=${encodeURIComponent(status)}`, token);

export const postQuotation = (token, body) =>
  authed("/quotations", token, {
    method: "POST",
    headers: JSON_H,
    body: asJson(body), // { project_id, price, duration_days, start_date, services, notes }
  });

// Provider pages: only the signed-in provider's company data.
export const fetchProviderRequests = (token, quoted) =>
  authed(`/provider/requests${quoted === undefined ? "" : `?quoted=${quoted}`}`, token);

export const fetchProviderProjects = (token, status) =>
  authed(`/provider/projects${status ? `?status=${encodeURIComponent(status)}` : ""}`, token);

export const fetchProviderProject = (token, projectId) =>
  authed(`/provider/projects/${encodeURIComponent(projectId)}`, token);

export const fetchProviderDashboard = (token) => authed("/provider/dashboard", token);

// Field worker -> provider -> contractor: the provider sends the finished work on,
// or returns it to its field team with a note.
export const postSubmitCompletion = (token, projectId) =>
  authed(`/provider/projects/${encodeURIComponent(projectId)}/submit-completion`, token, {
    method: "POST",
  });

export const postReturnToTeam = (token, projectId, note) =>
  authed(`/provider/projects/${encodeURIComponent(projectId)}/return-to-team`, token, {
    method: "POST",
    headers: JSON_H,
    body: asJson({ note }),
  });

export const fetchProviderWorkers = (token, status) =>
  authed(`/provider/workers${status ? `?status=${encodeURIComponent(status)}` : ""}`, token);

export const fetchAssignments = (token, status) =>
  authed(`/assignments${status ? `?status=${encodeURIComponent(status)}` : ""}`, token);

export const postAssignment = (token, projectId, workerId) =>
  authed(`/projects/${projectId}/assignments`, token, {
    method: "POST",
    headers: JSON_H,
    body: asJson({ worker_id: Number(workerId) }),
  });

/* ---------- Field worker ---------- */

export const fetchFieldProjects = (token) => authed("/field-worker/projects", token);

export const fetchFieldProject = (token, projectId) =>
  authed(`/field-worker/projects/${projectId}`, token);

export const patchSiteStatus = (token, projectId, status) =>
  authed(`/field-worker/projects/${projectId}/status`, token, {
    method: "PATCH",
    headers: JSON_H,
    body: asJson({ status }),
  });

export const postCheckIn = (token, projectId) =>
  authed(`/field-worker/projects/${projectId}/check-in`, token, { method: "POST" });

// formData has the fields: photos (files) and captions. Don't set Content-Type manually.
export const postPhotos = (token, projectId, formData) =>
  authed(`/field-worker/projects/${projectId}/photos`, token, {
    method: "POST",
    body: formData,
  });

export const postDeviceVerify = (token, device, body) =>
  authed(`/devices/${encodeURIComponent(device)}/verify`, token, {
    method: "POST",
    headers: JSON_H,
    body: asJson(body), // { project_id, latitude, longitude, accuracy }
  });

/* ---------- Payments (PayPal sandbox, issue #48) ---------- */
export const postStartPayment = (token, projectId, returnUrl, cancelUrl) =>
  authed(`/projects/${encodeURIComponent(projectId)}/payments`, token, {
    method: "POST",
    headers: JSON_H,
    body: asJson({ return_url: returnUrl, cancel_url: cancelUrl }),
  });

export const postCapturePayment = (token, orderId) =>
  authed(`/payments/orders/${encodeURIComponent(orderId)}/capture`, token, { method: "POST" });

export const postCancelPayment = (token, orderId) =>
  authed(`/payments/orders/${encodeURIComponent(orderId)}/cancel`, token, { method: "POST" });

export const fetchProjectPayments = (token, projectId) =>
  authed(`/projects/${encodeURIComponent(projectId)}/payments`, token);
