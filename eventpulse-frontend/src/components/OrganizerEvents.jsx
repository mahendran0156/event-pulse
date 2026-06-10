import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { eventsAPI } from "../api";

export default function OrganizerEvents() {
  const navigate = useNavigate();
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load all events — organizer can see their own events
    eventsAPI.list({ limit: 50 })
      .then(d => setEvents(d.events || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await eventsAPI.delete(id);
      setEvents(prev => prev.filter(e => e._id !== id));
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h2 style={{ fontFamily:"Cormorant Garamond,serif", fontSize:28, fontWeight:700 }}>
          My <span style={{ fontStyle:"italic", fontWeight:300 }}>Events</span>
        </h2>
        <button className="btn-gold" style={{ padding:"10px 22px", fontSize:13 }} onClick={() => navigate("/create-event")}>
          + Create Event
        </button>
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 0", color:"var(--muted)" }}>
          <div style={{ fontSize:52, marginBottom:16 }}>🎭</div>
          <p style={{ marginBottom:20 }}>No events created yet.</p>
          <button className="btn-gold" onClick={() => navigate("/create-event")}>Create Your First Event</button>
        </div>
      ) : (
        events.map(ev => {
          const pct = Math.round(((ev.bookedSeats||0)/(ev.totalSeats||1))*100);
          return (
            <div key={ev._id} style={{
              display:"flex", gap:16, alignItems:"center",
              border:"1px solid rgba(245,200,66,0.08)", borderRadius:"var(--radius)",
              padding:20, marginBottom:10, background:"rgba(255,255,255,0.02)",
              transition:"all 0.2s",
            }}
              onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(245,200,66,0.2)"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(245,200,66,0.08)"}
            >
              {ev.image ? (
                <img src={ev.image} alt={ev.title} style={{ width:88, height:64, objectFit:"cover", borderRadius:"var(--radius)", flexShrink:0 }} />
              ) : (
                <div style={{ width:88, height:64, background:"var(--surface)", borderRadius:"var(--radius)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>🎭</div>
              )}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"Cormorant Garamond,serif", fontSize:18, fontWeight:700, marginBottom:4 }}>{ev.title}</div>
                <div style={{ color:"var(--muted)", fontSize:12, marginBottom:8 }}>
                  📅 {new Date(ev.date).toLocaleDateString("en-IN",{dateStyle:"medium"})} · {ev.time} · 📍 {ev.venue}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ flex:1, height:4, background:"rgba(255,255,255,0.08)", borderRadius:2, overflow:"hidden", maxWidth:160 }}>
                    <div style={{ width:pct+"%", height:"100%", background:"linear-gradient(90deg,var(--gold2),var(--gold))" }} />
                  </div>
                  <span style={{ fontSize:11, color:"var(--muted)" }}>{ev.bookedSeats||0}/{ev.totalSeats} seats · {pct}%</span>
                </div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:22, color:"var(--gold)", letterSpacing:1, marginBottom:8 }}>
                  ₹{(ev.price||0).toLocaleString("en-IN")}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn-ghost" style={{ padding:"5px 12px", fontSize:11 }} onClick={() => navigate(`/events/${ev._id}`)}>View</button>
                  <button
                    className="btn-ghost"
                    style={{ padding:"5px 12px", fontSize:11, color:"var(--ember)", borderColor:"rgba(255,92,53,0.3)" }}
                    onClick={() => handleDelete(ev._id, ev.title)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
