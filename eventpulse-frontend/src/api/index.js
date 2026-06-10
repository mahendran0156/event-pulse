// ─── API Service Layer ────────────────────────────────────────
// All communication with the Express backend lives here.
// Components never call fetch() directly.

const BASE = import.meta.env.VITE_API_URL || "/api";

const authHeaders = () => {
  const token = localStorage.getItem("ep_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register: (body) => fetch(`${BASE}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(handle),
  login:    (body) => fetch(`${BASE}/auth/login`,    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(handle),
  me:       ()     => fetch(`${BASE}/auth/me`,        { headers: authHeaders() }).then(handle),
};

// ── Events ────────────────────────────────────────────────────
export const eventsAPI = {
  list: (params = {}) => {
    // FIXED: Strip ALL default/empty values before building query string.
    // category="All" and category="" both mean "no filter" — remove them.
    // page=1 and limit defaults are still sent so the backend paginates correctly.
    const clean = {};
    if (params.search   && params.search.trim())   clean.search   = params.search.trim();
    if (params.category && params.category !== "All" && params.category !== "") clean.category = params.category;
    if (params.sort     && params.sort !== "date") clean.sort     = params.sort;
    if (params.page     && params.page > 1)        clean.page     = params.page;
    if (params.limit)                               clean.limit    = params.limit;

    const qs = new URLSearchParams(clean).toString();
    return fetch(`${BASE}/events${qs ? "?" + qs : ""}`).then(handle);
  },
  get:    (id)       => fetch(`${BASE}/events/${id}`).then(handle),
  create: (body)     => fetch(`${BASE}/events`,       { method: "POST", headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  update: (id, body) => fetch(`${BASE}/events/${id}`, { method: "PUT",  headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  delete: (id)       => fetch(`${BASE}/events/${id}`, { method: "DELETE", headers: authHeaders() }).then(handle),
};

// ── Payments ─────────────────────────────────────────────────
export const paymentsAPI = {
  createOrder: (body) => fetch(`${BASE}/payments/create-order`, { method: "POST", headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
  verify:      (body) => fetch(`${BASE}/payments/verify`,       { method: "POST", headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
};

// ── Bookings ──────────────────────────────────────────────────
export const bookingsAPI = {
  mine:   ()   => fetch(`${BASE}/bookings/my`,            { headers: authHeaders() }).then(handle),
  get:    (id) => fetch(`${BASE}/bookings/${id}`,         { headers: authHeaders() }).then(handle),
  cancel: (id) => fetch(`${BASE}/bookings/${id}/cancel`,  { method: "POST", headers: authHeaders() }).then(handle),
};

// ── Users ─────────────────────────────────────────────────────
export const usersAPI = {
  dashboard:     ()     => fetch(`${BASE}/users/dashboard`, { headers: authHeaders() }).then(handle),
  updateProfile: (body) => fetch(`${BASE}/users/profile`,   { method: "PUT", headers: authHeaders(), body: JSON.stringify(body) }).then(handle),
};