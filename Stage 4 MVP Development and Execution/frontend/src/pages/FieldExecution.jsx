import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import FieldWorkerShell from "../components/FieldWorkerShell";
import MamarMap from "../components/MamarMap";
import Icon from "../components/Icons";
import {
  SITE_STATUSES,
  fileToDataUrl,
  formatDateRange,
  getFieldExecution,
  getFieldWorkerDashboard,
  siteCheckIn,
  updateSiteStatus,
  uploadSitePhotos,
} from "../services/fieldWork";

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
  const [pending, setPending] = useState([]); // photos chosen but not sent yet

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

  async function handleCheckIn() {
    setBusy(true);
    setError("");
    try {
      const { time } = await siteCheckIn(projectId);
      setData((current) => ({
        ...current,
        site: { ...current.site, todayCheckIn: time, lastUpdate: time },
      }));
      setNotice("Checked in at the site.");
    } catch (err) {
      setError(err.message || "Could not check in. Please try again.");
    } finally {
      setBusy(false);
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

  async function handleFilesChosen(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = ""; // lets the worker pick the same photo again
    if (files.length === 0) return;

    setError("");
    try {
      const prepared = await Promise.all(
        files.map(async (file, index) => ({
          id: `${Date.now()}-${index}`,
          caption: file.name.replace(/\.[^.]+$/, ""),
          file, // the real File: this is what is sent to the backend
          src: await fileToDataUrl(file), // small preview version
        }))
      );
      setPending((current) => [...current, ...prepared]);
      setNotice("");
    } catch (err) {
      setError(err.message || "Could not read the photo.");
    }
  }

  async function handleSendPhotos() {
    if (pending.length === 0) {
      setError("Add at least one photo first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const saved = await uploadSitePhotos(projectId, pending);
      setData((current) => ({ ...current, photos: [...saved, ...current.photos] }));
      setPending([]);
      setNotice("Photos sent. Your contractor will see them in Project Monitoring.");
    } catch (err) {
      setError(err.message || "Could not send the photos. Please try again.");
    } finally {
      setBusy(false);
    }
  }

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
            <MamarMap
              latitude={planned.latitude}
              longitude={planned.longitude}
              workZone={planned.workZone}
              readOnly
            />
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
            <button
              type="button"
              className="pf-btn pf-btn-primary pf-btn-sm"
              onClick={handleSendPhotos}
              disabled={busy || pending.length === 0}
            >
              {busy ? "Sending…" : `Send Photos${pending.length ? ` (${pending.length})` : ""}`}
            </button>
          </div>

          {photos.length > 0 && (
            <div className="fw-thumbs">
              {photos.map((photo) => (
                <figure key={photo.id}>
                  <img src={photo.src} alt={photo.caption} />
                  <figcaption>Sent</figcaption>
                </figure>
              ))}
            </div>
          )}

          {pending.length > 0 && (
            <div className="fw-thumbs">
              {pending.map((photo) => (
                <figure key={photo.id}>
                  <img src={photo.src} alt={photo.caption} />
                  <figcaption>
                    Not sent yet
                    <button
                      type="button"
                      className="fw-remove"
                      onClick={() =>
                        setPending((current) => current.filter((p) => p.id !== photo.id))
                      }
                      aria-label={`Remove ${photo.caption}`}
                    >
                      ✕
                    </button>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}

          <button
            type="button"
            className="fw-upload"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
          >
            <span>
              <strong>+ Add more photos</strong>
              <small>Add photos or field documentation from the work zone.</small>
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
