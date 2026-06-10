import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { eventsAPI } from "../api";

const CATEGORIES = ["Music","Technology","Food","Business","Arts","Workshop","Other"];

const EMPTY = {
  title: "", description: "", category: "Music",
  date: "", time: "", venue: "",
  price: "", totalSeats: "",
  tags: "", schedule: "",
  image: "",
};

export default function CreateEventPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]     = useState(EMPTY);
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [preview, setPreview] = useState("");
  const [step, setStep]     = useState(1); // 1=details, 2=schedule/image, 3=review

  // Redirect non-organizers
  if (user && user.role === "attendee") {
    return (
      <div className="page" style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"80vh", gap:20 }}>
        <div style={{ fontSize:56 }}>🔒</div>
        <h2 style={{ fontFamily:"Cormorant Garamond,serif", fontSize:32, fontWeight:700 }}>Organizer Access Only</h2>
        <p style={{ color:"var(--muted)", textAlign:"center", maxWidth:400 }}>
          You're signed in as an attendee. To host events, register a new account with the Organizer role.
        </p>
        <div style={{ display:"flex", gap:12 }}>
          <button className="btn-gold" onClick={() => navigate("/auth")}>Register as Organizer</button>
          <button className="btn-ghost" onClick={() => navigate("/events")}>Browse Events</button>
        </div>
      </div>
    );
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Handle image file → base64
  const handleImageFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setError("Image must be under 3MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      set("image", ev.target.result);
      setPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    if (!form.title.trim())       return "Event title is required";
    if (!form.description.trim()) return "Description is required";
    if (!form.date)               return "Event date is required";
    if (!form.time.trim())        return "Event time is required";
    if (!form.venue.trim())       return "Venue is required";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) return "Valid price is required (0 for free)";
    if (!form.totalSeats || isNaN(Number(form.totalSeats)) || Number(form.totalSeats) < 1) return "Total seats must be at least 1";
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setBusy(true); setError("");
    try {
      const payload = {
        title:       form.title.trim(),
        description: form.description.trim(),
        category:    form.category,
        date:        form.date,
        time:        form.time.trim(),
        venue:       form.venue.trim(),
        price:       Number(form.price),
        totalSeats:  Number(form.totalSeats),
        image:       form.image || "",
        tags:        form.tags.split(",").map(t => t.trim()).filter(Boolean),
        schedule:    form.schedule.split("\n").map(s => s.trim()).filter(Boolean),
        isActive:    true,
      };
      const data = await eventsAPI.create(payload);
      setSuccess("Event created successfully!");
      setTimeout(() => navigate(`/events/${data.event._id}`), 1200);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const inputGroup = (label, key, opts = {}) => (
    <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
      <label className="inp-label">{label}{opts.required !== false && <span style={{ color:"var(--ember)" }}>*</span>}</label>
      {opts.type === "textarea" ? (
        <textarea
          className="inp"
          placeholder={opts.placeholder || ""}
          value={form[key]}
          onChange={e => set(key, e.target.value)}
          rows={opts.rows || 4}
          style={{ resize:"vertical", minHeight: opts.rows ? opts.rows * 24 + 16 : 96 }}
        />
      ) : opts.type === "select" ? (
        <select className="inp" value={form[key]} onChange={e => set(key, e.target.value)}>
          {opts.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          className="inp"
          type={opts.type || "text"}
          placeholder={opts.placeholder || ""}
          value={form[key]}
          onChange={e => set(key, e.target.value)}
          min={opts.min}
        />
      )}
      {opts.hint && <p style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>{opts.hint}</p>}
    </div>
  );

  const STEPS = ["Event Details","Schedule & Image","Review & Publish"];

  return (
    <div className="page">
      <div style={{ maxWidth:760, margin:"0 auto", padding:"80px 40px 60px" }}>

        {/* Header */}
        <div style={{ marginBottom:40 }}>
          <div className="sec-label">Organizer</div>
          <h1 style={{ fontFamily:"Cormorant Garamond,serif", fontSize:"clamp(32px,5vw,52px)", fontWeight:700, letterSpacing:-1, lineHeight:1, marginBottom:8 }}>
            Host an <span style={{ fontStyle:"italic", fontWeight:300, color:"var(--gold)" }}>Event</span>
          </h1>
          <p style={{ color:"var(--muted)", fontSize:14 }}>
            Signed in as organizer: <strong style={{ color:"var(--gold)" }}>{user?.name}</strong>
          </p>
        </div>

        {/* Step tracker */}
        <div style={{ display:"flex", alignItems:"center", marginBottom:44 }}>
          {STEPS.map((label, i) => (
            <div key={label} style={{ display:"flex", alignItems:"center", flex: i < 2 ? 1 : "auto" }}>
              <div
                onClick={() => i < step - 1 && setStep(i + 1)}
                style={{
                  width:36, height:36, borderRadius:"50%",
                  background: step > i + 1 ? "var(--gold)" : step === i + 1 ? "transparent" : "transparent",
                  border: step > i + 1 ? "none" : step === i + 1 ? "1.5px solid var(--gold)" : "1.5px solid rgba(245,200,66,0.25)",
                  color: step > i + 1 ? "var(--ink)" : step === i + 1 ? "var(--gold)" : "var(--muted)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:13, fontWeight:700, flexShrink:0,
                  cursor: i < step - 1 ? "pointer" : "default",
                  boxShadow: step === i + 1 ? "0 0 18px rgba(245,200,66,0.3)" : "none",
                  transition:"all 0.3s",
                }}
              >
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span style={{ marginLeft:8, marginRight: i < 2 ? 12 : 0, fontSize:11, fontWeight:600, letterSpacing:0.8, textTransform:"uppercase", color: step === i + 1 ? "var(--gold)" : "var(--muted)" }}>
                {label}
              </span>
              {i < 2 && <div style={{ flex:1, height:1, background: step > i + 1 ? "var(--gold)" : "rgba(245,200,66,0.15)", marginRight:8, transition:"background 0.3s" }} />}
            </div>
          ))}
        </div>

        {/* ══ STEP 1 — Event Details ══════════════════════════ */}
        {step === 1 && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            {inputGroup("Event Title", "title", { placeholder:"e.g. Neon Nights Music Festival" })}
            {inputGroup("Description", "description", { type:"textarea", rows:5, placeholder:"Describe your event — what attendees can expect, highlights, performers…" })}

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              {inputGroup("Category", "category", { type:"select", options:CATEGORIES })}
              {inputGroup("Ticket Price (₹)", "price", { type:"number", placeholder:"0 for free", min:"0" })}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              {inputGroup("Event Date", "date", { type:"date" })}
              {inputGroup("Event Time", "time", { placeholder:"e.g. 7:00 PM" })}
            </div>
            {inputGroup("Venue / Location", "venue", { placeholder:"e.g. Marina Beach, Chennai" })}
            {inputGroup("Total Seats", "totalSeats", { type:"number", placeholder:"e.g. 500", min:"1" })}
            {inputGroup("Tags", "tags", { placeholder:"EDM, Outdoor, Live Music", hint:"Comma-separated tags shown on your event card", required:false })}

            {error && <div className="alert-err">{error}</div>}

            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
              <button className="btn-gold" style={{ padding:"13px 36px" }}
                onClick={() => { const e = validate(); if (e) { setError(e); } else { setError(""); setStep(2); } }}>
                Next: Schedule & Image →
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 2 — Schedule & Image ══════════════════════ */}
        {step === 2 && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            {inputGroup("Schedule / Agenda", "schedule", {
              type:"textarea", rows:6,
              placeholder: "One item per line:\n6:00 PM – Gates Open\n7:00 PM – Opening Act\n9:00 PM – Main Show",
              hint:"Each line becomes one schedule item on the event detail page",
              required: false,
            })}

            {/* Image upload */}
            <div>
              <label className="inp-label">Event Cover Image<span style={{ color:"var(--muted)", fontWeight:400 }}> (optional, max 3MB)</span></label>
              <div style={{
                border:"2px dashed rgba(245,200,66,0.3)", borderRadius:"var(--radius-lg)",
                padding:"32px", textAlign:"center", cursor:"pointer",
                background:"rgba(245,200,66,0.03)", transition:"all 0.25s",
                position:"relative",
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor="var(--gold)"}
                onMouseLeave={e => e.currentTarget.style.borderColor="rgba(245,200,66,0.3)"}
              >
                {preview ? (
                  <div>
                    <img src={preview} alt="Preview" style={{ width:"100%", maxHeight:240, objectFit:"cover", borderRadius:"var(--radius)", marginBottom:12 }} />
                    <button className="btn-ghost" style={{ fontSize:12 }} onClick={() => { setPreview(""); set("image",""); }}>
                      ✕ Remove Image
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize:40, marginBottom:12 }}>🖼</div>
                    <p style={{ color:"var(--muted)", fontSize:14, marginBottom:8 }}>Click or drag to upload a cover image</p>
                    <p style={{ color:"var(--muted2)", fontSize:12 }}>JPG, PNG, WebP · Max 3MB</p>
                  </>
                )}
                <input
                  type="file" accept="image/*"
                  onChange={handleImageFile}
                  style={{ position:"absolute", inset:0, opacity:0, cursor:"pointer", width:"100%", height:"100%" }}
                />
              </div>
              <p style={{ fontSize:12, color:"var(--muted)", marginTop:6 }}>
                💡 No image? A beautiful placeholder will be shown automatically.
              </p>
            </div>

            {error && <div className="alert-err">{error}</div>}
            <div style={{ display:"flex", gap:12, justifyContent:"space-between", marginTop:8 }}>
              <button className="btn-ghost" onClick={() => { setError(""); setStep(1); }}>← Back</button>
              <button className="btn-gold" style={{ padding:"13px 36px" }} onClick={() => { setError(""); setStep(3); }}>
                Next: Review →
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 3 — Review & Publish ══════════════════════ */}
        {step === 3 && (
          <div>
            {/* Preview card */}
            <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden", marginBottom:28 }}>
              {preview ? (
                <img src={preview} alt="cover" style={{ width:"100%", height:200, objectFit:"cover" }} />
              ) : (
                <div style={{ width:"100%", height:200, background:"linear-gradient(135deg,#141630,#1e2040)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:48, marginBottom:8 }}>🎭</div>
                    <div style={{ color:"var(--muted)", fontSize:13 }}>No image uploaded</div>
                  </div>
                </div>
              )}
              <div style={{ padding:"24px 28px" }}>
                <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
                  <span style={{ background:"var(--gold)", color:"var(--ink)", fontSize:10, fontWeight:800, letterSpacing:2, textTransform:"uppercase", padding:"4px 12px", borderRadius:2 }}>
                    {form.category}
                  </span>
                  {form.tags.split(",").filter(Boolean).map(t => (
                    <span key={t} style={{ fontSize:10, fontWeight:600, color:"var(--muted)", border:"1px solid rgba(232,230,240,0.14)", padding:"3px 8px", borderRadius:2 }}>{t.trim()}</span>
                  ))}
                </div>
                <h2 style={{ fontFamily:"Cormorant Garamond,serif", fontSize:26, fontWeight:700, marginBottom:8 }}>{form.title || "Untitled Event"}</h2>
                <p style={{ color:"var(--muted)", fontSize:13, marginBottom:12, lineHeight:1.7 }}>{form.description}</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, fontSize:13, color:"var(--muted)" }}>
                  <span>📅 {form.date ? new Date(form.date).toLocaleDateString("en-IN",{dateStyle:"medium"}) : "TBA"} · {form.time}</span>
                  <span>📍 {form.venue}</span>
                  <span>🎟 {Number(form.totalSeats)||0} seats</span>
                  <span style={{ fontFamily:"Bebas Neue,sans-serif", fontSize:22, color:"var(--gold)", letterSpacing:1 }}>
                    {Number(form.price) === 0 ? "FREE" : `₹${Number(form.price).toLocaleString("en-IN")}`}
                  </span>
                </div>
                {form.schedule && (
                  <div style={{ marginTop:16, borderTop:"1px solid rgba(245,200,66,0.1)", paddingTop:16 }}>
                    <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"var(--gold)", marginBottom:8 }}>Schedule</div>
                    {form.schedule.split("\n").filter(Boolean).map((s,i) => (
                      <div key={i} style={{ display:"flex", gap:10, fontSize:13, color:"var(--muted)", marginBottom:4 }}>
                        <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--gold)", marginTop:5, flexShrink:0 }} />
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Summary checklist */}
            <div style={{ background:"rgba(45,212,160,0.05)", border:"1px solid rgba(45,212,160,0.2)", borderRadius:"var(--radius)", padding:"16px 20px", marginBottom:24 }}>
              <div style={{ fontSize:12, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:"var(--jade)", marginBottom:10 }}>Ready to Publish</div>
              {[
                ["Title",    form.title],
                ["Date",     form.date ? new Date(form.date).toLocaleDateString("en-IN",{dateStyle:"medium"}) : ""],
                ["Venue",    form.venue],
                ["Price",    Number(form.price) === 0 ? "Free" : `₹${Number(form.price).toLocaleString("en-IN")}`],
                ["Seats",    `${form.totalSeats} total`],
                ["Category", form.category],
              ].map(([label, val]) => (
                <div key={label} style={{ display:"flex", gap:12, fontSize:13, marginBottom:4 }}>
                  <span style={{ color:"var(--jade)", minWidth:70 }}>✓ {label}</span>
                  <span style={{ color:"var(--muted)" }}>{val}</span>
                </div>
              ))}
            </div>

            {error   && <div className="alert-err" style={{ marginBottom:16 }}>{error}</div>}
            {success && <div className="alert-ok"  style={{ marginBottom:16 }}>{success}</div>}

            <div style={{ display:"flex", gap:12 }}>
              <button className="btn-ghost" onClick={() => { setError(""); setStep(2); }}>← Back</button>
              <button
                className="btn-gold"
                style={{ flex:1, padding:15, fontSize:15 }}
                onClick={submit}
                disabled={busy}
              >
                {busy ? "Publishing…" : "🚀 Publish Event"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
