import { useNavigate } from "react-router-dom";

const Stars = ({ rating }) => (
  <span className="ev-stars">
    {"★".repeat(Math.floor(rating || 0))}
    {"☆".repeat(5 - Math.floor(rating || 0))}
  </span>
);

export default function EventCard({ event }) {
  const navigate = useNavigate();
  const pct = Math.round(((event.bookedSeats || 0) / (event.totalSeats || 1)) * 100);
  const left = (event.totalSeats || 0) - (event.bookedSeats || 0);

  return (
    <div className="ev-card" onClick={() => navigate(`/events/${event._id}`)}>
      <div className="ev-img-wrap">
        {event.image ? (
          <img src={event.image} alt={event.title} className="ev-img" />
        ) : (
          <div
            className="ev-img"
            style={{
              background: "linear-gradient(135deg,#141630,#1e2040)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 48,
            }}
          >
            🎭
          </div>
        )}
        <div className="ev-overlay" />
        <span className="ev-cat">{event.category}</span>
      </div>

      <div className="ev-body">
        <div className="ev-tags">
          {(event.tags || []).slice(0, 3).map(t => (
            <span key={t} className="ev-tag">{t}</span>
          ))}
        </div>

        <h3 className="ev-title">{event.title}</h3>

        <div className="ev-meta">
          📅 {event.date
            ? new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
            : "TBA"
          } · {event.time}
          <br />
          📍 {event.venue}
        </div>

        {/* Seat fill bar */}
        <div className="ev-fill">
          <div className="ev-fill-in" style={{ width: pct + "%" }} />
        </div>
        <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 14 }}>
          {pct}% filled · {left} seat{left !== 1 ? "s" : ""} left
        </p>

        <div className="ev-footer">
          <div>
            <div className="ev-price">₹{(event.price || 0).toLocaleString("en-IN")}</div>
            <div className="ev-price-sub">per ticket</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <Stars rating={event.rating} />
            <div className="ev-rating-sub">
              {event.rating ? event.rating.toFixed(1) : "New"} ({event.reviewCount || 0})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
