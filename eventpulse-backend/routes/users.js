const express = require("express");
const User    = require("../models/User");
const Booking = require("../models/Booking");
const { protect } = require("../middleware/auth");

const router = express.Router();

// ── GET /api/users/profile ────────────────────────────────────
router.get("/profile", protect, async (req, res) => {
  res.json({ user: req.user });
});

// ── PUT /api/users/profile ────────────────────────────────────
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, avatar },
      { new: true, runValidators: true }
    );
    res.json({ user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── GET /api/users/dashboard ──────────────────────────────────
// Summary stats for the logged-in user
router.get("/dashboard", protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id });
    const totalSpent  = bookings.filter(b => b.status === "confirmed").reduce((s, b) => s + b.totalAmount, 0);
    const upcoming    = bookings.filter(b => b.status === "confirmed").length;
    res.json({ totalBookings: bookings.length, totalSpent, upcoming });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
