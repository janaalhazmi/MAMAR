import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/mamar-logo.svg";
import tcmLogo from "../assets/provider-tcm.jpg";
import safetyArabiaLogo from "../assets/provider-safety-arabia.jpg";
import shawahidLogo from "../assets/provider-shawahid.jpg";
import safetyTriangleLogo from "../assets/provider-safety-triangle.jpg";
import { logout, getSession } from "../services/auth";
import {
  SERVICE_LABELS,
  getCurrentProject,
  requestQuotes,
} from "../services/projectFlow";
import Icon from "../components/Icons";


const providers = [
  {
    id: 1,
    name: "TCM",
    description: "Traffic and Construction Management",
    logo: tcmLogo,
    city: "Riyadh",
    services: ["TTC Planning", "Road Signs", "Barriers"],
  },
  {
    id: 2,
    name: "Safety Arabia Co. LTD",
    description: "Traffic safety service provider",
    logo: safetyArabiaLogo,
    city: "Riyadh",
    services: ["TTC Planning", "Road Signs", "Site Safety"],
  },
  {
    id: 3,
    name: "Shawahid Roads Industrial Co.",
    description: "Road safety and traffic-control solutions",
    logo: shawahidLogo,
    city: "Riyadh",
    services: ["Road Signs", "Barriers"],
  },
  {
    id: 4,
    name: "Safety Triangle Company",
    description: "Road safety and road traffic-control solutions",
    logo: safetyTriangleLogo,
    city: "Riyadh",
    services: ["TTC Planning", "Road Signs", "Barriers"],
  },
];

const cities = ["Riyadh", "Jeddah", "Dammam"];
const serviceFilters = [
  "All Required Services",
  "TTC Planning",
  "Road Signs",
  "Barriers",
  "Site Safety",
];

function ProviderPage() {
  const navigate = useNavigate();

  // The real project (saved in sessionStorage when opened from My Projects)
  const currentProject = getCurrentProject();
  const project = {
    name: currentProject.name || "No project selected",
    location: currentProject.location || "Not specified",
    services:
      (currentProject.services || [])
        .map((id) => SERVICE_LABELS[id] || id)
        .join(" + ") || "Not specified",
  };

  const sessionUser = getSession()?.user;
  const rawName = sessionUser?.full_name || sessionUser?.name || "";
  const displayName =
    (typeof rawName === "string" ? rawName.trim() : "") || "there";
  const userInitial = displayName.charAt(0).toUpperCase();

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("Riyadh");
  const [service, setService] = useState("All Required Services");
  const [selectedIds, setSelectedIds] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const visibleProviders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return providers.filter((provider) => {
      const matchesSearch =
        !term ||
        provider.name.toLowerCase().includes(term) ||
        provider.description.toLowerCase().includes(term);
      const matchesCity = provider.city === city;
      const matchesService =
        service === "All Required Services" ||
        provider.services.includes(service);

      return matchesSearch && matchesCity && matchesService;
    });
  }, [search, city, service]);

  const toggleProvider = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((providerId) => providerId !== id)
        : [...current, id]
    );
  };

  // CHANGED: now really sends the request to the backend
  // (POST /projects/{id}/requests) with the selected provider_ids.
  const handleRequestQuotes = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one provider.");
      return;
    }

    setSending(true);
    setError("");

    try {
      // must be saved BEFORE requestQuotes(): it reads the ids from here
      sessionStorage.setItem("selectedProviders", JSON.stringify(selectedIds));
      await requestQuotes(currentProject);
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
              {providers.length} Providers Found
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
                {cities.map((item) => (
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
                {serviceFilters.map((item) => (
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
              onClick={handleRequestQuotes}
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
