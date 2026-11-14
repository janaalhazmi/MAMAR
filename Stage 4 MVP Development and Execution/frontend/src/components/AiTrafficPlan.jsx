import { useState } from "react";
import { getSession } from "../services/auth";
import { postTrafficPlan } from "../services/api";
import { useAiEnabled } from "../services/ai";
import "../styles/ai.css";

const CLOSURES = [
  ["lane_closure", "Lane closure"],
  ["shoulder_closure", "Shoulder closure"],
  ["one_lane_two_way", "One lane, two-way (flaggers)"],
  ["full_closure", "Full road closure (detour)"],
];
const ZONE_COLORS = ["#f5b800", "#f08c00", "#c9c1b4", "#d0442f", "#7a9a5a"];

// Traffic plan assistant on Create Project: fixed formulas give the zone lengths and the devices,
// and Claude explains the plan in plain words (when the AI is on).
export default function AiTrafficPlan({ startDate, endDate, onUse }) {
  const aiOn = useAiEnabled();
  const [form, setForm] = useState({
    closure_type: "lane_closure", speed_kmh: 80, lanes_total: 3, lanes_closed: 1, work_length_m: 100, night_work: false,
  });
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  const days = startDate && endDate
    ? Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1)
    : 3;

  function change(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value }));
  }

  async function suggest(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setAdded(false);
    try {
      setPlan(await postTrafficPlan(getSession()?.access_token, { ...form, duration_days: days }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function useInProject() {
    const devices = plan.devices.map((d) => `${d.qty} x ${d.name}`).join(", ");
    const zones = plan.zones.map((z) => `${z.name} ${z.length_m} m`).join(", ");
    onUse?.(`Traffic plan (${plan.closure}, ${form.speed_kmh} km/h): ${zones}. Total ${plan.total_length_m} m. Devices: ${devices}.`);
    setAdded(true);
  }

  return (
    <section className="ai-card" aria-label="Traffic plan assistant">
      <div className="ai-head">
        <div>
          <span className="ai-tag">{aiOn ? "✨ AI" : "Planner"}</span>
          <h2>Traffic Plan Assistant</h2>
          <p>Tell us about the road and get the work zone lengths and the devices you need, before you ask providers for prices.</p>
        </div>
      </div>

      <form className="ai-plan-form" onSubmit={suggest}>
        <label>Closure
          <select name="closure_type" value={form.closure_type} onChange={change}>
            {CLOSURES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>Road speed (km/h)
          <input type="number" name="speed_kmh" min="20" max="140" step="10" value={form.speed_kmh} onChange={change} />
        </label>
        <label>Lanes (one way)
          <input type="number" name="lanes_total" min="1" max="8" value={form.lanes_total} onChange={change} />
        </label>
        <label>Lanes closed
          <input type="number" name="lanes_closed" min="0" max={form.lanes_total} value={form.lanes_closed} onChange={change} />
        </label>
        <label>Work area length (m)
          <input type="number" name="work_length_m" min="10" max="5000" step="10" value={form.work_length_m} onChange={change} />
        </label>
        <label className="ai-check">
          <input type="checkbox" name="night_work" checked={form.night_work} onChange={change} /> Night work
        </label>
        <button type="submit" className="ai-btn" disabled={busy}>
          {busy ? "Planning…" : aiOn ? "✨ Suggest a traffic plan" : "Suggest a traffic plan"}
        </button>
      </form>

      {error && <p className="ai-error">{error}</p>}

      {plan && (
        <div className="ai-plan">
          <div className="ai-strip" aria-label={`Work zone, ${plan.total_length_m} m in total`}>
            {plan.zones.map((zone, index) => (
              <span key={zone.name} style={{ flexGrow: zone.length_m, background: ZONE_COLORS[index] }} title={`${zone.name}: ${zone.length_m} m`} />
            ))}
          </div>
          <p className="ai-muted">Traffic goes this way → · total length {plan.total_length_m} m · {days} day{days > 1 ? "s" : ""}</p>
          <ol className="ai-zones">
            {plan.zones.map((zone, index) => (
              <li key={zone.name}>
                <i style={{ background: ZONE_COLORS[index] }} aria-hidden="true" />
                <b>{zone.name}</b> <span>{zone.length_m} m</span>
                <small>{zone.detail}</small>
              </li>
            ))}
          </ol>

          <h3>Devices you need</h3>
          <table className="ai-table">
            <thead><tr><th>Qty</th><th>Device</th><th>Why</th></tr></thead>
            <tbody>
              {plan.devices.map((device) => (
                <tr key={device.name}><td>{device.qty}</td><td>{device.name}</td><td>{device.why}</td></tr>
              ))}
            </tbody>
          </table>

          {plan.explanation && (
            <div className="ai-explain">
              <h3>✨ In plain words</h3>
              <p>{plan.explanation.summary}</p>
              {plan.explanation.steps.length > 0 && (
                <>
                  <h4>Set-up order</h4>
                  <ol>{plan.explanation.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                </>
              )}
              {plan.explanation.risks.length > 0 && (
                <>
                  <h4>Watch out for</h4>
                  <ul className="ai-risks">{plan.explanation.risks.map((risk) => <li key={risk}>{risk}</li>)}</ul>
                </>
              )}
            </div>
          )}

          {plan.notes.length > 0 && <ul className="ai-notes">{plan.notes.map((note) => <li key={note}>{note}</li>)}</ul>}
          <p className="ai-foot">A guide from standard work zone formulas. The final plan follows the municipality permit and the Saudi TTC manual.</p>
          {onUse && (
            <button type="button" className="ai-btn ghost" onClick={useInProject} disabled={added}>
              {added ? "Added to the description ✓" : "Add this plan to the project description"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
