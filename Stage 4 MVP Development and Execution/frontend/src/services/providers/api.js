import { useEffect, useState } from "react";
import { getProviderProjects } from "../providerFlow";
import {
  fetchRequestWorkZone,
  postReturnToTeam,
  postSubmitCompletion,
  postDeviceVerify,
  fetchProviderWorkers,
  postAssignment,
  registerUser,
  sendPasscode,
} from "../api";
import { getSession } from "../auth";
import { getOpenRequestById } from "../providerQuotes";

export function useProviderDashboard(readSession, loadDashboard) {
  const user = readSession()?.user;
  const displayName = user?.full_name || "Provider";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    loadDashboard()
      .then((result) => active && setData(result))
      .catch(
        (err) => active && setError(err.message || "Could not load your dashboard.")
      )
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [loadDashboard]);

  return { displayName, initials, data, loading, error };
}

export function useQuotationRequest(requestId) {
  const [workZone, setWorkZone] = useState(null);
  const [requestDetails, setRequestDetails] = useState(null);
  const [realRequest, setRealRequest] = useState(null);
  const [workZoneError, setWorkZoneError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadQuotationRequest = async () => {
      setRequestDetails(null);
      setRealRequest(null);
      setWorkZone(null);
      setWorkZoneError("");

      if (!requestId) {
        setWorkZoneError("Missing request ID.");
        return;
      }

      const accessToken = getSession()?.access_token;

      if (!accessToken) {
        setWorkZoneError("Please sign in again.");
        return;
      }

      try {
        const actualRequest = await getOpenRequestById(requestId);
        if (cancelled) return;
        setRealRequest(actualRequest);
      } catch (error) {
        console.error("Failed to load request details:", error);
      }

      try {
        const data = await fetchRequestWorkZone(
          accessToken,
          requestId
        );

        if (cancelled) return;

        setRequestDetails(data);
        setWorkZone(data?.work_zone ?? null);

      } catch (error) {
        if (cancelled) return;

        console.error("Failed to load work zone:", error);
        setWorkZoneError(error.message || "Failed to load work zone.");
      }
    };

    loadQuotationRequest();

    return () => {
      cancelled = true;
    };
  }, [requestId]);

  return { requestDetails, realRequest, workZone, workZoneError };
}

// GET /provider/projects returns Active / Upcoming / Completed; the page uses
// lowercase keys for its filters and badge colours.
function toRow(project) {
  return { ...project, status: String(project.status || "").toLowerCase() };
}

export function useProviderProjects(given) {
  const [loaded, setLoaded] = useState(null);
  const [loading, setLoading] = useState(!given);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (given) return undefined;
    let active = true;
    getProviderProjects()
      .then((rows) => {
        if (active) setLoaded(rows.map(toRow));
      })
      .catch((error) => {
        if (active) setLoadError(error.message || "Could not load your projects.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [given]);

  const projects = given || loaded || [];

  return { projects, loading, loadError };
}

const apiUrl = (
  import.meta.env.VITE_API_URL || "https://mamar-api.onrender.com"
).replace(/\/+$/, "");

export function useProviderProjectDetails(projectId) {
  const session = getSession();
  const token = session?.access_token;
  const name = session?.user?.full_name || "Provider";
  const initials = name.trim().split(/\s+/).slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase()).join("") || "P";

  const [result, setResult] = useState(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewNotice, setReviewNotice] = useState("");
  const [note, setNote] = useState("");

  // Field worker -> provider -> contractor. The page shows the updated project
  // the server returns, so the status and buttons change at once.
  async function review(action) {
    if (reviewBusy) return;
    if (action === "return" && !note.trim()) {
      setReviewError("Write a note for the field team first.");
      return;
    }
    setReviewBusy(true);
    setReviewError("");
    setReviewNotice("");
    try {
      const data = action === "submit"
        ? await postSubmitCompletion(token, projectId)
        : await postReturnToTeam(token, projectId, note.trim());
      setResult({ projectId, token, data });
      setNote("");
      setReviewNotice(action === "submit"
        ? "Sent to the contractor for review."
        : "Returned to the field team with your note.");
    } catch (error) {
      setReviewError(error.message || "Could not update the project. Please try again.");
    } finally {
      setReviewBusy(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        if (!projectId) throw new Error("No project was selected.");
        if (!token) throw new Error("Please sign in to continue.");

        const response = await fetch(
          `${apiUrl}/provider/projects/${encodeURIComponent(projectId)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`Could not load this project (${response.status}).`);
        }

        const data = await response.json();
        if (!controller.signal.aborted) setResult({ projectId, token, data });
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({ projectId, token, error: error.message });
        }
      }
    }

    load();
    return () => controller.abort();
  }, [projectId, token]);

  const current = result?.projectId === projectId && result?.token === token
    ? result
    : null;
  const details = current?.data;
  const project = details?.project;

  return {
    name, initials, current, details, project,
    note, setNote, review, reviewBusy, reviewError, reviewNotice,
  };
}

export function useDeviceVerificationProjects() {
  const [projects, setProjects] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    getProviderProjects()
      .then((items) => {
        if (active) setProjects(items);
      })
      .catch(() => {
        if (active) setLoadError("Could not load your projects.");
      });

    return () => {
      active = false;
    };
  }, []);

  return { projects, loadError };
}

export async function verifyProviderDevice(deviceId, projectId, location) {
  const token = getSession()?.access_token;
  if (!token) throw new Error("Please sign in again.");

  try {
    return await postDeviceVerify(token, deviceId.trim(), {
      project_id: Number(projectId),
      ...location,
    });
  } catch (error) {
    if (error.status === 403) {
      throw new Error("This account does not have permission to verify this device.");
    }

    if (error.status) {
      throw new Error(
        "Verification failed (" + error.status + "). Check the device ID and project."
      );
    }

    throw error;
  }
}

export function useProviderFieldWorkers() {
  const [workers, setWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [workersError, setWorkersError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadWorkers() {
      try {
        const token = getSession()?.access_token;
        if (!token) {
          throw new Error("Please sign in again.");
        }

        const data = await fetchProviderWorkers(token);
        if (!Array.isArray(data)) {
          throw new Error("Could not read the field team response.");
        }

        const loadedWorkers = data.map((worker) => ({
          id: worker.user_id,
          name: worker.full_name,
          email: worker.email,
          phone: worker.phone,
          project: worker.project?.project_name || "",
          status: worker.status,
          activity: worker.last_activity
            ? new Date(worker.last_activity).toLocaleString("en-GB")
            : "—",
        }));

        if (active) setWorkers(loadedWorkers);
      } catch (error) {
        if (active) {
          setWorkersError(error.message || "Could not load field workers.");
        }
      } finally {
        if (active) setLoadingWorkers(false);
      }
    }

    loadWorkers();
    return () => { active = false; };
  }, []);

  return { workers, setWorkers, loadingWorkers, workersError };
}

export function useWorkerAssignmentProjects(canAssign, setError) {
  const [projects, setProjects] = useState(null);

  useEffect(() => {
    if (!canAssign) return;
    let active = true;

    getProviderProjects()
      .then((items) => { if (active) setProjects(items); })
      .catch(() => { if (active) setError("Could not load assigned projects."); });

    return () => { active = false; };
  }, [canAssign, setError]);

  return projects;
}

export async function assignProviderWorker(projectId, workerId) {
  const token = getSession()?.access_token;
  if (!token) throw new Error("Please sign in again.");

  return postAssignment(token, projectId, workerId);
}

export function useFieldWorkerRegistration(onCreated) {
  const [worker, setWorker] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (busy || created) return;

    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setError("");

    try {
      if (worker) {
        const passcode = String(fields.get("passcode") || "").trim();
        if (!/^\d{6}$/.test(passcode)) {
          throw new Error("Enter the 6-digit passcode.");
        }

        const registered = await registerUser(worker, passcode);
        const user = registered?.user ?? registered;
        const email = worker.email.trim().toLowerCase();

        onCreated({
          id: user?.user_id ?? user?.id ?? email,
          name: user?.full_name ?? worker.full_name,
          email,
          phone: user?.phone ?? worker.phone,
          project: "",
          status: "Available",
          activity: "—",
        });
        setWorker(null);
        setCreated(true);
        return;
      }

      const session = getSession();
      const providerId = Number(session?.user?.provider_id ?? session?.provider_id);
      if (!Number.isInteger(providerId) || providerId < 1) {
        throw new Error("Your session is missing the company provider ID.");
      }

      const fullName = String(fields.get("full_name") || "").trim();
      if (!fullName) throw new Error("Enter the worker's full name.");

      const registration = {
        full_name: fullName,
        email: String(fields.get("email") || "").trim(),
        password: String(fields.get("password") || ""),
        phone: String(fields.get("phone") || "").trim() || null,
        role: "worker",
        provider_id: providerId,
      };

      await sendPasscode(registration.email);
      setWorker(registration);
    } catch (failure) {
      setError(failure.message || "Could not register the field worker.");
    } finally {
      setBusy(false);
    }
  }

  return { worker, busy, error, created, submit };
}
