const express = require("express");
const Booking = require("../models/Booking");
const { protect, authorise } = require("../middleware/auth");

const router = express.Router();

// ── GET /api/bookings/my ──────────────────────────────────────
// Logged-in user's own bookings
router.get("/my", protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("event", "title date time venue image category")
      .sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/bookings/:id ─────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("event", "title date time venue image")
      .populate("user", "name email");

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // Only the booking owner or admin can view
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin")
      return res.status(403).json({ error: "Not authorised" });

    res.json({ booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/bookings/:id/cancel ─────────────────────────────
router.post("/:id/cancel", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (booking.user.toString() !== req.user._id.toString())
      return res.status(403).json({ error: "Not authorised" });

    if (booking.status === "cancelled")
      return res.status(400).json({ error: "Already cancelled" });

    booking.status = "cancelled";
    await booking.save();
    res.json({ message: "Booking cancelled", booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
