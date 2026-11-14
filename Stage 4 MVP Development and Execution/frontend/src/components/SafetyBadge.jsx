import { useState } from "react";
import "../styles/ai.css";

const ICON = { ok: "✅", missing: "❌", unclear: "❔" };
const TONE = { Safe: "ok", Check: "mid", Unsafe: "bad" };

// The AI safety check under a site photo: a score out of 10 that opens the list of checks.
// safety = useSafetyChecks(projectId) from services/ai.js
export default function SafetyBadge({ photoId, safety }) {
  const [open, setOpen] = useState(false);
  if (!safety?.enabled || !photoId) return null;
  const result = safety.checks[String(photoId)];
  const busy = safety.busy[photoId];

  if (!result) {
    return (
      <button type="button" className="ai-pill" onClick={() => safety.check(photoId)} disabled={busy}>
        {busy ? "Checking…" : "✨ Check safety"}
      </button>
    );
  }

  return (
    <div className="ai-safety">
      <button
        type="button"
        className={`ai-pill ${TONE[result.level] || ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        title="AI safety check (Claude)"
      >
        ✨ Safety {result.score}/10 · {result.level}
      </button>
      {open && (
        <div className="ai-safety-box">
          <ul>
            {result.checks.map((item) => (
              <li key={item.item}>
                <span aria-hidden="true">{ICON[item.status] || "❔"}</span>
                <b>{item.item}</b>
                {item.note && <small>{item.note}</small>}
              </li>
            ))}
          </ul>
          {result.hazards.length > 0 && (
            <p className="ai-hazards">⚠️ {result.hazards.join(" · ")}</p>
          )}
          {result.advice && <p className="ai-advice">{result.advice}</p>}
          <button type="button" className="ai-link" onClick={() => safety.check(photoId, true)} disabled={busy}>
            {busy ? "Checking again…" : "Check again"}
          </button>
        </div>
      )}
    </div>
  );
}
