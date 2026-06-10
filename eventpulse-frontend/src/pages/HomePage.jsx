import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { eventsAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import EventCard from "../components/EventCard";

const MARQUEE = ["MUSIC FESTIVAL","TECH SUMMIT","FOOD CARNIVAL","STARTUP PITCH","DANCE GALA","PHOTOGRAPHY","WORKSHOPS","NETWORKING"];

export default function HomePage() {
  const navigate        = useNavigate();
  const { user }        = useAuth();
  const [featured, setFeatured] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    eventsAPI.list({ limit: 3, sort: "rating" })
      .then(d => setFeatured(d.events || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // "Host an Event" smart routing:
  // - Not logged in → go to auth
  // - Logged in as organizer → go to create-event form
  // - Logged in as attendee → go to auth to register as organizer
  const handleHost = () => {
    if (!user)                  return navigate("/auth");
    if (user.role === "organizer" || user.role === "admin") return navigate("/create-event");
    navigate("/auth"); // attendee — prompt to create organizer account
  };

  return (
    <div className="page">
      {/* ── HERO ────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-eyebrow fade-up">🌟 India's Premier Event Platform</div>
        <h1 className="hero-title fade-up-2">
          <span className="it">Discover</span> &amp; <span className="gold">Live</span>
          <br />Every Moment
        </h1>
        <p className="hero-sub fade-up-3">Unforgettable Events Across India</p>
        <p className="hero-desc fade-up-4">
          From coastal food festivals to tech summits and classical galas —
          find, book, and experience the extraordinary.
        </p>
        <div className="hero-cta fade-up-5">
          <button className="btn-gold"    style={{ fontSize:15, padding:"15px 44px" }} onClick={() => navigate("/events")}>Explore Events</button>
          <button className="btn-outline" style={{ fontSize:15, padding:"15px 44px" }} onClick={handleHost}>Host an Event</button>
        </div>
        <div className="stat-grid fade-up-5">
          {[["6+","Events"],["5,000+","Attendees"],["₹50L+","Tickets Sold"],["4.8★","Avg Rating"]].map(([n,l]) => (
            <div key={l} className="stat-cell">
              <div className="stat-num">{n}</div>
              <div className="stat-lbl">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MARQUEE ─────────────────────────────────────── */}
      <div className="marquee-wrap">
        <div className="marquee-inner">
          {[0,1].map(r => MARQUEE.map(t => (
            <div key={`${r}-${t}`} className="marquee-item">{t} <span>✦</span> </div>
          )))}
        </div>
      </div>

      {/* ── FEATURED EVENTS ─────────────────────────────── */}
      <section className="sec">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:40, flexWrap:"wrap", gap:16 }}>
          <div>
            <div className="sec-label">Featured</div>
            <h2 className="sec-title">Trending <span className="it">This Month</span></h2>
          </div>
          <button className="btn-outline" onClick={() => navigate("/events")}>View All Events →</button>
        </div>
        {loading ? (
          <div className="spinner" />
        ) : featured.length > 0 ? (
          <div className="events-grid" style={{ gridTemplateColumns:"repeat(auto-fill,minmax(380px,1fr))" }}>
            {featured.map(ev => <EventCard key={ev._id} event={ev} />)}
          </div>
        ) : (
          <div style={{ textAlign:"center", padding:"60px 0", color:"var(--muted)" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🎭</div>
            <p style={{ marginBottom:16 }}>No events yet.</p>
            {user?.role === "organizer" && (
              <button className="btn-gold" onClick={() => navigate("/create-event")}>Create Your First Event</button>
            )}
          </div>
        )}
      </section>

      <div className="divider" />

      {/* ── WHY EVENTPULSE ──────────────────────────────── */}
      <section className="sec">
        <div style={{ textAlign:"center", marginBottom:56 }}>
          <div className="sec-label" style={{ textAlign:"center" }}>Why Us</div>
          <h2 className="sec-title" style={{ textAlign:"center" }}>Built for <span className="it gold">India</span></h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:2, background:"rgba(245,200,66,0.06)" }}>
          {[
            ["🎯","Curated Events","Handpicked experiences across music, tech, food, arts, and business."],
            ["💳","UPI & Cards","Pay with UPI, cards, or net banking — powered by Razorpay."],
            ["📱","Instant QR Ticket","Your QR ticket lands in your email the moment payment clears."],
            ["🔒","Secure Bookings","JWT-secured accounts, HMAC-verified payments, zero data leaks."],
          ].map(([icon,title,desc]) => (
            <div key={title} style={{ background:"var(--card)", padding:"36px 28px", transition:"var(--trans)" }}
              onMouseEnter={e=>e.currentTarget.style.background="var(--card2)"}
              onMouseLeave={e=>e.currentTarget.style.background="var(--card)"}
            >
              <div style={{ fontSize:32, marginBottom:16 }}>{icon}</div>
              <div style={{ fontFamily:"Cormorant Garamond,serif", fontSize:22, fontWeight:700, marginBottom:10 }}>{title}</div>
              <div style={{ color:"var(--muted)", fontSize:14, lineHeight:1.75 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* ── CATEGORIES ──────────────────────────────────── */}
      <section className="sec">
        <div style={{ marginBottom:40 }}>
          <div className="sec-label">Browse By</div>
          <h2 className="sec-title">Event <span className="it">Categories</span></h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12 }}>
          {[["🎵","Music"],["💻","Technology"],["🍛","Food"],["💼","Business"],["🎭","Arts"],["📸","Workshop"]].map(([icon,cat]) => (
            <div key={cat} onClick={() => navigate(`/events?category=${cat}`)}
              style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"28px 20px", textAlign:"center", cursor:"pointer", transition:"var(--trans)" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)";e.currentTarget.style.background="rgba(245,200,66,0.06)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.background="var(--card)";}}
            >
              <div style={{ fontSize:32, marginBottom:10 }}>{icon}</div>
              <div style={{ fontWeight:600, fontSize:14 }}>{cat}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ORGANIZER CTA ───────────────────────────────── */}
      <section className="sec-sm" style={{
        margin:"0 56px 88px", padding:"60px 40px",
        background:"rgba(245,200,66,0.04)", border:"1px solid rgba(245,200,66,0.15)",
        borderRadius:"var(--radius-lg)", textAlign:"center",
      }}>
        <div className="sec-label" style={{ textAlign:"center" }}>Organisers</div>
        <h2 className="sec-title" style={{ marginBottom:14 }}>Ready to <span className="it gold">Host</span>?</h2>
        <p style={{ color:"var(--muted)", maxWidth:460, margin:"12px auto 32px", lineHeight:1.78 }}>
          {user?.role === "organizer"
            ? "You're set up as an organizer. Create your next event in minutes."
            : "Join 200+ organisers who trust EventPulse to manage, promote, and sell out every event."}
        </p>
        <button className="btn-gold" style={{ fontSize:15, padding:"15px 48px" }} onClick={handleHost}>
          {user?.role === "organizer" ? "Create an Event →" : "Get Started Free"}
        </button>
      </section>
    </div>
  );
}
