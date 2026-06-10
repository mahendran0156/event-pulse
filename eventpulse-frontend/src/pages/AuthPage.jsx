import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode]   = useState("login");
  const [form, setForm]   = useState({ name: "", email: "", password: "", role: "attendee" });
  const [error, setError]  = useState("");
  const [busy, setBusy]    = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(""); setBusy(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        if (!form.name.trim()) throw new Error("Name is required");
        await register(form.name, form.email, form.password, form.role);
      }
      navigate("/");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const onKey = e => { if (e.key === "Enter") submit(); };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "Bebas Neue,sans-serif", fontSize: 30, letterSpacing: 4, color: "var(--gold)" }}>
            EVENTPULSE
          </div>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>
            {mode === "login"
              ? "Demo: demo@eventpulse.com / demo123"
              : "Create your free account"}
          </p>
        </div>

        {/* Mode tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab${mode === "login" ? " active" : ""}`} onClick={() => setMode("login")}>
            Sign In
          </button>
          <button className={`auth-tab${mode === "register" ? " active" : ""}`} onClick={() => setMode("register")}>
            Register
          </button>
        </div>

        {/* Form fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {mode === "register" && (
            <div>
              <label className="inp-label">Full Name</label>
              <input className="inp" placeholder="Your name" value={form.name} onChange={e => set("name", e.target.value)} onKeyDown={onKey} />
            </div>
          )}

          <div>
            <label className="inp-label">Email Address</label>
            <input className="inp" type="email" placeholder="you@example.com" value={form.email} onChange={e => set("email", e.target.value)} onKeyDown={onKey} />
          </div>

          <div>
            <label className="inp-label">Password</label>
            <input className="inp" type="password" placeholder="••••••••" value={form.password} onChange={e => set("password", e.target.value)} onKeyDown={onKey} />
          </div>

          {mode === "register" && (
            <div>
              <label className="inp-label">Role</label>
              <select className="inp" value={form.role} onChange={e => set("role", e.target.value)}>
                <option value="attendee">Attendee — Browse &amp; book events</option>
                <option value="organizer">Organizer — Create &amp; manage events</option>
              </select>
            </div>
          )}

          {error && <div className="alert-err">{error}</div>}

          <button
            className="btn-gold"
            style={{ width: "100%", padding: 15, fontSize: 14, marginTop: 4 }}
            onClick={submit}
            disabled={busy}
          >
            {busy ? "Please wait…" : mode === "login" ? "Sign In →" : "Create Account →"}
          </button>

          <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted)" }}>
            {mode === "login"
              ? <>Don't have an account? <span style={{ color: "var(--gold)", cursor: "pointer" }} onClick={() => setMode("register")}>Register</span></>
              : <>Already have an account? <span style={{ color: "var(--gold)", cursor: "pointer" }} onClick={() => setMode("login")}>Sign In</span></>
            }
          </p>
        </div>
      </div>
    </div>
  );
}
