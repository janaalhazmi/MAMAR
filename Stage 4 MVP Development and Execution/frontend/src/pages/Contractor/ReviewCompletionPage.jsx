import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ContractorShell from "../../components/ContractorShell";
import MamarMap from "../../components/MamarMap";
import Icon from "../../components/Icons";
import {
  approveCompletion,
  formatDate,
  getCompletionData,
  getConfirmedQuotationId,
  getCurrentProject,
  getQuotationById,
  requestChanges,
} from "../../services/projectFlow";

function ReviewCompletionPage() {
  const navigate = useNavigate();
  const project = getCurrentProject();

  const [data, setData] = useState(null);
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showChanges, setShowChanges] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    let active = true;

    getCompletionData(project.id)
      .then((result) => active && setData(result))
      .catch(() => active && setError("Could not load the completion details."));

    // TODO(API): return the provider with the completion payload and drop this.
    const quotationId = getConfirmedQuotationId();
    if (quotationId) {
      getQuotationById(quotationId).then((q) => active && setProvider(q));
    }

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleConfirm() {
    setSaving(true);
    setError("");
    try {
      await approveCompletion(project.id);
      navigate("/contractor-dashboard");
    } catch {
      setError("Could not confirm completion. Please try again.");
      setSaving(false);
    }
  }

  async function handleSendChanges() {
    if (!note.trim()) {
      setError("Describe the changes you need before sending.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await requestChanges(project.id, note.trim());
      navigate("/project-monitoring");
    } catch {
      setError("Could not send your request. Please try again.");
      setSaving(false);
    }
  }

  if (!data) {
    return (
      <ContractorShell activeKey="projects">
        {error ? (
          <p className="pf-alert" role="alert">
            {error}
          </p>
        ) : (
          <p className="pf-empty">Loading…</p>
        )}
      </ContractorShell>
    );
  }

  const hasLocation = project.latitude != null && project.longitude != null;

  return (
    <ContractorShell activeKey="projects">
      <Link to="/project-monitoring" className="pf-backlink">
        ‹ Back to Project Monitoring
      </Link>

      <div className="pf-title-row">
        <section className="pf-heading">
          <h1>Review Completion</h1>
          <p>Review the provider’s final submission before closing the project.</p>
        </section>
        <span className="pf-pill pf-pill-yellow">
          <i aria-hidden="true" />
          Awaiting Your Approval
        </span>
      </div>

      <section className="pf-summary pf-summary-4">
        <div className="pf-summary-item">
          <span className="pf-label">Project</span>
          <strong>{project.name}</strong>
        </div>
        <div className="pf-summary-item">
          <span className="pf-label">Service Provider</span>
          <strong>{provider?.providerName || "Not assigned"}</strong>
        </div>
        <div className="pf-summary-item">
          <span className="pf-label">Completion Date</span>
          <strong>{formatDate(data.completionDate)}</strong>
        </div>
        <div className="pf-summary-item">
          <span className="pf-label">Final Progress</span>
          <div className="pf-progress-row">
            <strong className="pf-big pf-green">{data.finalProgress}%</strong>
            <div className="pf-bar pf-bar-green" aria-hidden="true">
              <span style={{ width: `${data.finalProgress}%` }} />
            </div>
          </div>
        </div>
      </section>

      <div className="pf-two-col">
        <section className="pf-card pf-pad">
          <h2>Provider Completion Summary</h2>
          <p className="pf-sub">The provider has marked all required work as complete.</p>

          <ul className="pf-done-list">
            {data.checklist.map((item) => (
              <li key={item.id}>
                <span className="pf-tick pf-tick-green" aria-hidden="true">
                  <Icon name="check" size={14} />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.note}</small>
                </div>
                <span className="pf-pill pf-pill-green">Completed</span>
              </li>
            ))}
          </ul>

          <p className="pf-quote-note">{data.providerNote}</p>
        </section>

        <section className="pf-card pf-pad">
          <h2>Final Site Status</h2>
          <p className="pf-sub">Submitted work zone after execution.</p>
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
          <div className="pf-status-box pf-status-box-green">
            <i className="pf-dot" aria-hidden="true" />
            Execution completed by provider
          </div>
        </section>

        <section className="pf-card pf-pad">
          <h2>Final Evidence</h2>
          <p className="pf-sub">
            Final site photos submitted by {provider?.providerName || "the provider"}.
          </p>
          {/* TODO(API): evidence photos uploaded by the provider/field worker. */}
          <div className="pf-evidence">
            {data.evidence.map((photo) => (
              <img key={photo.id} src={photo.src} alt="Final site evidence" />
            ))}
          </div>
          <small className="pf-muted">Submitted {formatDate(data.submittedOn)}</small>
        </section>

        <section className="pf-card pf-pad">
          <h2>Your Decision</h2>
          <p className="pf-sub">Review the final work before closing this project.</p>

          <div className="pf-note">
            <i className="pf-dot pf-dot-yellow" aria-hidden="true" />
            Confirm only after reviewing the final work.
          </div>

          {showChanges && (
            <div className="pf-changes">
              <label htmlFor="changes-note">What needs to change?</label>
              <textarea
                id="changes-note"
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Describe what the provider should fix."
              />
            </div>
          )}

          {error && (
            <p className="pf-alert" role="alert">
              {error}
            </p>
          )}

          <div className="pf-decision-buttons">
            {showChanges ? (
              <button
                type="button"
                className="pf-btn pf-btn-secondary"
                onClick={handleSendChanges}
                disabled={saving}
              >
                Send Request
              </button>
            ) : (
              <button
                type="button"
                className="pf-btn pf-btn-secondary"
                onClick={() => setShowChanges(true)}
                disabled={saving}
              >
                Request Changes
              </button>
            )}
            <button
              type="button"
              className="pf-btn pf-btn-primary"
              onClick={handleConfirm}
              disabled={saving}
            >
              <Icon name="check" size={16} />
              {saving ? "Saving…" : "Confirm Completion"}
            </button>
          </div>
        </section>
      </div>

      <section className="pf-card pf-final-note">
        <span className="pf-tick pf-tick-green" aria-hidden="true">
          <Icon name="check" size={14} />
        </span>
        <div>
          <strong>After approval, this project will be marked as Completed.</strong>
          <p>
            The final project record and submitted evidence will remain available
            in My Projects.
          </p>
        </div>
      </section>
    </ContractorShell>
  );
}

export default ReviewCompletionPage;
