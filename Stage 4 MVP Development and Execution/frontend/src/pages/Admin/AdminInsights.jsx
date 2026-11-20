import { useEffect, useState } from "react";
import AdminMap from "../../components/AdminMap";
import { fetchAdminActivity, fetchAdminProjects } from "../../services/api";
import "../../styles/extras.css";

const LEGEND = [
  ["Active", "#228b4a"],
  ["Draft", "#f5b800"],
  ["Completed", "#5a6ea0"],
  ["Cancelled", "#b43c32"],
];

function when(value) {
  // The server saves UTC times without a zone mark; add it so Riyadh time is shown.
  const text = /[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`;
  return new Date(text).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// The admin map of all work zones and the audit log (who did what and when).
export default function AdminInsights({ token }) {
  const [projects, setProjects] = useState([]);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([fetchAdminProjects(token), fetchAdminActivity(token, 60)])
      .then(([projectRows, activityRows]) => {
        if (!active) return;
        setProjects(projectRows);
        setActivity(activityRows);
      })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [token]);

  return (
    <>
      <section className="adm-card">
        <h2>Work Zones in Riyadh</h2>
        <p className="adm-sub">{projects.length} projects with a saved location. Click a point for details.</p>
        <div className="adm-legend">
          {LEGEND.map(([label, color]) => (
            <span key={label}><i style={{ background: color }} />{label}</span>
          ))}
        </div>
        <AdminMap projects={projects} />
      </section>

      <section className="adm-card">
        <h2>Recent Activity</h2>
        <p className="adm-sub">Who did what and when, newest first.</p>
        {error && <p className="adm-error" role="alert">{error}</p>}
        <ul className="adm-activity">
          {activity.map((row) => (
            <li key={row.activity_id}>
              <time>{when(row.created_at)}</time>
              <span><b>{row.user_name || "Deleted user"}</b> ({row.user_role || "-"}): {row.detail}</span>
            </li>
          ))}
          {!error && activity.length === 0 && <li>No activity yet.</li>}
        </ul>
      </section>
    </>
  );
}
