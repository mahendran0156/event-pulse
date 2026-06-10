// ============================================================
// EventPulse Backend — server.js
// ============================================================
const express    = require("express");
const mongoose   = require("mongoose");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const rateLimit  = require("express-rate-limit");
require("dotenv").config();

const authRoutes    = require("./routes/auth");
const eventRoutes   = require("./routes/events");
const bookingRoutes = require("./routes/bookings");
const paymentRoutes = require("./routes/payments");
const userRoutes    = require("./routes/users");

const app = express();

// ── Security ─────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, try again later.",
});
app.use("/api/", limiter);

// ── Body parsing ──────────────────────────────────────────────
// IMPORTANT: raw body needed for Razorpay webhook signature verification
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// ── Health check ──────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok", env: process.env.NODE_ENV }));

// ── Routes ───────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/events",   eventRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/users",    userRoutes);

// ── 404 ──────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "production" ? "Server error" : err.message,
  });
});

// ── DB + Start ────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅  MongoDB connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀  Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error("❌  MongoDB connection failed:", err.message);
    process.exit(1);
  });

module.exports = app;
