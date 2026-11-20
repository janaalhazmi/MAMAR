import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import FieldWorkerShell from "../../components/FieldWorkerShell";
import MamarMap from "../../components/MamarMap";
import WeatherCard from "../../components/WeatherCard";
import AttendanceCard from "../../components/AttendanceCard";
import TrafficCard from "../../components/TrafficCard";
import Icon from "../../components/Icons";
import "../../styles/extras.css";
import SafetyBadge from "../../components/SafetyBadge";
import { useSafetyChecks } from "../../services/ai";
import {
  SITE_STATUSES,
  fileToDataUrl,
  formatDateRange,
  getFieldExecution,
  getFieldWorkerDashboard,
  updateSiteStatus,
  uploadSitePhotos,
} from "../../services/FieldWorker/FieldWorker";

function FieldExecution() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInput = useRef(null);

  const [data, setData] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const [editingStatus, setEditingStatus] = useState(false);
  const [pending, setPending] = useState([]); // photos chosen but not saved yet (sending, or failed)
  const [nextStage, setNextStage] = useState("during"); // before, during or after the work, for the next photos
  const [photoMsg, setPhotoMsg] = useState(null); // { ok, text } shown in the Site Updates card
  const safety = useSafetyChecks(projectId, data?.photos?.length || 0); // AI safety check of the photos

  // The project comes from the real backend:
  //   1. /field-execution?projectId=12  (link from the dashboard), or
  //   2. the project the provider assigned this field worker to.
  const requestedId = searchParams.get("projectId");

  useEffect(() => {
    let active = true;

    async function load() {
      setError("");
      try {
        let id = requestedId;

        if (!id) {
          const dashboard = await getFieldWorkerDashboard();
          id = dashboard.activeProjects[0]?.id ?? dashboard.newProject?.id ?? null;
        }

        if (!id) {
          throw new Error(
            "You have no assigned project yet. Ask your provider to assign you to a project."
          );
        }

        const result = await getFieldExecution(id);
        if (!active) return;
        setProjectId(id);
        setData(result);
      } catch (err) {
        if (active) setError(err.message || "Could not load this project.");
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [requestedId]);

  // Site Check-in uses the site QR code and the GPS (the My Attendance card on this page).
  function handleCheckIn() {
    document.getElementById("my-attendance")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // After a check in or out, reload the project so the times and the status are fresh.
  async function refreshAfterAttendance() {
    try {
      setData(await getFieldExecution(projectId));
    } catch {
      // The card already shows the result; the old numbers stay until the next load.
    }
  }

  async function handleStatusChange(event) {
    const status = event.target.value;
    setBusy(true);
    setError("");
    try {
      await updateSiteStatus(projectId, status);
      setData((current) => ({
        ...current,
        site: { ...current.site, executionStatus: status },
      }));
      setEditingStatus(false);
      setNotice("Status updated.");
    } catch (err) {
      setError(err.message || "Could not update the status. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Choosing photos sends them right away, so a photo is never left "selected" but not saved (issue #79).
  async function handleFilesChosen(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = ""; // lets the worker pick the same photo again
    if (files.length === 0) return;

    setError("");
    setPhotoMsg(null);
    let prepared;
    try {
      prepared = await Promise.all(
        files.map(async (file, index) => ({
          id: `${Date.now()}-${index}`,
          caption: file.name.replace(/\.[^.]+$/, ""),
          stage: nextStage,
          file, // the real File: this is what is sent to the backend
          src: await fileToDataUrl(file), // small preview version
        }))
      );
    } catch (err) {
      setPhotoMsg({ ok: false, text: err.message || "Could not read the photo." });
      return;
    }
    const waiting = [...pending, ...prepared];
    setPending(waiting);
    await sendPhotos(waiting);
  }

  async function sendPhotos(list = pending) {
    if (list.length === 0) return;
    setBusy(true);
    setPhotoMsg(null);
    try {
      const saved = await uploadSitePhotos(projectId, list);
      setData((current) => ({ ...current, photos: [...saved, ...current.photos] }));
      setPending([]);
      setPhotoMsg({
        ok: true,
        text: `${saved.length} ${saved.length === 1 ? "photo" : "photos"} saved. The provider and the contractor can see ${saved.length === 1 ? "it" : "them"} now.`,
      });
    } catch (err) {
      setPhotoMsg({ ok: false, text: `${err.message || "Could not send the photos."} The photos are not saved yet: press Try again.` });
    } finally {
      setBusy(false);
    }
  }

  // Warn before closing the page while photos are not saved.
  useEffect(() => {
    if (pending.length === 0) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [pending.length]);

  if (!data) {
    return (
      <FieldWorkerShell activeKey="team">
        {error ? (
          <>
            <p className="pf-alert" role="alert">
              {error}
            </p>
            <Link to="/field-worker-dashboard" className="pf-backlink">
              ‹ Back to Dashboard
            </Link>
          </>
        ) : (
          <p className="pf-empty">Loading project…</p>
        )}
      </FieldWorkerShell>
    );
  }

  const { project, planned, site, team, moreTeamMembers, photos } = data;

  return (
    <FieldWorkerShell activeKey="team">
      <Link to="/field-worker-dashboard" className="pf-backlink">
        ‹ Back to Dashboard
      </Link>

      <div className="pf-title-row">
        <section className="pf-heading">
          <h1>{project.name}</h1>
          <p>{project.type}</p>
        </section>
        <span className="pf-pill pf-pill-green">
          <i aria-hidden="true" />
          {project.status}
        </span>
      </div>

      <section className="pf-summary pf-summary-4">
        <div className="pf-summary-item">
          <span className="pf-label">Location</span>
          <strong>{project.location}</strong>
        </div>
        <div className="pf-summary-item">
          <span className="pf-label">Project Dates</span>
          <strong>{formatDateRange(project.startDate, project.endDate)}</strong>
        </div>
        <div className="pf-summary-item">
          <span className="pf-label">Services</span>
          <strong>{project.servicesLabel}</strong>
        </div>
        <div className="pf-summary-item">
          <span className="pf-label">Overall Progress</span>
          <div className="pf-progress-row">
            <div className="pf-bar" aria-hidden="true">
              <span style={{ width: `${project.progress}%` }} />
            </div>
            <small>{project.progress}%</small>
          </div>
        </div>
      </section>

      <WeatherCard projectId={projectId} />
      <div id="my-attendance">
        <AttendanceCard
          projectId={projectId}
          initialCode={searchParams.get("code") || ""}
          onChange={refreshAfterAttendance}
        />
      </div>
      <TrafficCard projectId={projectId} />

      {error && (
        <p className="pf-alert" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="fw-notice" role="status">
          {notice}
        </p>
      )}

      <div className="pf-mon-grid">
        <section className="pf-card pf-pad">
          <h2>Work Zone</h2>
          <p className="pf-sub">Live project location and approved execution area.</p>
          <div className="pf-map">
            {planned ? (
             <MamarMap
               latitude={planned.latitude}
               longitude={planned.longitude}
               workZone={planned.workZone}
                readOnly
       />
  ) : (
    <p>Work zone location is not available for this project.</p>
  )}
</div>
        </section>

        <section className="pf-card pf-pad">
          <h2>Site Status</h2>
          <p className="pf-sub">Current field execution information.</p>

          <div className="pf-status-box">
            <span className="pf-tick pf-tick-green" aria-hidden="true">
              <Icon name="check" size={16} />
            </span>
            <div>
              <span className="pf-label">Execution Status</span>
              <strong>{site.executionStatus}</strong>
            </div>
          </div>

          <div className="fw-block">
            <span className="pf-label">Field Check-in</span>
            <strong>{site.teamCount} Team Members Assigned</strong>
          </div>

          <div className="fw-times">
            <div>
              <span className="pf-label">Today’s Check-in</span>
              <strong>{site.todayCheckIn}</strong>
            </div>
            <div>
              <span className="pf-label">Last Update</span>
              <strong>{site.lastUpdate}</strong>
            </div>
          </div>

          {editingStatus && (
            <div className="fw-status-edit">
              <label htmlFor="site-status">New status</label>
              <select
                id="site-status"
                value={site.executionStatus}
                onChange={handleStatusChange}
                disabled={busy}
              >
                {SITE_STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
          )}

          <div className="fw-button-row">
            <button
              type="button"
              className="pf-btn pf-btn-secondary"
              onClick={() => setEditingStatus((value) => !value)}
              disabled={busy}
            >
              Update Status
            </button>
            <button
              type="button"
              className="pf-btn pf-btn-primary"
              onClick={handleCheckIn}
              disabled={busy}
            >
              Site Check-in
            </button>
          </div>

          <button
            type="button"
            className="fw-link fw-link-block"
            onClick={() => navigate(`/device-verification?projectId=${projectId}`)}
          >
            Verify an installed device →
          </button>
        </section>

        <section className="pf-card pf-pad">
          <div className="fw-card-head">
            <h2>Field Team</h2>
          </div>

          <ul className="fw-team">
            {team.map((member) => (
              <li key={member.id}>
                <span className={`fw-avatar fw-tone-${member.tone}`}>{member.initials}</span>
                <div>
                  <strong>{member.name}</strong>
                  <small>{member.role}</small>
                </div>
              </li>
            ))}
          </ul>

          {moreTeamMembers > 0 && (
            <p className="pf-muted">+ {moreTeamMembers} more team members</p>
          )}
        </section>

        <section className="pf-card pf-pad">
          <div className="fw-card-head">
            <h2>Site Updates</h2>
            {pending.length > 0 && !busy && (
              <button type="button" className="pf-btn pf-btn-primary pf-btn-sm" onClick={() => sendPhotos()}>
                Try again ({pending.length})
              </button>
            )}
          </div>

          {photoMsg && (
            <p className={`fw-photo-msg ${photoMsg.ok ? "ok" : "bad"}`} role={photoMsg.ok ? "status" : "alert"}>
              {photoMsg.text}
            </p>
          )}

          {photos.length > 0 && (
            <div className="fw-thumbs">
              {photos.map((photo) => (
                <figure key={photo.id}>
                  <img src={photo.src} alt={photo.caption} />
                  <figcaption>Sent</figcaption>
                  <SafetyBadge photoId={photo.id} safety={safety} />
                </figure>
              ))}
            </div>
          )}

          {pending.length > 0 && (
            <div className="fw-thumbs">
              {pending.map((photo) => (
                <figure key={photo.id} className="fw-pending">
                  <img src={photo.src} alt={photo.caption} />
                  <figcaption>
                    {busy ? "Sending…" : "Not saved"}
                    {!busy && (
                      <button
                        type="button"
                        className="fw-remove"
                        onClick={() => setPending((current) => current.filter((p) => p.id !== photo.id))}
                        aria-label={`Remove ${photo.caption}`}
                      >
                        ✕
                      </button>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}

          <label className="fw-stage-pick">
            These photos are from
            <select value={nextStage} onChange={(event) => setNextStage(event.target.value)} disabled={busy}>
              <option value="before">Before the work</option>
              <option value="during">During the work</option>
              <option value="after">After the work (final evidence)</option>
            </select>
          </label>

          <button
            type="button"
            className="fw-upload"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
          >
            <span>
              <strong>{busy ? "Sending photos…" : "+ Add photos"}</strong>
              <small>Take or choose photos: they are saved as soon as you pick them.</small>
            </span>
            <span className="fw-upload-plus" aria-hidden="true">
              <Icon name="plus" size={22} />
            </span>
          </button>

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            hidden
            onChange={handleFilesChosen}
          />
        </section>
      </div>
    </FieldWorkerShell>
  );
}

export default FieldExecution;
