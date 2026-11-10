import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContractorShell from "../../components/ContractorShell";
import Icon from "../../components/Icons";
import {
  SERVICE_LABELS,
  fetchProjects,
  formatDate,
  formatPrice,
  getQuotations,
  handleAcceptQuotation,
  handleRejectQuotation,
} from "../../services/Contractor/Contractor";

function normalizeStatus(status) {
  if (status === "rejected") return "rejected";
  if (status === "accepted") return "accepted";
  return "received";
}

function QuotationsPage() {
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCompare, setShowCompare] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadAllQuotations() {
      setLoading(true);
      setError("");

      try {
        // Load every contractor project, then fetch its quotations.
        const projects = await fetchProjects();

        const results = await Promise.allSettled(
          projects.map(async (project) => {
            const projectQuotes = await getQuotations(project.id);
            return projectQuotes.map((quotation) => ({
              ...quotation,
              status: normalizeStatus(
                quotation.backendStatus || quotation.status
              ),
              projectId: project.id,
              projectName: project.name || `Project #${project.id}`,
              project,
            }));
          })
        );

        if (!active) return;

        const successfulQuotes = [];
        const failedProjects = [];

        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            successfulQuotes.push(...result.value);
          } else {
            failedProjects.push(projects[index]?.name || `Project #${projects[index]?.id}`);
          }
        });

        // Newest quotations first when the API provides a creation date.
        successfulQuotes.sort((a, b) =>
          String(b.createdAt || b.created_at || "").localeCompare(
            String(a.createdAt || a.created_at || "")
          )
        );

        setQuotations(successfulQuotes);

        if (failedProjects.length) {
          setError(
            `Could not load quotations for: ${failedProjects.join(", ")}. Other quotations are still shown.`
          );
        } else if (projects.length === 0) {
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Could not load your projects and quotations.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAllQuotations();

    return () => {
      active = false;
    };
  }, []);

  const filteredQuotations = useMemo(() => {
    const term = search.trim().toLowerCase();

    return quotations.filter((quotation) => {
      const matchesSearch =
        !term ||
        quotation.projectName?.toLowerCase().includes(term) ||
        quotation.providerName?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" || quotation.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotations, search, statusFilter]);

  const received = filteredQuotations.filter(
    (quotation) => quotation.status === "received"
  );

  const counts = {
    all: quotations.length,
    received: quotations.filter((q) => q.status === "received").length,
    accepted: quotations.filter((q) => q.status === "accepted").length,
    rejected: quotations.filter((q) => q.status === "rejected").length,
  };

  async function handleReject(quotation) {
    setError("");
    setRejectingId(quotation.id);

    try {
      const updated = await handleRejectQuotation(quotations, quotation);
      setQuotations(
        updated.map((item) =>
          item.id === quotation.id
            ? { ...item, status: "rejected", backendStatus: "rejected" }
            : item
        )
      );
    } catch (err) {
      setError(err.message || "Could not reject this quotation. Please try again.");
    } finally {
      setRejectingId(null);
    }
  }

  function handleAccept(quotation) {
    handleAcceptQuotation(quotation);

    navigate("/payment", {
      state: {
        quotation,
        project: quotation.project,
      },
    });
  }

  return (
    <ContractorShell activeKey="quotations">
      <div className="pf-heading">
        <h1>Quotations</h1>
        <p>View and manage quotations received across all your projects.</p>
      </div>

      <div className="pf-quote-overview">
        <div className="pf-card pf-quote-overview-card">
          <span className="pf-label">All quotations</span>
          <strong>{counts.all}</strong>
        </div>
        <div className="pf-card pf-quote-overview-card">
          <span className="pf-label">Awaiting decision</span>
          <strong>{counts.received}</strong>
        </div>
        <div className="pf-card pf-quote-overview-card">
          <span className="pf-label">Accepted</span>
          <strong>{counts.accepted}</strong>
        </div>
        <div className="pf-card pf-quote-overview-card">
          <span className="pf-label">Rejected</span>
          <strong>{counts.rejected}</strong>
        </div>
      </div>

      <div className="pf-quotation-toolbar">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by project or provider..."
          aria-label="Search quotations"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter quotations by status"
        >
          <option value="all">All statuses</option>
          <option value="received">Awaiting decision</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && (
        <p className="pf-alert" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="pf-empty">Loading quotations from your projects…</p>
      ) : filteredQuotations.length === 0 ? (
        <div className="pf-empty-state">
          <h2>
            {quotations.length === 0
              ? "No quotations received yet"
              : "No quotations match your search"}
          </h2>
          <p>
            {quotations.length === 0
              ? "When providers submit prices for any of your projects, their quotations will appear here."
              : "Try changing your search or status filter."}
          </p>
          {quotations.length === 0 && (
            <button
              type="button"
              className="pf-btn pf-btn-primary"
              onClick={() => navigate("/my-projects")}
            >
              View My Projects
            </button>
          )}
        </div>
      ) : (
        <div className="pf-quote-grid">
          {filteredQuotations.map((quotation) => {
            const rejected = quotation.status === "rejected";
            const accepted = quotation.status === "accepted";
            const locked = rejected || accepted;

            return (
              <article
                key={`${quotation.projectId}-${quotation.id}`}
                className={`pf-card pf-quote ${
                  rejected ? "pf-quote-rejected" : ""
                }`}
              >
                <div className="pf-quote-project">
                  <span className="pf-label">Project</span>
                  <strong>{quotation.projectName}</strong>
                </div>

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
                      {(quotation.providerName || "P").charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <h3>{quotation.providerName}</h3>
                    <p>{quotation.providerDescription}</p>
                    <span
                      className={`pf-pill ${
                        rejected
                          ? "pf-pill-red"
                          : accepted
                            ? "pf-pill-green"
                            : "pf-pill-yellow"
                      }`}
                    >
                      <i aria-hidden="true" />
                      {accepted
                        ? "Accepted"
                        : rejected
                          ? "Rejected"
                          : "Awaiting decision"}
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
                    <strong className="pf-mid">
                      {quotation.durationDays} Days
                    </strong>
                  </div>
                </div>

                <div className="pf-quote-services">
                  <span className="pf-label">Included Services</span>
                  {quotation.services?.length ? (
                    <ul>
                      {quotation.services.map((service, index) => (
                        <li key={`${service}-${index}`}>
                          <Icon name="check" size={14} />
                          {SERVICE_LABELS[service] || service}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="pf-muted">No service details provided.</p>
                  )}
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

                {quotation.startDate && (
                  <div className="pf-quote-services">
                    <span className="pf-label">Proposed Start Date</span>
                    <p className="pf-muted">{formatDate(quotation.startDate)}</p>
                  </div>
                )}

                <div className="pf-quote-actions">
                  <button
                    type="button"
                    className="pf-btn pf-btn-reject"
                    disabled={locked || rejectingId === quotation.id}
                    onClick={() => handleReject(quotation)}
                  >
                    {rejectingId === quotation.id ? "Rejecting…" : "✕ Reject"}
                  </button>
                  <button
                    type="button"
                    className="pf-btn pf-btn-accept"
                    disabled={locked}
                    onClick={() => handleAccept(quotation)}
                  >
                    <Icon name="check" size={16} />
                    {accepted ? "Accepted" : "Accept"}
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
            <p>
              Compare prices, durations and services across your projects.
            </p>
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
                <th>Project</th>
                <th>Provider</th>
                <th>Total price</th>
                <th>Duration</th>
                <th>Start date</th>
                <th>Services</th>
              </tr>
            </thead>
            <tbody>
              {received.map((quotation) => (
                <tr key={`${quotation.projectId}-${quotation.id}`}>
                  <td>{quotation.projectName}</td>
                  <td>{quotation.providerName}</td>
                  <td>{formatPrice(quotation.totalPrice)}</td>
                  <td>{quotation.durationDays} days</td>
                  <td>{formatDate(quotation.startDate)}</td>
                  <td>{quotation.services?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ContractorShell>
  );
}

export default QuotationsPage;
