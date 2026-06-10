import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { eventsAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const Stars = ({ rating }) => (
  <span style={{ color: "#f5c842", fontSize: 18 }}>
    {"★".repeat(Math.floor(rating || 0))}
    {"☆".repeat(5 - Math.floor(rating || 0))}
    <span style={{ color: "var(--muted)", fontSize: 14, marginLeft: 6 }}>
      {rating ? rating.toFixed(1) : "New"}
    </span>
  </span>
);

export default function EventDetailPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const { addToCart } = useCart();

  const [event,   setEvent]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("about");
  const [qty,     setQty]     = useState(1);
  const [added,   setAdded]   = useState(false);

  useEffect(() => {
    eventsAPI.get(id)
      .then(d => setEvent(d.event))
      .catch(() => navigate("/events"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page"><div className="spinner" /></div>;
  if (!event)  return null;

  const pct  = Math.round(((event.bookedSeats || 0) / (event.totalSeats || 1)) * 100);
  const left = (event.totalSeats || 0) - (event.bookedSeats || 0);
  const soldOut = left <= 0;

  const handleBook = () => {
    if (!user) { navigate("/auth"); return; }
    addToCart(event, qty);
    setAdded(true);
    setTimeout(() => navigate("/checkout"), 600);
  };

  return (
    <div className="page">
      {/* ── Cinematic hero image ──────────────────────── */}
      <div className="detail-hero">
        {event.image ? (
          <img src={event.image} alt={event.title} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#141630,#1e2040)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80 }}>🎭</div>
        )}
        <div className="detail-hero-overlay" />
        <div className="detail-hero-content">
          <button
            onClick={() => navigate("/events")}
            style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontSize: 12, letterSpacing: 1, marginBottom: 16 }}
          >
            ← BACK TO EVENTS
          </button>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {(event.tags || []).map(t => (
              <span key={t} className="ev-tag" style={{ borderColor: "rgba(245,200,66,0.35)", color: "rgba(232,230,240,0.8)" }}>{t}</span>
            ))}
          </div>
          <h1 style={{
            fontFamily: "Cormorant Garamond,serif",
            fontSize: "clamp(28px,5vw,60px)", fontWeight: 700,
            lineHeight: 1.05, letterSpacing: -1, marginBottom: 10,
          }}>
            {event.title}
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            📅{" "}
            {event.date
              ? new Date(event.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
              : "TBA"
            } · {event.time} &nbsp;·&nbsp; 📍 {event.venue}
          </p>
        </div>
      </div>

      {/* ── Body grid ─────────────────────────────────── */}
      <div className="detail-body">
        {/* Left — content */}
        <div>
          {/* Tabs */}
          <div className="tabs">
            {["about", "schedule", "reviews"].map(t => (
              <button key={t} className={`tab-btn${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === "about" && (
            <p style={{ color: "var(--muted)", lineHeight: 1.9, fontSize: 16 }}>
              {event.description || "No description provided."}
            </p>
          )}

          {tab === "schedule" && (
            <div>
              {(event.schedule || []).length > 0 ? event.schedule.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 16, padding: "14px 0", borderBottom: "1px solid rgba(245,200,66,0.08)" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)", marginTop: 8, flexShrink: 0 }} />
                  <span style={{ color: "var(--muted)", fontSize: 15 }}>{s}</span>
                </div>
              )) : (
                <p style={{ color: "var(--muted)" }}>Schedule coming soon.</p>
              )}
            </div>
          )}

          {tab === "reviews" && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <Stars rating={event.rating} />
                <span style={{ color: "var(--muted)", fontSize: 13, marginLeft: 8 }}>
                  {event.reviewCount || 0} verified review{event.reviewCount !== 1 ? "s" : ""}
                </span>
              </div>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>
                Verified attendee reviews are collected after each event. Check back after attending!
              </p>
            </div>
          )}

          {/* Organizer info */}
          {event.organizer && (
            <div style={{
              marginTop: 40, padding: "20px 24px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              display: "flex", alignItems: "center", gap: 16,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "linear-gradient(135deg,var(--gold2),var(--gold))",
                color: "var(--ink)", fontWeight: 700, fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {(event.organizer.name || "O").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>Organised by</div>
                <div style={{ fontWeight: 600 }}>{event.organizer.name}</div>
              </div>
            </div>
          )}
        </div>

        {/* Right — sticky booking panel */}
        <div className="sticky-panel">
          {/* Price */}
          <div style={{ fontFamily: "Bebas Neue,sans-serif", fontSize: 46, letterSpacing: 2, color: "var(--gold)", lineHeight: 1 }}>
            ₹{(event.price || 0).toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 20 }}>
            per ticket
          </div>

          {/* Fill bar */}
          <div className="ev-fill" style={{ marginBottom: 6 }}>
            <div className="ev-fill-in" style={{ width: pct + "%" }} />
          </div>
          <div style={{ fontSize: 12, color: soldOut ? "var(--ember)" : "var(--muted)", marginBottom: 24 }}>
            {soldOut ? "⚠ Sold Out" : `${pct}% filled · ${left} seat${left !== 1 ? "s" : ""} left`}
          </div>

          {/* Quantity selector */}
          {!soldOut && (
            <>
              <label className="inp-label">Quantity</label>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <button className="btn-ghost" style={{ padding: "8px 18px", fontSize: 18 }} onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span style={{ fontFamily: "Bebas Neue,sans-serif", fontSize: 30, color: "var(--gold)", minWidth: 32, textAlign: "center" }}>{qty}</span>
                <button className="btn-ghost" style={{ padding: "8px 18px", fontSize: 18 }} onClick={() => setQty(q => Math.min(left, q + 1))}>+</button>
              </div>
            </>
          )}

          {/* Total */}
          <div style={{
            background: "rgba(245,200,66,0.06)",
            border: "1px solid rgba(245,200,66,0.15)",
            borderRadius: "var(--radius)",
            padding: "13px 18px", marginBottom: 20,
            display: "flex", justifyContent: "space-between",
          }}>
            <span style={{ color: "var(--muted)", fontSize: 13 }}>Total</span>
            <span style={{ fontFamily: "Bebas Neue,sans-serif", fontSize: 22, color: "var(--gold)", letterSpacing: 1 }}>
              ₹{((event.price || 0) * qty).toLocaleString("en-IN")}
            </span>
          </div>

          <button
            className="btn-gold"
            style={{ width: "100%", padding: 15, fontSize: 14 }}
            onClick={handleBook}
            disabled={soldOut || added}
          >
            {added ? "✓ Added to Cart…" : soldOut ? "Sold Out" : user ? "Book Now →" : "Sign In to Book →"}
          </button>

          {/* Date + venue chips */}
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              ["📅", event.date ? new Date(event.date).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "TBA"],
              ["🕐", event.time],
              ["📍", event.venue],
            ].map(([icon, val]) => (
              <div key={icon} style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--muted)", alignItems: "flex-start" }}>
                <span>{icon}</span><span>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
