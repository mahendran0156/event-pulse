const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
  event:         { type: mongoose.Schema.Types.ObjectId, ref: "Event",   required: true },
  qty:           { type: Number, required: true, min: 1 },
  totalAmount:   { type: Number, required: true },          // in INR
  status:        {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "refunded"],
    default: "pending",
  },
  // Razorpay fields — populated after payment
  razorpayOrderId:   { type: String, default: "" },
  razorpayPaymentId: { type: String, default: "" },
  razorpaySignature: { type: String, default: "" },
  paymentMethod:     { type: String, default: "" },         // card | upi | netbanking
  // QR ticket token
  qrToken:       { type: String, default: "" },
  checkedIn:     { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Booking", BookingSchema);
