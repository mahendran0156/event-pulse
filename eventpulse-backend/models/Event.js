const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category:    { type: String, enum: ["Music","Technology","Food","Business","Arts","Workshop","Other"], required: true },
  date:        { type: Date, required: true },
  time:        { type: String, required: true },
  venue:       { type: String, required: true },
  price:       { type: Number, required: true, min: 0 },
  totalSeats:  { type: Number, required: true, min: 1 },
  bookedSeats: { type: Number, default: 0 },
  image:       { type: String, default: "" },
  tags:        [{ type: String }],
  schedule:    [{ type: String }],
  organizer:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  isActive:    { type: Boolean, default: true },
  rating:      { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true });

// ── TEXT INDEX — required for $text search queries ────────────
// Without this, any search query throws "text index required" and
// returns 0 events even when events exist in the database.
EventSchema.index({ title: "text", description: "text", tags: "text", venue: "text" });

// ── Virtuals ──────────────────────────────────────────────────
EventSchema.virtual("availableSeats").get(function () {
  return this.totalSeats - this.bookedSeats;
});
EventSchema.virtual("fillPercent").get(function () {
  return Math.round((this.bookedSeats / this.totalSeats) * 100);
});

EventSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Event", EventSchema);