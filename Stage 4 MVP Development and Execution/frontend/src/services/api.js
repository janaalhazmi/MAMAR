const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "https://mamar-api.onrender.com"
).replace(/\/+$/, "");

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    throw new Error(
      "Unable to connect to the server. Please try again."
    );
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

    if (response.status === 409) {
      message = "This email is already registered. Please sign in.";
    } else if (response.status === 429) {
      message =
        path === "/auth/send-passcode"
          ? "Please wait 60 seconds before requesting another code."
          : "Too many attempts. Please try again later.";
    } else if (response.status === 502) {
      message =
        "The verification email could not be sent. Please try again.";
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
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

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
    provider_id:
      user.role === "contractor"
        ? null
        : Number(user.provider_id),
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
function authed(path, accessToken, options = {}) {
  return request(path, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${accessToken}` },
  });
}

export function getProjects(accessToken, projectStatus) {
  const query = projectStatus ? `?project_status=${encodeURIComponent(projectStatus)}` : "";
  return authed(`/projects${query}`, accessToken);
}

export function createProject(accessToken, project) {
  return authed("/projects", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  });
}

export function updateProject(accessToken, projectId, changes) {
  return authed(`/projects/${projectId}`, accessToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
}
// contractor
export const createRequest = (t, projectId, body) =>
  authed(`/projects/${projectId}/requests`, t, { method: "POST", headers: JSON_H, body: JSON.stringify(body) });
export const getProjectQuotations = (t, id) => authed(`/projects/${id}/quotations`, t);
export const rejectQuote = (t, quoteId) => authed(`/quotes/${quoteId}/reject`, t, { method: "POST" });
export const confirmProvider = (t, id, quote_id) =>
  authed(`/projects/${id}/confirm-provider`, t, { method: "POST", headers: JSON_H, body: JSON.stringify({ quote_id }) });
export const getMonitoring = (t, id) => authed(`/projects/${id}/monitoring`, t);
export const getCompletion = (t, id) => authed(`/projects/${id}/completion`, t);
export const approveCompletion = (t, id) => authed(`/projects/${id}/complete`, t, { method: "POST" });
export const requestChanges = (t, id, note) =>
  authed(`/projects/${id}/request-changes`, t, { method: "POST", headers: JSON_H, body: JSON.stringify({ note }) });

// provider
export const listRequests = (t, status = "open") => authed(`/requests?status=${status}`, t);
export const submitQuotation = (t, body) =>
  authed("/quotations", t, { method: "POST", headers: JSON_H, body: JSON.stringify(body) });
export const assignWorker = (t, projectId, worker_id) =>
  authed(`/projects/${projectId}/assignments`, t, { method: "POST", headers: JSON_H, body: JSON.stringify({ worker_id }) });
export const listAssignments = (t) => authed("/assignments", t);

// worker
export const getFieldProjects = (t) => authed("/field-worker/projects", t);
export const getFieldProject = (t, id) => authed(`/field-worker/projects/${id}`, t);


export const verifyDevice = (t, device, body) =>
  authed(`/devices/${device}/verify`, t, { method: "POST", headers: JSON_H, body: JSON.stringify(body) });


const JSON_H = { "Content-Type": "application/json" };
const asJson = (body) => JSON.stringify(body);
 
// تحتاجه لتركيب روابط الصور النسبية مثل /photos/abc
export { API_BASE_URL };
 
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
export function fetchProject(accessToken, projectId) {
  return authed(`/projects/${projectId}`, accessToken);
}
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
 
/* ---------- Provider ---------- */
 
export const fetchOpenRequests = (token, status = "open") =>
  authed(`/requests?status=${encodeURIComponent(status)}`, token);
 
export const postQuotation = (token, body) =>
  authed("/quotations", token, {
    method: "POST",
    headers: JSON_H,
    body: asJson(body), // { project_id, price, duration_days, start_date, services, notes }
  });
 
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
 
// formData فيه الحقول: photos (ملفات) و captions. لا تحط Content-Type يدوي.
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
 
