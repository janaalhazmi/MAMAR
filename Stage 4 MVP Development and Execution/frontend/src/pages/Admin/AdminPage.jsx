import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/mamar-logo.svg";
import { getSession, logout } from "../../services/auth";
import {
  fetchAdminCompanies,
  fetchAdminSummary,
  fetchAdminUsers,
  patchAdminUser,
  postAdminUser,
} from "../../services/api";
import "../../styles/Admin/admin.css";
import AdminInsights from "./AdminInsights";
import AdminServices from "./AdminServices";

const TABS = [
  { role: "contractor", label: "Contractors" },
  { role: "provider", label: "Service Providers" },
  { role: "worker", label: "Field Workers" },
];

const EMPTY_FORM = { full_name: "", email: "", password: "", phone: "", role: "contractor", provider_id: "" };

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en-GB") : "—";
}

function AddUserForm({ token, companies, onAdded, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const needsCompany = form.role !== "contractor";

  const change = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const user = await postAdminUser(token, {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim() || null,
        role: form.role,
        provider_id: needsCompany ? Number(form.provider_id) : null,
      });
      onAdded(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="adm-modal" role="dialog" aria-label="Add user">
      <form className="adm-card adm-form" onSubmit={submit}>
        <h2>Add User</h2>
        <label>
          Account type
          <select value={form.role} onChange={change("role")}>
            {TABS.map((tab) => (
              <option key={tab.role} value={tab.role}>{tab.label.replace(/s$/, "")}</option>
            ))}
          </select>
        </label>
        <label>Full name<input required value={form.full_name} onChange={change("full_name")} /></label>
        <label>Email<input required type="email" value={form.email} onChange={change("email")} /></label>
        <label>
          Password (8+ characters)
          <input required minLength={8} type="password" value={form.password} onChange={change("password")} />
        </label>
        <label>Phone (optional)<input value={form.phone} onChange={change("phone")} /></label>
        {needsCompany && (
          <label>
            Company
            <select required value={form.provider_id} onChange={change("provider_id")}>
              <option value="">Select a company…</option>
              {companies.map((company) => (
                <option key={company.provider_id} value={company.provider_id}>{company.company_name}</option>
              ))}
            </select>
          </label>
        )}
        {error && <p className="adm-error" role="alert">{error}</p>}
        <div className="adm-actions">
          <button type="button" className="adm-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="adm-primary" disabled={saving}>{saving ? "Saving…" : "Add User"}</button>
        </div>
      </form>
    </div>
  );
}

function AdminPage() {
  const navigate = useNavigate();
  const session = getSession();
  const token = session?.access_token;

  const [tab, setTab] = useState("contractor");
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  const loadSummary = useCallback(() => {
    fetchAdminSummary(token).then(setSummary).catch((err) => setError(err.message));
  }, [token]);

  useEffect(() => {
    loadSummary();
    fetchAdminCompanies(token).then(setCompanies).catch(() => {});
  }, [token, loadSummary]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      fetchAdminUsers(token, tab, search.trim())
        .then((rows) => { if (active) setUsers(rows); })
        .catch((err) => { if (active) setError(err.message); })
        .finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [token, tab, search]);

  async function toggleActive(user) {
    setError("");
    try {
      const updated = await patchAdminUser(token, user.user_id, { is_active: !user.is_active });
      setUsers((rows) => rows.map((row) => (row.user_id === updated.user_id ? updated : row)));
    } catch (err) {
      setError(err.message);
    }
  }

  function handleAdded(user) {
    setAdding(false);
    loadSummary();
    if (user.role === tab) setUsers((rows) => [user, ...rows]);
    else setTab(user.role);
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const projects = summary?.projects || {};
  const cards = [
    { label: "Contractors", value: summary?.contractors },
    { label: "Service Providers", value: summary?.providers },
    { label: "Field Workers", value: summary?.workers },
    { label: "Companies", value: summary?.companies },
    { label: "Active Projects", value: projects.active ?? 0 },
    { label: "Completed Projects", value: projects.completed ?? 0 },
  ];
  const showCompany = tab !== "contractor";

  return (
    <div className="adm-page">
      <header className="adm-header">
        <img src={logo} alt="MAMAR" className="adm-logo" />
        <div className="adm-user">
          <span>{session?.user?.full_name || "Admin"}</span>
          <button type="button" className="adm-ghost" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <main className="adm-main">
        <div className="adm-title">
          <div>
            <h1>Admin Dashboard</h1>
            <p>All contractors, service providers and field workers on MAMAR.</p>
          </div>
          <button type="button" className="adm-primary" onClick={() => setAdding(true)}>+ Add User</button>
        </div>

        <section className="adm-stats">
          {cards.map((card) => (
            <div className="adm-card adm-stat" key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value ?? "—"}</strong>
            </div>
          ))}
        </section>

        <section className="adm-card">
          <div className="adm-toolbar">
            <div className="adm-tabs" role="tablist">
              {TABS.map((item) => (
                <button
                  key={item.role}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.role}
                  className={tab === item.role ? "active" : ""}
                  onClick={() => setTab(item.role)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <input
              className="adm-search"
              placeholder="Search by name or email…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {error && <p className="adm-error" role="alert">{error}</p>}

          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  {showCompany && <th>Company</th>}
                  <th>{tab === "worker" ? "Open assignments" : "Projects"}</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {!loading && users.length === 0 && (
                  <tr><td colSpan={showCompany ? 8 : 7} className="adm-empty">No users found.</td></tr>
                )}
                {users.map((user) => (
                  <tr key={user.user_id}>
                    <td>{user.full_name}</td>
                    <td>{user.email}</td>
                    <td>{user.phone || "—"}</td>
                    {showCompany && <td>{user.company_name || "—"}</td>}
                    <td>{user.projects}</td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>
                      <span className={`adm-badge ${user.is_active ? "on" : "off"}`}>
                        {user.is_active ? "Active" : "Stopped"}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="adm-ghost" onClick={() => toggleActive(user)}>
                        {user.is_active ? "Stop login" : "Allow login"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading && <p className="adm-empty">Loading…</p>}
          </div>
        </section>

        <AdminServices token={token} />
        <AdminInsights token={token} />
      </main>

      {adding && (
        <AddUserForm token={token} companies={companies} onAdded={handleAdded} onClose={() => setAdding(false)} />
      )}
    </div>
  );
}

export default AdminPage;
