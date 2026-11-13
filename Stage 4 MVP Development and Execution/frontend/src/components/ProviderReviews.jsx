import { useState } from "react";
import { getSession } from "../services/auth";
import { fetchProviderReviews } from "../services/api";
import { shortDay } from "../services/attendance";
import "../styles/tools.css";

// "Read reviews" under a company's stars: the latest ratings and comments from contractors.
export default function ProviderReviews({ providerId, count }) {
  const [open, setOpen] = useState(false);
  const [reviews, setReviews] = useState(null);
  const [error, setError] = useState("");

  if (!count) return null;

  function toggle(event) {
    event.stopPropagation(); // the card itself selects the company
    const next = !open;
    setOpen(next);
    if (next && reviews === null) {
      fetchProviderReviews(getSession()?.access_token, providerId)
        .then(setReviews)
        .catch((err) => setError(err.message));
    }
  }

  return (
    <div className="rv-box" onClick={(event) => event.stopPropagation()}>
      <button type="button" className="rv-toggle" onClick={toggle} aria-expanded={open}>
        {open ? "Hide reviews" : `Read reviews (${count})`}
      </button>
      {open && (
        <ul className="rv-list">
          {error && <li>{error}</li>}
          {!reviews && !error && <li>Loading…</li>}
          {reviews?.map((review) => (
            <li key={review.review_id}>
              <span className="stars" aria-label={`${review.rating} out of 5`}>
                {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
              </span>
              <small>{shortDay(review.created_at)}</small>
              <p>{review.comment || "No comment."}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
