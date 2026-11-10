import NotificationBell from "../../components/NotificationBell";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProviderSidebar from "../../components/ProviderSidebar";
import { getSession } from "../../services/auth";
import { useDeviceVerificationProjects, verifyProviderDevice } from "../../services/providers/api";

export default function ProviderDeviceVerification() {
  const { projectId } = useParams();
  const name = getSession()?.user?.full_name || "Provider";
  const initials = name.trim().split(/\s+/).slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase()).join("") || "P";
  const { projects, loadError } = useDeviceVerificationProjects();

  const selected = projects?.find((project) => String(project.id) === projectId);

  return (
    <div className="provider-dashboard-page">
      <ProviderSidebar />
      <div className="provider-main-area">
        <header className="provider-topbar">
          <NotificationBell />
          <div />
          <div className="provider-account">
            <div className="provider-avatar">{initials}</div>
            <div><strong>{name}</strong><span>Service Provider</span></div>
          </div>
        </header>

        <main className="provider-dashboard-content">
          {projectId && (
            <p>
              <Link to="/provider/device-verification">
                ← Back to Device Verification
              </Link>
            </p>
          )}
          <section className="provider-title">
            <h1>Device Verification</h1>
            <p>{projectId ? "Verify an installed device using its current location." : "Select a project to verify a device."}</p>
          </section>

          {loadError ? <p role="alert">{loadError}</p> :
            projects === null ? <p role="status">Loading projects…</p> :
            projectId ? (
              selected ? <VerificationForm key={projectId} project={selected} /> :
                <p role="alert">This project is not in your assigned projects.</p>
            ) : (
              <section className="provider-section" aria-label="Assigned projects">
                {projects.length === 0 && <p>No assigned projects yet.</p>}
                {projects.map((project) => (
                  <article className="assigned-project-card" key={project.id}>
                    <div><h3>{project.name}</h3><p>{project.status}</p></div>
                    <Link to={"/provider/device-verification/" + encodeURIComponent(project.id)}>
                      Open Verification →
                    </Link>
                  </article>
                ))}
              </section>
            )}
        </main>
      </div>
    </div>
  );
}

function VerificationForm({ project }) {
  const device = project.device;
  const deviceId = String(device?.id ?? "");
  const deviceType = device?.type || "—";
  const installationTime = device?.installedAt || "—";
  const userId = getSession()?.user?.user_id;
  const draftKey = userId == null
    ? null
    : "mamar:verification-draft:" + userId + ":" + project.id;
  const [draftMessage, setDraftMessage] = useState("");
  const [location, setLocation] = useState(() => {
    if (!draftKey) return null;
    try {
      return JSON.parse(localStorage.getItem(draftKey))?.location ?? null;
    } catch {
      return null;
    }
  });

  function saveDraft() {
    if (!draftKey || !location) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ location }));
      setDraftMessage("Draft saved on this browser.");
    } catch {
      setDraftMessage("Could not save the draft.");
    }
  }
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function captureLocation() {
    setError("");
    setResult(null);
    setLocation(null);
    if (!navigator.geolocation) {
      setError("Location capture is unavailable in this browser.");
      return;
    }

    setCapturing(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        });
        setCapturing(false);
      },
      (failure) => {
        setError(failure.message || "Could not capture your location.");
        setCapturing(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  async function verify(event) {
    event.preventDefault();
    if (!deviceId.trim() || !location || submitting || capturing) return;

    setError("");
    setResult(null);
    setSubmitting(true);

    try {
      setResult(await verifyProviderDevice(deviceId, project.id, location));
    } catch (failure) {
      setError(failure.message || "Could not verify the device.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pdv-details">

      <p className="pdv-verification-status" role="status">
        <span className="pdv-status">{result?.status || "Pending Verification"}</span>
      </p>

      <dl className="pdv-card pdv-summary">
        <div><dt>Project</dt><dd>{project.name}</dd></div>
        <div><dt>Device</dt><dd>{device?.name || deviceType}</dd></div>
        <div><dt>Device ID</dt><dd>{deviceId.trim() || "—"}</dd></div>
        <div><dt>Work Zone</dt><dd>{project.workZoneName || "—"}</dd></div>
      </dl>

      <form className="pdv-grid" onSubmit={verify}>
        <section className="pdv-card">
          <h2>Installation Location</h2>
          <p>Compare the planned device point with the captured field location.</p>
          <div className="pdv-location">
            {result?.planned_latitude != null && result?.planned_longitude != null ? (
              <div>
                <strong>Planned Location</strong>
                <p>{result.planned_latitude}, {result.planned_longitude}</p>
              </div>
            ) : (
              <p>Planned location will appear when available from verification.</p>
            )}
          </div>
          <dl className="pdv-coords">
            <div>
              <dt>Current Location</dt>
              <dd>{location ? location.latitude.toFixed(6) + ", " + location.longitude.toFixed(6) : "Not captured yet"}</dd>
            </div>
            <div>
              <dt>Distance</dt>
              <dd>{result?.distance_m != null ? result.distance_m + " m" : "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="pdv-card">
          <h2>Verification Details</h2>
          <p>Capture the location of the installed device.</p>
          <div className="pdv-capture" role="status">
            <strong>Current Location</strong>
            <p>{location ? location.latitude.toFixed(6) + ", " + location.longitude.toFixed(6) : "Not captured yet"}</p>
          </div>
          <button className="pdv-button" type="button" onClick={captureLocation} disabled={capturing || submitting}>
            {capturing ? "Capturing…" : location ? "Capture Again" : "Capture Current Location"}
          </button>
          <label className="pdv-field">
            Choose Installation Photo
            <input type="file" accept="image/*" disabled={submitting} />
          </label>
          <p className="pdv-note">The photo is selected locally and is not uploaded.</p>
        </section>

        <section className="pdv-card">
          <h2>Device Details</h2>
          <dl className="pdv-coords">
            <div>
              <dt>Device Type</dt>
              <dd>{deviceType}</dd>
            </div>
            <div>
              <dt>Installation Time</dt>
              <dd>{installationTime}</dd>
            </div>
          </dl>
        </section>

        <section className="pdv-card">
          <h2>Verification</h2>
          <button
            className="pdv-button"
            type="button"
            onClick={saveDraft}
            disabled={!draftKey || !location || capturing || submitting}
          >
            Save Draft
          </button>
          {draftMessage && <p role="status">{draftMessage}</p>}
          <p>{location ? "Current location captured." : "Location capture required."}</p>
          <p>{deviceId.trim() ? "Device linked to this project." : "No device linked to this project yet."}</p>
          <button
            className="pdv-button pdv-primary"
            type="submit"
            disabled={!deviceId.trim() || !location || capturing || submitting}
          >
            {submitting ? "Verifying…" : "Verify Installation →"}
          </button>
          {error && <p className="pdv-error" role="alert">{error}</p>}
          {result && <p role="status">Verification status: {result.status}</p>}
        </section>
      </form>
    </div>
  );
}
