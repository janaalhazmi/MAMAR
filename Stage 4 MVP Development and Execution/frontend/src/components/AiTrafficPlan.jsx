import { useState } from "react";
import { getSession } from "../services/auth";
import { postTrafficPlan } from "../services/api";
import { useAiEnabled } from "../services/ai";
import "../styles/trafficplan.css";

const CLOSURES = [
  ["lane_closure", "Lane closure"],
  ["shoulder_closure", "Shoulder closure"],
  ["one_lane_two_way", "One lane, two-way (flaggers)"],
  ["full_closure", "Full road closure (detour)"],
];
const ZONE_COLORS = ["#ffcc00", "#f59e0b", "#d0d5dd", "#ef4444", "#22c55e"];

// Traffic plan helper on Create Project, in the same style as the project form.
// Fixed formulas give the zone lengths and the devices; Claude explains them when the AI is on.
export default function AiTrafficPlan({ startDate, endDate, onUse }) {
  const aiOn = useAiEnabled();
  const [open, setOpen] = useState(false);
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
    <section className="tp-section" aria-label="Traffic plan assistant">
      <h2>
        Traffic Plan Assistant <span className="tp-optional">Optional</span>
      </h2>

      <div className="tp-card">
        <div className="tp-intro">
          <div className="tp-icon" aria-hidden="true">🚧</div>
          <div>
            <strong>Not sure what your work zone needs?</strong>
            <p>
              Answer a few questions about the road and get the work zone lengths and the list of devices,
              before you ask providers for prices.
            </p>
          </div>
          <button type="button" className="tp-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
            {open ? "Hide" : "Plan it"}
          </button>
        </div>

        {open && (
          <form className="tp-form" onSubmit={suggest}>
            <div className="tp-grid">
              <div className="create-project-field">
                <label htmlFor="tp-closure">Closure type</label>
                <select id="tp-closure" name="closure_type" value={form.closure_type} onChange={change}>
                  {CLOSURES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div className="create-project-field">
                <label htmlFor="tp-speed">Road speed (km/h)</label>
                <input id="tp-speed" type="number" name="speed_kmh" min="20" max="140" step="10" value={form.speed_kmh} onChange={change} />
              </div>
              <div className="create-project-field">
                <label htmlFor="tp-lanes">Lanes in one direction</label>
                <input id="tp-lanes" type="number" name="lanes_total" min="1" max="8" value={form.lanes_total} onChange={change} />
              </div>
              <div className="create-project-field">
                <label htmlFor="tp-closed">Lanes closed</label>
                <input id="tp-closed" type="number" name="lanes_closed" min="0" max={form.lanes_total} value={form.lanes_closed} onChange={change} />
              </div>
              <div className="create-project-field">
                <label htmlFor="tp-length">Work area length (m)</label>
                <input id="tp-length" type="number" name="work_length_m" min="10" max="5000" step="10" value={form.work_length_m} onChange={change} />
              </div>
              <label className="tp-check" htmlFor="tp-night">
                <input id="tp-night" type="checkbox" name="night_work" checked={form.night_work} onChange={change} />
                Night work
              </label>
            </div>
            <div className="create-project-form-actions tp-actions">
              <button type="submit" className="create-project-next-button" disabled={busy}>
                {busy ? "Planning…" : "Get the plan"}
              </button>
            </div>
          </form>
        )}

        {open && error && <p className="create-project-error" role="alert">{error}</p>}

        {open && plan && (
          <div className="tp-result">
            <div className="tp-result-head">
              <span>{plan.closure}</span>
              <strong>{plan.total_length_m} m total</strong>
            </div>
            <div className="tp-strip" aria-hidden="true">
              {plan.zones.map((zone, index) => (
                <span key={zone.name} style={{ flexGrow: zone.length_m, background: ZONE_COLORS[index] }} />
              ))}
            </div>
            <p className="tp-direction">Traffic direction →</p>

            <ul className="tp-zones">
              {plan.zones.map((zone, index) => (
                <li key={zone.name}>
                  <i style={{ background: ZONE_COLORS[index] }} aria-hidden="true" />
                  <span className="tp-zone-name">{zone.name}</span>
                  <span className="tp-zone-length">{zone.length_m} m</span>
                  <small>{zone.detail}</small>
                </li>
              ))}
            </ul>

            <h3>Devices you need</h3>
            <ul className="tp-devices">
              {plan.devices.map((device) => (
                <li key={device.name}>
                  <span className="tp-qty">{device.qty}</span>
                  <div>
                    <b>{device.name}</b>
                    <small>{device.why}</small>
                  </div>
                </li>
              ))}
            </ul>

            {plan.explanation && (
              <div className="tp-explain">
                <h3>{aiOn ? "✨ " : ""}How it looks on the road</h3>
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
                    <ul>{plan.explanation.risks.map((risk) => <li key={risk}>{risk}</li>)}</ul>
                  </>
                )}
              </div>
            )}

            {plan.notes.length > 0 && (
              <ul className="tp-notes">{plan.notes.map((note) => <li key={note}>{note}</li>)}</ul>
            )}

            <p className="tp-foot">
              Based on standard work zone formulas. The final plan follows the municipality permit and the Saudi TTC manual.
            </p>
            {onUse && (
              <div className="create-project-form-actions tp-actions">
                <button type="button" className="create-project-back-button" onClick={useInProject} disabled={added}>
                  {added ? "Added to the description ✓" : "Add to project description"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
