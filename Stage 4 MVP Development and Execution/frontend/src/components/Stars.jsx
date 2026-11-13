import "../styles/extras.css";

// Shows "★★★★☆ 4.2 (5)" or "No ratings yet".
export default function Stars({ rating }) {
  if (!rating || !rating.count) return <span className="stars stars-empty">No ratings yet</span>;
  const full = Math.round(rating.average);
  return (
    <span className="stars" aria-label={`${rating.average} out of 5 from ${rating.count} ratings`}>
      <span aria-hidden="true">{"★".repeat(full)}{"☆".repeat(5 - full)}</span> {rating.average} ({rating.count})
    </span>
  );
}
