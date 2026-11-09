import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ContractorShell from "../../components/ContractorShell";
import Icon from "../../components/Icons";
import {
  NEXT_STEPS,
  SERVICE_LABELS,
  formatDate,
  formatDateRange,
  formatPrice,
  getCurrentProject,
  getSelectedQuotation,
  handleConfirmProvider,
} from "../../services/Contractor/Contractor";

function SelectProviderPage() {
  const navigate = useNavigate();
  const project = getCurrentProject();

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getSelectedQuotation()
      .then((data) => active && setQuotation(data))
      .catch(() => active && setError("Could not load this quotation."))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  async function onConfirm() {
    setSaving(true);
    setError("");
    try {
      await handleConfirmProvider(project, quotation);
      navigate("/project-monitoring");
    } catch (err) {
      setError(err.message || "Could not confirm the provider. Please try again.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <ContractorShell activeKey="quotations">
        <p className="pf-empty">Loading…</p>
      </ContractorShell>
    );
  }
  if (!quotation) {
    return (
      <ContractorShell activeKey="quotations">
        <section className="pf-heading">
          <h1>Select Provider</h1>
          <p>No quotation selected yet. Choose one to continue.</p>
        </section>
        <div className="pf-actions">
          <button
            type="button"
            className="pf-btn pf-btn-primary"
            onClick={() => navigate("/quotations")}
          >
            Go to Quotations
          </button>
        </div>
      </ContractorShell>
    );
  }

  return (
    <ContractorShell activeKey="quotations">
      <Link to="/quotations" className="pf-backlink">
        ‹ Back to Quotations
      </Link>

      <section className="pf-heading">
        <h1>Select Provider</h1>
        <p>
          Review the selected quotation before confirming the service provider
          for your project.
        </p>
      </section>

      <section className="pf-summary">
        <div className="pf-summary-item">
          <span className="pf-label">Project</span>
          <strong>{project.name}</strong>
        </div>
        <div className="pf-summary-item">
          <span className="pf-label">Location</span>
          <strong>{project.location || "Not specified"}</strong>
        </div>
        <div className="pf-summary-item">
          <span className="pf-label">Project Dates</span>
          <strong>{formatDateRange(project.startDate, project.endDate)}</strong>
        </div>
        <span className="pf-pill pf-pill-green">
          <i aria-hidden="true" />
          Ready to Confirm
        </span>
      </section>

      <div className="pf-two-col">
        <section className="pf-card pf-pad">
          <h2>Selected Provider</h2>
          <p className="pf-sub">The quotation you selected from the previous page.</p>

          <div className="pf-selected">
            <img
              className="pf-logo"
              src={quotation.providerLogo}
              alt={`${quotation.providerName} logo`}
            />
            <div>
              <h3>{quotation.providerName}</h3>
              <p>{quotation.providerDescription}</p>
              <span className="pf-pill pf-pill-green">
                <i aria-hidden="true" />
                Selected
              </span>
            </div>
            <span className="pf-tick" aria-hidden="true">
              <Icon name="check" size={16} />
            </span>
          </div>

          <h3 className="pf-subhead">Quotation Details</h3>
          <div className="pf-tiles">
            <div className="pf-tile">
              <span className="pf-label">Total Price</span>
              <strong className="pf-big">{formatPrice(quotation.totalPrice)}</strong>
            </div>
            <div className="pf-tile">
              <span className="pf-label">Duration</span>
              <strong className="pf-big">{quotation.durationDays} Days</strong>
            </div>
            <div className="pf-tile">
              <span className="pf-label">Start Date</span>
              <strong className="pf-mid">{formatDate(quotation.startDate)}</strong>
            </div>
          </div>

          <div className="pf-included">
            <div>
              <span className="pf-label">Included Services</span>
              <ul className="pf-checklist">
                {quotation.services.map((id) => (
                  <li key={id}>
                    <Icon name="check" size={14} />
                    {SERVICE_LABELS[id] || id}
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              className="pf-btn pf-btn-primary pf-btn-sm"
              onClick={() => navigate("/quotations")}
            >
              Change Provider
            </button>
          </div>
        </section>

        <section className="pf-card pf-pad">
          <h2>What happens next?</h2>
          <p className="pf-sub">After confirming this provider:</p>

          <ol className="pf-steps">
            {NEXT_STEPS.map((step, index) => (
              <li key={step.title}>
                <span className="pf-step-num">{index + 1}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="pf-note">
            <Icon name="check" size={16} />
            Confirming will assign this provider to your project.
          </div>
        </section>
      </div>

      {error && (
        <p className="pf-alert" role="alert">
          {error}
        </p>
      )}

      <section className="pf-confirm-bar">
        <div className="pf-confirm-text">
          <span className="pf-tick pf-tick-soft" aria-hidden="true">
            <Icon name="check" size={16} />
          </span>
          <strong>Confirm {quotation.providerName} as your service provider?</strong>
        </div>
        <div className="pf-confirm-buttons">
          <button
            type="button"
            className="pf-btn pf-btn-secondary"
            onClick={() => navigate("/quotations")}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="pf-btn pf-btn-primary"
            onClick={handleConfirm}
            disabled={saving}
          >
            {saving ? "Confirming…" : "Confirm Provider →"}
          </button>
        </div>
      </section>
    </ContractorShell>
  );
}

export default SelectProviderPage;
