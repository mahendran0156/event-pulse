const express  = require("express");
const Razorpay = require("razorpay");
const crypto   = require("crypto");
const Booking  = require("../models/Booking");
const Event    = require("../models/Event");
const { protect } = require("../middleware/auth");
const { sendBookingConfirmation } = require("../utils/email");

const router = express.Router();

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─────────────────────────────────────────────────────────────
// STEP 1 — Create Razorpay Order
// Called by frontend when user clicks "Proceed to Payment"
// ─────────────────────────────────────────────────────────────
router.post("/create-order", protect, async (req, res) => {
  try {
    const { eventId, qty } = req.body;

    // 1. Validate event
    const event = await Event.findById(eventId);
    if (!event)        return res.status(404).json({ error: "Event not found" });
    if (!event.isActive) return res.status(400).json({ error: "Event is no longer active" });

    // 2. Check seat availability
    const available = event.totalSeats - event.bookedSeats;
    if (qty > available)
      return res.status(400).json({ error: `Only ${available} seats available` });

    const totalAmount = event.price * qty; // INR

    // 3. Create a pending booking record
    const booking = await Booking.create({
      user:        req.user._id,
      event:       event._id,
      qty,
      totalAmount,
      status:      "pending",
    });

    // 4. Create Razorpay order (amount in paise = INR × 100)
    const order = await razorpay.orders.create({
      amount:   totalAmount * 100,
      currency: "INR",
      receipt:  `receipt_${booking._id}`,
      notes: {
        bookingId: booking._id.toString(),
        eventId:   event._id.toString(),
        userId:    req.user._id.toString(),
      },
    });

    // 5. Store orderId on booking
    booking.razorpayOrderId = order.id;
    await booking.save();

    res.json({
      orderId:    order.id,
      amount:     order.amount,       // paise
      currency:   "INR",
      bookingId:  booking._id,
      key:        process.env.RAZORPAY_KEY_ID,
      prefill: {
        name:  req.user.name,
        email: req.user.email,
        phone: req.user.phone || "",
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// STEP 2 — Verify Payment (called after Razorpay popup closes)
// NEVER skip this step — it's what prevents fraud
// ─────────────────────────────────────────────────────────────
router.post("/verify", protect, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = req.body;

    // 1. HMAC-SHA256 signature check
    const body     = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      // Mark booking as potentially fraudulent
      await Booking.findByIdAndUpdate(bookingId, { status: "cancelled" });
      return res.status(400).json({ ok: false, error: "Payment signature mismatch — possible fraud" });
    }

    // 2. Fetch full payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    // 3. Update booking → confirmed
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        razorpayOrderId:   razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paymentMethod:     payment.method,
        status:            "confirmed",
        qrToken:           crypto.randomBytes(16).toString("hex").toUpperCase(),
      },
      { new: true }
    ).populate("event").populate("user", "name email");

    // 4. Increment booked seats on the event
    await Event.findByIdAndUpdate(booking.event._id, {
      $inc: { bookedSeats: booking.qty },
    });

    // 5. Send confirmation email
    try {
      await sendBookingConfirmation(booking);
    } catch (mailErr) {
      console.error("Email send failed (non-fatal):", mailErr.message);
    }

    res.json({ ok: true, booking });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// STEP 3 — Razorpay Webhook (backup — fires even if user closes tab)
// Set this URL in Razorpay Dashboard → Webhooks
// URL: https://your-domain.com/api/payments/webhook
// ─────────────────────────────────────────────────────────────
router.post("/webhook", async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature     = req.headers["x-razorpay-signature"];

    // Verify webhook authenticity using raw body
    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body)           // raw Buffer (see express.raw in server.js)
      .digest("hex");

    if (expected !== signature) {
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const event   = JSON.parse(req.body);
    const payload = event.payload?.payment?.entity;

    if (event.event === "payment.captured") {
      // Find booking by Razorpay order ID
      const booking = await Booking.findOne({ razorpayOrderId: payload.order_id });
      if (booking && booking.status !== "confirmed") {
        booking.status            = "confirmed";
        booking.razorpayPaymentId = payload.id;
        booking.qrToken           = booking.qrToken || crypto.randomBytes(16).toString("hex").toUpperCase();
        await booking.save();
        await Event.findByIdAndUpdate(booking.event, { $inc: { bookedSeats: booking.qty } });
      }
    }

    if (event.event === "payment.failed") {
      await Booking.findOneAndUpdate(
        { razorpayOrderId: payload.order_id },
        { status: "cancelled" }
      );
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
