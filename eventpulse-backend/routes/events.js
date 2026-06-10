const express = require("express");
const Event   = require("../models/Event");
const { protect, authorise } = require("../middleware/auth");

const router = express.Router();

// ── GET /api/events ───────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { search, category, sort, page = 1, limit = 12 } = req.query;

    // Build query — only filter active events
    const query = { isActive: true };

    // FIXED: Use regex search instead of $text so no index is required
    // $text requires a text index AND breaks when search is empty string.
    // Regex search works on any string field without a special index.
    if (search && search.trim()) {
      const rx = new RegExp(search.trim(), "i");
      query.$or = [
        { title:       rx },
        { description: rx },
        { venue:       rx },
        { tags:        rx },
        { category:    rx },
      ];
    }

    // FIXED: Treat "All", empty string, and undefined all as "no filter"
    if (category && category !== "All" && category !== "") {
      query.category = category;
    }

    const sortMap = {
      date:       { date: 1 },
      rating:     { rating: -1 },
      price_asc:  { price: 1 },
      price_desc: { price: -1 },
    };

    const skip   = (Number(page) - 1) * Number(limit);
    const events = await Event.find(query)
      .sort(sortMap[sort] || { date: 1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("organizer", "name email");

    const total = await Event.countDocuments(query);

    res.json({
      events,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
    });
  } catch (err) {
    console.error("GET /api/events error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/events/:id ───────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("organizer", "name email");
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json({ event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/events ──────────────────────────────────────────
router.post("/", protect, authorise("organizer", "admin"), async (req, res) => {
  try {
    const event = await Event.create({ ...req.body, organizer: req.user._id });
    res.status(201).json({ event });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── PUT /api/events/:id ───────────────────────────────────────
router.put("/:id", protect, authorise("organizer", "admin"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== "admin")
      return res.status(403).json({ error: "Not authorised to edit this event" });
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ event: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── DELETE /api/events/:id ────────────────────────────────────
router.delete("/:id", protect, authorise("organizer", "admin"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== "admin")
      return res.status(403).json({ error: "Not authorised" });
    await event.deleteOne();
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;