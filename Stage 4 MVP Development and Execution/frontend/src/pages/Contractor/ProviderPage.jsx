import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/mamar-logo.svg";
import Icon from "../../components/Icons";
import { logout } from "../../services/auth";
import {
  CITIES,
  PROVIDERS,
  SERVICE_FILTERS,
  filterProviders,
  getCurrentProject,
  getDisplayUser,
  getProviderPageSummary,
  handleRequestQuotes,
} from "../../services/Contractor/Contractor";

function ProviderPage() {
  const navigate = useNavigate();

  const currentProject = getCurrentProject();
  const project = getProviderPageSummary(currentProject);
  const { displayName, userInitial } = getDisplayUser();

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("Riyadh");
  const [service, setService] = useState("All Required Services");
  const [selectedIds, setSelectedIds] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const visibleProviders = useMemo(
    () => filterProviders({ search, city, service }),
    [search, city, service]
  );

  const toggleProvider = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  };

  const onRequestQuotes = async () => {
    setSending(true);
    setError("");
    try {
      await handleRequestQuotes(currentProject, selectedIds);
      navigate("/quotations");
    } catch (err) {
      setError(err.message || "Could not send the request. Please try again.");
      setSending(false);
    }
  };

  return (
    <div className="cd-page">
      {/* Header */}
      <header className="cd-header">
        <Link
          to="/contractor-dashboard"
          className="cd-header-logo"
          aria-label="MAMAR Dashboard"
        >
          <img src={logo} alt="MAMAR" />
        </Link>

        <div className="cd-user">
          <div className="cd-user-avatar">{userInitial}</div>
          <div className="cd-user-info">
            <strong>{displayName}</strong>
            <span>Contractor</span>
          </div>
        </div>
      </header>

      <div className="cd-body">
        {/* Sidebar */}
        <aside className="cd-sidebar">
          <nav className="cd-nav" aria-label="Main navigation">
            <Link to="/contractor-dashboard">
              <Icon name="dashboard" />
              <span>Dashboard</span>
            </Link>

            <Link to="/contractor-dashboard#projects">
              <Icon name="projects" />
              <span>My Projects</span>
            </Link>

            <Link to="/create-project">
              <Icon name="create" />
              <span>Create Project</span>
            </Link>

            <Link to="/providers" className="cd-nav-active">
              <Icon name="providers" />
              <span>Providers</span>
            </Link>

            <Link to="/quotations">
              <Icon name="quotations" />
              <span>Quotations</span>
            </Link>
          </nav>

          <div className="cd-sidebar-bottom">
            <Link to="/data-disclaimer">
              <Icon name="info" />
              <span>Data Disclaimer</span>
            </Link>

            <Link to="/help">
              <Icon name="help" />
              <span>Help &amp; Support</span>
            </Link>

            <Link to="/login" onClick={logout}>
              <Icon name="logout" />
              <span>Log out</span>
            </Link>
          </div>
        </aside>

        {/* Main */}
        <main className="cd-main pv-main">
          <section className="pv-heading">
            <h1>Matching Service Providers</h1>
            <p>
              Select providers that match your project location and required
              services.
            </p>
          </section>

          {/* Project summary */}
          <section className="pv-summary">
            <div className="pv-summary-item">
              <span className="pv-label">PROJECT</span>
              <strong>{project.name}</strong>
            </div>

            <div className="pv-summary-item">
              <span className="pv-label">LOCATION</span>
              <strong>{project.location}</strong>
            </div>

            <div className="pv-summary-item">
              <span className="pv-label">REQUIRED SERVICES</span>
              <strong>{project.services}</strong>
            </div>

            <span className="pv-found">
              <i aria-hidden="true" />
              {visibleProviders.length} Providers Found
            </span>
          </section>

          {/* Filters */}
          <section className="pv-filters">
            <label className="pv-search">
              <Icon name="target" size={16} />
              <input
                type="text"
                placeholder="Search providers"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <div className="pv-select">
              <select
                value={city}
                onChange={(event) => setCity(event.target.value)}
                aria-label="City"
              >
                {CITIES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div className="pv-select pv-select-wide">
              <select
                value={service}
                onChange={(event) => setService(event.target.value)}
                aria-label="Required services"
              >
                {SERVICE_FILTERS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <span className="pv-selected-count">
              {selectedIds.length} provider
              {selectedIds.length === 1 ? "" : "s"} selected
            </span>
          </section>

          {/* Provider cards */}
          <section className="pv-grid" aria-label="Providers">
            {visibleProviders.map((provider) => {
              const isSelected = selectedIds.includes(provider.id);

              return (
                <article
                  key={provider.id}
                  className={`pv-card ${isSelected ? "pv-card-selected" : ""}`}
                  onClick={() => toggleProvider(provider.id)}
                >
                  <button
                    type="button"
                    className={`pv-check ${isSelected ? "pv-check-on" : ""}`}
                    aria-pressed={isSelected}
                    aria-label={`Select ${provider.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleProvider(provider.id);
                    }}
                  >
                    {isSelected && <Icon name="check" size={14} />}
                  </button>

                  <div className="pv-card-top">
                    <img
                      className="pv-logo"
                      src={provider.logo}
                      alt={`${provider.name} logo`}
                    />

                    <div className="pv-card-info">
                      <h3>{provider.name}</h3>
                      <p>{provider.description}</p>
                      <span className="pv-match">
                        <i aria-hidden="true" />
                        Project Match
                      </span>
                    </div>
                  </div>

                  <div className="pv-tags">
                    {provider.services.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </article>
              );
            })}

            {visibleProviders.length === 0 && (
              <p className="pv-empty">
                No providers match your search. Try changing the filters.
              </p>
            )}
          </section>

          {/* CHANGED: error message */}
          {error && (
            <p role="alert" style={{ color: "crimson", margin: "12px 0" }}>
              {error}
            </p>
          )}

          {/* Actions */}
          <footer className="pv-actions">
            <button
              type="button"
              className="pv-back"
              onClick={() => navigate(-1)}
              disabled={sending}
            >
              ← Back
            </button>

            <button
              type="button"
              className="pv-request"
              onClick={onRequestQuotes}
              disabled={sending}
            >
              <Icon name="quotations" size={18} />
              {sending
                ? "Sending…"
                : `Request Quotes (${selectedIds.length})`}
              <Icon name="logout" size={16} />
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default ProviderPage;