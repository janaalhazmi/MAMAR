import { useState } from "react";
import { getSession } from "../services/auth";
import { postProjectReview } from "../services/api";
import "../styles/extras.css";

// After approving the work, the contractor gives the provider 1 to 5 stars and a comment.
export default function RateProvider({ projectId, providerName, onDone }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!rating) {
      setError("Choose from 1 to 5 stars.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await postProjectReview(getSession()?.access_token, projectId, rating, comment.trim());
      onDone?.();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form className="rate-card" onSubmit={submit}>
      <h2>Rate {providerName || "the provider"}</h2>
      <p>The project is completed. How was the work? Other contractors will see your rating.</p>
      <div className="rate-stars" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={`${value} star${value > 1 ? "s" : ""}`}
            className={(hover || rating) >= value ? "on" : ""}
            onMouseEnter={() => setHover(value)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(value)}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        rows={3}
        maxLength={500}
        placeholder="A short comment (optional)"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      {error && <p className="rate-error" role="alert">{error}</p>}
      <div className="rate-actions">
        <button type="button" className="rate-skip" onClick={() => onDone?.()} disabled={saving}>Skip</button>
        <button type="submit" className="rate-send" disabled={saving}>{saving ? "Sending…" : "Send Rating"}</button>
      </div>
    </form>
  );
}
