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
