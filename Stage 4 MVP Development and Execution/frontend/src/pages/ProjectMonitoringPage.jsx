import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ContractorShell from "../components/ContractorShell";
import MamarMap from "../components/MamarMap";
import Icon from "../components/Icons";
import {
  formatDateRange,
  getCurrentProject,
  getMonitoringData,
} from "../services/projectFlow";


function ProjectMonitoringPage() {
  const navigate = useNavigate();
  const project = getCurrentProject();

  const [data, setData] = useState(null);
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getMonitoringData(project.id)
      .then((result) => {
        if (!active) return;
        setData(result);
        // The monitoring endpoint returns the confirmed provider.
        setProvider(result.provider);
      })
      .catch((err) => active && setError(err.message || "Could not load project progress."));

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <ContractorShell activeKey="projects">
        <p className="pf-alert" role="alert">
          {error}
        </p>
      </ContractorShell>
    );
  }

  if (!data) {
    return (
      <ContractorShell activeKey="projects">
        <p className="pf-empty">Loading project…</p>
      </ContractorShell>
    );
  }

  const hasLocation = project.latitude != null && project.longitude != null;

  return (
    <ContractorShell activeKey="projects">
      <Link to="/contractor-dashboard#projects" className="pf-backlink">
        ‹ Back to My Projects
      </Link>

      <div className="pf-title-row">
        <section className="pf-heading">
          <h1>Project Monitoring</h1>
          <p>Track project progress and field activity in one place.</p>
        </section>
        <span className="pf-pill pf-pill-green">
          <i aria-hidden="true" />
          {data.status}
        </span>
      </div>

      <section className="pf-summary pf-summary-4">
        <div className="pf-summary-item">
          <span className="pf-label">Project</span>
          <strong>{project.name}</strong>
          <small>{project.type}</small>
        </div>
        <div className="pf-summary-item">
          <span className="pf-label">Service Provider</span>
          <strong>{provider?.providerName || "Not assigned"}</strong>
          <small>{provider?.providerDescription}</small>
        </div>
        <div className="pf-summary-item">
          <span className="pf-label">Project Dates</span>
          <strong>{formatDateRange(project.startDate, project.endDate)}</strong>
        </div>
        <div className="pf-summary-item">
          <span className="pf-label">Overall Progress</span>
          <div className="pf-progress-row">
            <strong className="pf-big">{data.overallProgress}%</strong>
            <div className="pf-bar" aria-hidden="true">
              <span style={{ width: `${data.overallProgress}%` }} />
            </div>
          </div>
        </div>
      </section>

      <div className="pf-mon-grid">
        <section className="pf-card pf-pad">
          <h2>Live Work Zone</h2>
          <p className="pf-sub">
            Monitor the approved work zone and current site activity.
          </p>
          <div className="pf-map">
            {hasLocation ? (
              <MamarMap
                latitude={project.latitude}
                longitude={project.longitude}
                workZone={project.workZone}
                readOnly
              />
            ) : (
              <div className="pf-map-empty">No location selected</div>
            )}
          </div>
          {/* TODO(API): live field-worker position / work zone updates. */}
        </section>

        <section className="pf-card pf-pad">
          <h2>Current Status</h2>
          <div className="pf-status-box">
            <span className="pf-tick pf-tick-green" aria-hidden="true">
              <Icon name="check" size={16} />
            </span>
            <div>
              <span className="pf-label">Execution Status</span>
              <strong>{data.executionStatus}</strong>
            </div>
          </div>

          <div className="pf-team">
            <div>
              <span className="pf-label">Field Team on Site</span>
              <strong className="pf-big">{data.fieldTeamCount}</strong>{" "}
              <span className="pf-muted">team members</span>
            </div>
            <span className="pf-chip">Location Verification</span>
          </div>

          <div className="pf-latest">
            <span className="pf-label">Latest Update</span>
            <strong>{data.latestUpdate.title}</strong>
            <p>{data.latestUpdate.text}</p>
            <small>{data.latestUpdate.time}</small>
          </div>
        </section>

        <section className="pf-card pf-pad">
          <h2>Execution Progress</h2>
          <p className="pf-sub">Project milestones updated by the service provider.</p>
          <ol className="pf-milestones">
            {data.milestones.map((step) => (
              <li key={step.id} className={`pf-ms pf-ms-${step.state}`}>
                <span className="pf-ms-dot" aria-hidden="true">
                  {step.state === "done" && <Icon name="check" size={14} />}
                </span>
                <div>
                  <strong>{step.title}</strong>
                  <small>{step.note}</small>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="pf-card pf-pad">
          <h2>Latest Site Photos</h2>
          <div className="pf-photos">
            {data.photos.map((photo) => (
              <figure key={photo.id}>
                <img src={photo.src} alt={photo.caption} />
                <figcaption>
                  <strong>{photo.caption}</strong>
                  <small>{photo.time}</small>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </div>

      <div className="pf-actions pf-actions-split">
        <button
          type="button"
          className="pf-btn pf-btn-secondary"
          onClick={() => navigate("/quotations/select")}
        >
          ← Back
        </button>

        {/* Enabled only when the provider has submitted the final work
            (data.completionSubmitted comes from the backend). */}
        <button
          type="button"
          className="pf-btn pf-btn-primary"
          disabled={!data.completionSubmitted}
          onClick={() => navigate("/review-completion")}
        >
          Review Completion →
        </button>
      </div>
    </ContractorShell>
  );
}

export default ProjectMonitoringPage;
