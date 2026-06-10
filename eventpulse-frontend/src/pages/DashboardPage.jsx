import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { bookingsAPI, usersAPI } from "../api";
import QRCode from "../components/QRCode";
import OrganizerEvents from "../components/OrganizerEvents";

const StatusBadge = ({ status }) => {
  const cls  = status==="confirmed"?"badge-confirmed":status==="cancelled"?"badge-cancelled":"badge-pending";
  const icon = status==="confirmed"?"✓":status==="cancelled"?"✗":"⏳";
  return <span className={cls}>{icon} {status}</span>;
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const [bookings,    setBookings]   = useState([]);
  const [stats,       setStats]      = useState(null);
  const [loading,     setLoading]    = useState(true);
  const [expanded,    setExpanded]   = useState(null);
  const [cancelling,  setCancelling] = useState(null);
  const [activeTab,   setActiveTab]  = useState(
    user?.role === "organizer" ? "events" : "bookings"
  );

  useEffect(() => {
    Promise.all([bookingsAPI.mine(), usersAPI.dashboard()])
      .then(([bData, sData]) => { setBookings(bData.bookings||[]); setStats(sData); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    setCancelling(id);
    try {
      await bookingsAPI.cancel(id);
      setBookings(prev => prev.map(b => b._id===id ? {...b, status:"cancelled"} : b));
    } catch(e) { alert(e.message); }
    finally { setCancelling(null); }
  };

  // Determine which tabs to show
  const isOrganizer = user?.role === "organizer" || user?.role === "admin";
  const tabs = [
    ...(isOrganizer ? [{ id:"events",  label:"My Events" }] : []),
    { id:"bookings", label:"My Bookings" },
    { id:"profile",  label:"Profile" },
  ];

  return (
    <div className="page">
      <div className="dash-wrap">

        {/* Header */}
        <div style={{ marginBottom:44 }}>
          <div className="sec-label">My Account</div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:16 }}>
            <h1 style={{ fontFamily:"Cormorant Garamond,serif", fontSize:"clamp(36px,5vw,56px)", fontWeight:700, letterSpacing:-1, lineHeight:1 }}>
              Dashboard
            </h1>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontWeight:600 }}>{user?.name}</div>
                <div style={{ fontSize:12, color:"var(--muted)" }}>
                  {user?.email} · <span style={{ color:"var(--gold)", textTransform:"capitalize" }}>{user?.role}</span>
                </div>
              </div>
              <div style={{ width:48, height:48, borderRadius:"50%", background:"linear-gradient(135deg,var(--gold2),var(--gold))", color:"var(--ink)", fontWeight:800, fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {user?.name?.slice(0,2).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {loading ? <div className="spinner" /> : (
          <>
            {/* KPI grid */}
            <div className="kpi-grid" style={{ marginBottom:48 }}>
              {[
                ["🎟️","Total Bookings",  bookings.length],
                ["✅","Confirmed",        bookings.filter(b=>b.status==="confirmed").length],
                ["💰","Total Spent",      "₹"+(stats?.totalSpent||0).toLocaleString("en-IN")],
                ["📅","Upcoming",         stats?.upcoming||0],
              ].map(([icon,label,val]) => (
                <div key={label} className="kpi-cell">
                  <div className="kpi-icon">{icon}</div>
                  <div className="kpi-val">{val}</div>
                  <div className="kpi-lbl">{label}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom:32 }}>
              {tabs.map(t => (
                <button key={t.id} className={`tab-btn${activeTab===t.id?" active":""}`} onClick={() => setActiveTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ══ ORGANIZER: My Events ══════════════════════ */}
            {activeTab === "events" && <OrganizerEvents />}

            {/* ══ My Bookings ══════════════════════════════ */}
            {activeTab === "bookings" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                  <h2 style={{ fontFamily:"Cormorant Garamond,serif", fontSize:28, fontWeight:700 }}>
                    My <span style={{ fontStyle:"italic", fontWeight:300 }}>Bookings</span>
                  </h2>
                  <button className="btn-outline" style={{ padding:"8px 20px", fontSize:12 }} onClick={() => navigate("/events")}>
                    + Book Event
                  </button>
                </div>

                {bookings.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"80px 0", color:"var(--muted)" }}>
                    <div style={{ fontSize:56, marginBottom:16 }}>🎟️</div>
                    <p style={{ fontSize:18, marginBottom:8 }}>No bookings yet</p>
                    <p style={{ fontSize:14, marginBottom:24 }}>Your confirmed bookings will appear here</p>
                    <button className="btn-gold" onClick={() => navigate("/events")}>Explore Events</button>
                  </div>
                ) : (
                  bookings.map(b => (
                    <div key={b._id}>
                      <div className="booking-row">
                        {b.event?.image ? (
                          <img src={b.event.image} alt={b.event?.title} style={{ width:100, height:72, objectFit:"cover", borderRadius:"var(--radius)", flexShrink:0 }} />
                        ) : (
                          <div style={{ width:100, height:72, background:"var(--surface)", borderRadius:"var(--radius)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>🎭</div>
                        )}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontFamily:"Cormorant Garamond,serif", fontSize:19, fontWeight:700, marginBottom:4 }}>{b.event?.title||"Event"}</div>
                          <div style={{ color:"var(--muted)", fontSize:13, lineHeight:1.8 }}>
                            📅 {b.event?.date ? new Date(b.event.date).toLocaleDateString("en-IN",{dateStyle:"medium"}) : "TBA"} · {b.event?.time}
                            <br />📍 {b.event?.venue}
                          </div>
                          <div style={{ fontSize:11, color:"var(--muted)", marginTop:4 }}>
                            ID: <code style={{ color:"var(--gold)", fontFamily:"monospace" }}>{b._id?.toString().toUpperCase().slice(-8)}</code>
                          </div>
                        </div>
                        <div style={{ textAlign:"right", flexShrink:0 }}>
                          <div style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:26, color:"var(--gold)", letterSpacing:1 }}>₹{(b.totalAmount||0).toLocaleString("en-IN")}</div>
                          <div style={{ fontSize:12, color:"var(--muted)", marginBottom:8 }}>{b.qty} ticket{b.qty!==1?"s":""}</div>
                          <StatusBadge status={b.status} />
                          <div style={{ display:"flex", gap:8, marginTop:10, justifyContent:"flex-end" }}>
                            {b.status === "confirmed" && <>
                              <button className="btn-ghost" style={{ padding:"5px 12px", fontSize:11 }} onClick={() => setExpanded(expanded===b._id?null:b._id)}>
                                {expanded===b._id?"Hide QR":"Show QR"}
                              </button>
                              <button className="btn-ghost" style={{ padding:"5px 12px", fontSize:11, color:"var(--ember)", borderColor:"rgba(255,92,53,0.3)" }} onClick={() => handleCancel(b._id)} disabled={cancelling===b._id}>
                                {cancelling===b._id?"…":"Cancel"}
                              </button>
                            </>}
                          </div>
                        </div>
                      </div>
                      {expanded === b._id && b.qrToken && (
                        <div style={{ background:"var(--card)", border:"1px solid rgba(245,200,66,0.15)", borderTop:"none", borderRadius:"0 0 var(--radius) var(--radius)", padding:"24px", textAlign:"center", marginBottom:8 }}>
                          <div style={{ fontSize:11, letterSpacing:2, textTransform:"uppercase", color:"var(--muted)", marginBottom:16 }}>QR Ticket — Present at Venue</div>
                          <QRCode token={b.qrToken} />
                          <div style={{ fontFamily:"monospace", fontSize:13, color:"var(--gold)", marginTop:12, letterSpacing:3 }}>{b.qrToken}</div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ══ Profile ══════════════════════════════════ */}
            {activeTab === "profile" && (
              <div style={{ maxWidth:480 }}>
                <h2 style={{ fontFamily:"Cormorant Garamond,serif", fontSize:28, fontWeight:700, marginBottom:24 }}>
                  Account <span style={{ fontStyle:"italic", fontWeight:300 }}>Details</span>
                </h2>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {[["Name",user?.name],["Email",user?.email],["Role",user?.role],["Member Since","2026"]].map(([label,val]) => (
                    <div key={label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"14px 18px", display:"flex", justifyContent:"space-between" }}>
                      <span style={{ color:"var(--muted)", fontSize:13 }}>{label}</span>
                      <span style={{ fontWeight:500, textTransform:"capitalize" }}>{val}</span>
                    </div>
                  ))}
                </div>
                {isOrganizer && (
                  <button className="btn-gold" style={{ marginTop:24, width:"100%", padding:13 }} onClick={() => navigate("/create-event")}>
                    + Create New Event
                  </button>
                )}
                <button className="btn-ghost" style={{ marginTop:12, color:"var(--ember)", borderColor:"rgba(255,92,53,0.3)", width:"100%", padding:13 }} onClick={() => { logout(); navigate("/"); }}>
                  Sign Out
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
