import * as providerProfileService from "../Contractor/profileService";
import { PROVIDERS as PROVIDER_DIRECTORY } from "../Contractor/Contractor";
import { useEffect, useState, useRef } from "react";
import { getProviderProjects } from "./providerFlow";
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
import { getOpenRequestById } from "./providerQuotes";

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
      // Only open projects take new workers: completed and cancelled ones are left out.
      .then((items) => {
        if (active) setProjects(items.filter((item) => item.status === "Active" || item.status === "Upcoming"));
      })
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
  // The robot check token for the sign up of the worker (only when Turnstile is on).
  const [captcha, setCaptcha] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);

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

        const registered = await registerUser(worker, passcode, captcha);
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
      setCaptchaReset((count) => count + 1);
    } finally {
      setBusy(false);
    }
  }

  return { worker, busy, error, created, submit, setCaptcha, captchaReset };
}

export { providerProfileService };

export function getProviderCompanyName(profile) {
  if (profile?.company_name) return profile.company_name;
  if (profile?.provider_id == null) return "";

  return PROVIDER_DIRECTORY.find(
    (company) => String(company.id) === String(profile.provider_id)
  )?.name ?? "";
}

// Provider Profile: account settings, password and profile picture.
const {
  fetchMyProfile,
  updateMyProfile,
  changeMyPassword,
  uploadMyProfilePicture,
  deleteMyProfilePicture,
} = providerProfileService;

const EMPTY_PROVIDER_PROFILE = {
  full_name: "",
  email: "",
  phone: "",
  role: "provider",
  profile_picture: "",
  created_at: "",
};

function getProviderProfileErrorMessage(error, fallback) {
  return error?.message || fallback;
}

function getProviderProfilePictureUrl(profile) {
  return profile?.profile_picture_url || profile?.profile_picture || profile?.avatar_url || "";
}

function formatProviderProfileDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function useProviderProfile() {
  const [profile, setProfile] = useState(EMPTY_PROVIDER_PROFILE);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });
  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [pictureBusy, setPictureBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInput = useRef(null);

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const user = await fetchMyProfile();
      setProfile({ ...EMPTY_PROVIDER_PROFILE, ...user });
      setForm({
        full_name: user?.full_name || "",
        email: user?.email || "",
        phone: user?.phone || "",
      });
    } catch (err) {
      setError(getProviderProfileErrorMessage(err, "Unable to load your profile."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.full_name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await updateMyProfile({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
      });
      setProfile((current) => ({ ...current, ...updated }));
      setForm({
        full_name: updated.full_name ?? form.full_name.trim(),
        email: updated.email ?? form.email.trim().toLowerCase(),
        phone: updated.phone ?? form.phone.trim(),
      });
      setEditing(false);
      setSuccess("Your profile details have been updated.");
    } catch (err) {
      setError(getProviderProfileErrorMessage(err, "Unable to update your profile."));
    } finally {
      setSavingProfile(false);
    }
  }

  function handleCancelEdit() {
    setForm({
      full_name: profile.full_name || "",
      email: profile.email || "",
      phone: profile.phone || "",
    });
    setEditing(false);
    setError("");
  }

  function updatePasswordField(event) {
    const { name, value } = event.target;
    setPasswords((current) => ({ ...current, [name]: value }));
  }

  async function handleChangePassword(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!passwords.current_password || !passwords.new_password) {
      setError("Enter your current password and a new password.");
      return;
    }
    if (passwords.new_password.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }
    if (passwords.new_password !== passwords.confirm_password) {
      setError("The new password and confirmation do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      await changeMyPassword({
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      setPasswords({ current_password: "", new_password: "", confirm_password: "" });
      setSuccess("Your password has been changed.");
    } catch (err) {
      setError(getProviderProfileErrorMessage(err, "Unable to change your password."));
    } finally {
      setSavingPassword(false);
    }
  }

  async function handlePictureSelected(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("The image must be 5 MB or smaller.");
      return;
    }

    setError("");
    setSuccess("");
    setPictureBusy(true);
    try {
      const updated = await uploadMyProfilePicture(file);
      if (updated && typeof updated === "object") {
        setProfile((current) => ({ ...current, ...updated }));
      } else {
        await loadProfile();
      }
      setSuccess("Your profile picture has been updated.");
    } catch (err) {
      setError(getProviderProfileErrorMessage(err, "Unable to upload your profile picture."));
    } finally {
      setPictureBusy(false);
    }
  }

  async function handleDeletePicture() {
    setError("");
    setSuccess("");
    setPictureBusy(true);
    try {
      const updated = await deleteMyProfilePicture();
      if (updated && typeof updated === "object") {
        setProfile((current) => ({ ...current, ...updated }));
      } else {
        setProfile((current) => ({
          ...current,
          profile_picture: "",
          profile_picture_url: "",
          avatar_url: "",
        }));
      }
      setSuccess("Your profile picture has been removed.");
    } catch (err) {
      setError(getProviderProfileErrorMessage(err, "Unable to remove your profile picture."));
    } finally {
      setPictureBusy(false);
    }
  }

  const picture = getProviderProfilePictureUrl(profile);
  const initial = (profile.full_name || "U").trim().charAt(0).toUpperCase();
  const companyName = getProviderCompanyName(profile) || "—";

  return {
    profile,
    form,
    passwords,
    loading,
    savingProfile,
    savingPassword,
    pictureBusy,
    editing,
    error,
    success,
    fileInput,
    picture,
    initial,
    setEditing,
    updateField,
    updatePasswordField,
    handleSaveProfile,
    handleCancelEdit,
    handleChangePassword,
    handlePictureSelected,
    handleDeletePicture,
    formatDate: formatProviderProfileDate,
    companyName,
  };
}
