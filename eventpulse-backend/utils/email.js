const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send booking confirmation email with QR token
const sendBookingConfirmation = async (booking) => {
  const event = booking.event;
  const user  = booking.user;

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0b0c1a;color:#e8e6f0;padding:32px;border-radius:8px;">
      <h1 style="color:#f5c842;font-size:28px;margin-bottom:8px;">🎉 Booking Confirmed!</h1>
      <p style="color:#aaa;">Hi ${user.name}, your ticket is confirmed.</p>
      <hr style="border-color:#333;margin:24px 0;"/>
      <h2 style="font-size:20px;">${event.title}</h2>
      <p>📅 ${new Date(event.date).toLocaleDateString("en-IN", { dateStyle: "full" })} · ${event.time}</p>
      <p>📍 ${event.venue}</p>
      <p>🎟️ ${booking.qty} ticket${booking.qty > 1 ? "s" : ""} · <strong style="color:#f5c842;">₹${booking.totalAmount.toLocaleString("en-IN")}</strong></p>
      <hr style="border-color:#333;margin:24px 0;"/>
      <p style="font-size:13px;color:#aaa;">Booking ID: <code style="color:#f5c842;">${booking._id}</code></p>
      <p style="font-size:13px;color:#aaa;">Payment ID: <code style="color:#f5c842;">${booking.razorpayPaymentId}</code></p>
      <div style="text-align:center;margin-top:28px;background:#141630;border-radius:8px;padding:20px;">
        <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#aaa;margin-bottom:8px;">Your QR Ticket Token</p>
        <p style="font-family:monospace;font-size:20px;color:#f5c842;letter-spacing:4px;">${booking.qrToken}</p>
        <p style="font-size:11px;color:#666;margin-top:8px;">Present this at the venue for entry</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from:    `"EventPulse" <${process.env.EMAIL_USER}>`,
    to:      user.email,
    subject: `✅ Booking Confirmed — ${event.title}`,
    html,
  });
};

module.exports = { sendBookingConfirmation };
