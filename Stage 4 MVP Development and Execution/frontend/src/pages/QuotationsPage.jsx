import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContractorShell from "../components/ContractorShell";
import Icon from "../components/Icons";
import {
  SERVICE_LABELS,
  formatDate,
  formatPrice,
  getCurrentProject,
  getQuotations,
  rejectQuotation,
  saveSelectedQuotation,
} from "../services/projectFlow";

const REFRESH_MS = 30000;

function QuotationsPage() {
  const navigate = useNavigate();
  const project = getCurrentProject();

  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    let active = true;

    if (project.id == null) {
      setLoading(false);
      return undefined;
    }

    // silent = background refresh: do not show errors or the loading text.
    const load = (silent) =>
      getQuotations(project.id)
        .then((data) => {
          if (!active) return;
          setQuotations(data);
          setError("");
        })
        .catch((err) => {
          if (active && !silent) {
            setError(err.message || "Could not load quotations. Please try again.");
          }
        })
        .finally(() => active && setLoading(false));

    load(false);
    const timer = setInterval(() => load(true), REFRESH_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [project.id]);

  const received = quotations.filter((q) => q.status === "received");
  const requestedCount = quotations.length;

  async function handleReject(quotation) {
    try {
      await rejectQuotation(quotation.id);
      setQuotations((current) =>
        current.map((q) =>
          q.id === quotation.id ? { ...q, status: "rejected" } : q
        )
      );
    } catch (err) {
      setError(err.message || "Could not reject this quotation. Please try again.");
    }
  }

  function handleAccept(quotation) {
    saveSelectedQuotation(quotation.id);
    navigate("/quotations/select");
  }

  // Opened from the sidebar without a project.
  if (project.id == null) {
    return (
      <ContractorShell activeKey="quotations">
        <section className="pf-heading">
          <h1>Quotations</h1>
          <p>Open a project from My Projects to see its quotations.</p>
        </section>
        <div className="pf-actions">
          <button
            type="button"
            className="pf-btn pf-btn-primary"
            onClick={() => navigate("/my-projects")}
          >
            Go to My Projects
          </button>
        </div>
      </ContractorShell>
    );
  }

  return (
    <ContractorShell activeKey="quotations">
      <section className="pf-heading">
        <h1>Quotations</h1>
        <p>Review and compare quotations received for your project.</p>
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
          <span className="pf-label">Services</span>
          <strong>
            {(project.services || [])
              .map((id) => SERVICE_LABELS[id] || id)
              .join(" + ") || "Not specified"}
          </strong>
        </div>
        <span className="pf-pill pf-pill-yellow">
          <i aria-hidden="true" />
          {received.length} {received.length === 1 ? "Quote" : "Quotes"} Received
        </span>
      </section>

      <section className="pf-section">
        <h2>Received Quotations</h2>
        <p className="pf-sub">
          Prices and estimated durations are provided by each provider based on
          project requirements. This page refreshes automatically.
        </p>
      </section>

      {error && (
        <p className="pf-alert" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="pf-empty">Loading quotations…</p>
      ) : quotations.length === 0 ? (
        <p className="pf-empty">
          No quotations yet. Providers will appear here as soon as they send a
          price.
        </p>
      ) : (
        <div className="pf-quote-grid">
          {quotations.map((quotation) => {
            const rejected = quotation.status === "rejected";

            return (
              <article
                key={quotation.id}
                className={`pf-card pf-quote ${rejected ? "pf-quote-rejected" : ""}`}
              >
                <div className="pf-quote-head">
                  {quotation.providerLogo ? (
                    <img
                      className="pf-logo"
                      src={quotation.providerLogo}
                      alt={`${quotation.providerName} logo`}
                    />
                  ) : (
                    <div
                      className="pf-logo"
                      aria-hidden="true"
                      style={{
                        display: "grid",
                        placeItems: "center",
                        background: "#fff8e1",
                        color: "#b8860b",
                        fontSize: 22,
                        fontWeight: 700,
                      }}
                    >
                      {quotation.providerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3>{quotation.providerName}</h3>
                    <p>{quotation.providerDescription}</p>
                    <span
                      className={`pf-pill ${rejected ? "pf-pill-red" : "pf-pill-green"}`}
                    >
                      <i aria-hidden="true" />
                      {rejected ? "Rejected" : "Received"}
                    </span>
                  </div>
                </div>

                <div className="pf-quote-stats">
                  <div>
                    <span className="pf-label">Total Price</span>
                    <strong className="pf-big">
                      {formatPrice(quotation.totalPrice)}
                    </strong>
                  </div>
                  <div>
                    <span className="pf-label">Estimated Duration</span>
                    <strong className="pf-mid">{quotation.durationDays} Days</strong>
                  </div>
                </div>

                <div className="pf-quote-services">
                  <span className="pf-label">Included Services</span>
                  <ul>
                    {quotation.services.map((id) => (
                      <li key={id}>
                        <Icon name="check" size={14} />
                        {SERVICE_LABELS[id] || id}
                      </li>
                    ))}
                  </ul>
                </div>

                {quotation.notes && (
                  <div className="pf-quote-services">
                    <span className="pf-label">Price Breakdown &amp; Notes</span>
                    <p
                      className="pf-muted"
                      style={{ whiteSpace: "pre-line", marginTop: 6 }}
                    >
                      {quotation.notes}
                    </p>
                  </div>
                )}

                <div className="pf-quote-actions">
                  <button
                    type="button"
                    className="pf-btn pf-btn-reject"
                    disabled={rejected}
                    onClick={() => handleReject(quotation)}
                  >
                    <span aria-hidden="true">✕</span> Reject
                  </button>
                  <button
                    type="button"
                    className="pf-btn pf-btn-accept"
                    disabled={rejected}
                    onClick={() => handleAccept(quotation)}
                  >
                    <Icon name="check" size={16} /> Accept
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {received.length > 1 && (
        <section className="pf-compare-banner">
          <div>
            <h2>Compare Quotations</h2>
            <p>Compare price, duration and included services before selecting a provider.</p>
          </div>
          <button
            type="button"
            className="pf-btn pf-btn-primary"
            onClick={() => setShowCompare((value) => !value)}
          >
            {showCompare ? "Hide Comparison" : "Compare Quotes →"}
          </button>
        </section>
      )}

      {showCompare && received.length > 1 && (
        <div className="pf-table-wrap">
          <table className="pf-table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Total price</th>
                <th>Duration</th>
                <th>Start date</th>
                <th>Services</th>
              </tr>
            </thead>
            <tbody>
              {received.map((q) => (
                <tr key={q.id}>
                  <td>{q.providerName}</td>
                  <td>{formatPrice(q.totalPrice)}</td>
                  <td>{q.durationDays} days</td>
                  <td>{formatDate(q.startDate)}</td>
                  <td>{q.services.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="pf-section">
        <h2>Quote Requests</h2>
        <div className="pf-card pf-request-row">
          <span>
            <Icon name="check" size={14} />
            {received.length} of {requestedCount} quotations still open
          </span>
          <span className="pf-muted">
            {requestedCount === 0 ? "Waiting for providers" : "Review and decide"}
          </span>
        </div>
      </section>

      <div className="pf-actions">
        <button
          type="button"
          className="pf-btn pf-btn-secondary"
          onClick={() => navigate("/providers")}
        >
          ← Back
        </button>
      </div>
    </ContractorShell>
  );
}

export default QuotationsPage;
