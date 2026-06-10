import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { eventsAPI } from "../api";
import EventCard from "../components/EventCard";

const CATS  = ["All","Music","Technology","Food","Business","Arts","Workshop"];
const SORTS = [
  { value: "date",       label: "Upcoming First" },
  { value: "rating",     label: "Top Rated" },
  { value: "price_asc",  label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
];

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events,  setEvents]  = useState([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // Read params — use sensible defaults that do NOT appear in the URL on first load
  const search   = searchParams.get("search")   || "";
  const category = searchParams.get("category") || "All";
  const sort     = searchParams.get("sort")     || "date";
  const page     = Number(searchParams.get("page") || 1);

  // FIXED: setParam only writes params that differ from their default.
  // This prevents "category=All&page=1" from appearing in the URL,
  // which was confusing the API layer and causing 0 results.
  const setParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    const defaults = { category: "All", sort: "date", page: "1", search: "" };
    if (val === defaults[key]) {
      next.delete(key);
    } else {
      next.set(key, val);
    }
    // Reset page to 1 on filter/search change
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  };

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    eventsAPI.list({ search, category, sort, page, limit: 9 })
      .then(d => {
        setEvents(d.events || []);
        setTotal(d.total   || 0);
        setPages(d.pages   || 1);
      })
      .catch(e => {
        console.error("Events load error:", e);
        setError("Could not load events. Make sure the backend is running on port 5000.");
        setEvents([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [search, category, sort, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="page">
      {/* ── Page header ──────────────────────────────────── */}
      <section className="sec" style={{
        paddingBottom: 40,
        background: "radial-gradient(ellipse 80% 60% at 50% 0%,rgba(245,200,66,0.05),transparent)",
      }}>
        <div className="sec-label">Browse</div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:20 }}>
          <h1 className="sec-title">
            All <span className="it gold">Events</span>
          </h1>
          <p style={{ color:"var(--muted)", fontSize:14 }}>
            {loading ? "Loading…" : `${total} event${total !== 1 ? "s" : ""} found`}
          </p>
        </div>
      </section>

      {/* ── Filter bar ───────────────────────────────────── */}
      <div className="filter-bar">
        <input
          className="inp"
          placeholder="Search events, tags…"
          value={search}
          onChange={e => setParam("search", e.target.value)}
          style={{ maxWidth: 280 }}
        />
        {CATS.map(c => (
          <button
            key={c}
            className={`cat-pill${category === c ? " active" : ""}`}
            onClick={() => setParam("category", c)}
          >
            {c}
          </button>
        ))}
        <select
          className="inp"
          value={sort}
          onChange={e => setParam("sort", e.target.value)}
          style={{ maxWidth: 180, marginLeft: "auto" }}
        >
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* ── Events grid ──────────────────────────────────── */}
      <section className="sec" style={{ paddingTop: 40 }}>

        {/* Backend connection error */}
        {error && !loading && (
          <div style={{
            background:"rgba(255,92,53,0.08)", border:"1px solid rgba(255,92,53,0.3)",
            borderRadius:"var(--radius)", padding:"20px 24px", marginBottom:32, color:"var(--ember)",
          }}>
            <strong>⚠ Connection Error</strong>
            <p style={{ fontSize:13, marginTop:6, color:"var(--muted)" }}>{error}</p>
            <button className="btn-ghost" style={{ marginTop:12, fontSize:12 }} onClick={load}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="spinner" />
        ) : events.length === 0 && !error ? (
          <div style={{ textAlign:"center", padding:"80px 0", color:"var(--muted)" }}>
            <div style={{ fontSize:52, marginBottom:16 }}>🔍</div>
            <p style={{ fontSize:18, marginBottom:8 }}>No events found</p>
            <p style={{ fontSize:14, marginBottom:24 }}>
              {search || category !== "All"
                ? "Try a different search or category"
                : "Run node utils/seed.js in your backend folder to add events"}
            </p>
            {(search || category !== "All") && (
              <button
                className="btn-outline"
                onClick={() => { setSearchParams({}); }}
                style={{ fontSize:13 }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="events-grid">
            {events.map(ev => <EventCard key={ev._id} event={ev} />)}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && !loading && (
          <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:48 }}>
            <button className="btn-ghost" disabled={page <= 1} onClick={() => setParam("page", String(page - 1))}>
              ← Prev
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={p === page ? "btn-gold" : "btn-ghost"}
                style={{ padding:"9px 18px", minWidth:44 }}
                onClick={() => setParam("page", String(p))}
              >
                {p}
              </button>
            ))}
            <button className="btn-ghost" disabled={page >= pages} onClick={() => setParam("page", String(page + 1))}>
              Next →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}