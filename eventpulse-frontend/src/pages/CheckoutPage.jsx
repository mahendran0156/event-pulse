import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { paymentsAPI } from "../api";
import QRCode from "../components/QRCode";

export default function CheckoutPage() {
  const { user }               = useAuth();
  const { cart, clearCart, cartTotal } = useCart();
  const navigate               = useNavigate();

  const [step,    setStep]    = useState(1);
  const [method,  setMethod]  = useState("card");
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState("");
  const [confs,   setConfs]   = useState([]);

  // ── Step 1 → 2 ──────────────────────────────────────────────
  const goToPayment = () => {
    if (cart.length === 0) return;
    setStep(2);
  };

  // ── Real Razorpay payment flow ───────────────────────────────
  const handlePay = async () => {
    setBusy(true); setError("");
    try {
      const results = [];

      // Process each cart item individually (one booking per event)
      for (const item of cart) {
        // Step A — create order on backend
        const orderData = await paymentsAPI.createOrder({
          eventId: item.event._id,
          qty:     item.qty,
        });

        // Step B — open Razorpay popup
        await new Promise((resolve, reject) => {
          const options = {
            key:         orderData.key,
            amount:      orderData.amount,
            currency:    "INR",
            name:        "EventPulse",
            description: item.event.title,
            order_id:    orderData.orderId,
            prefill:     orderData.prefill,
            theme:       { color: "#f5c842" },
            modal:       {
              ondismiss: () => reject(new Error("Payment cancelled")),
            },
            handler: async (response) => {
              try {
                // Step C — verify on backend
                const verified = await paymentsAPI.verify({
                  razorpay_order_id:   response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature:  response.razorpay_signature,
                  bookingId:           orderData.bookingId,
                });
                if (verified.ok) {
                  results.push(verified.booking);
                  resolve();
                } else {
                  reject(new Error(verified.error || "Verification failed"));
                }
              } catch (e) {
                reject(e);
              }
            },
          };

          // Ensure Razorpay SDK is loaded
          if (!window.Razorpay) {
            reject(new Error("Razorpay SDK not loaded. Check your index.html."));
            return;
          }
          const rzp = new window.Razorpay(options);
          rzp.open();
        });
      }

      setConfs(results);
      clearCart();
      setStep(3);
    } catch (e) {
      setError(e.message || "Payment failed");
    } finally {
      setBusy(false);
    }
  };

  // ── Empty cart ───────────────────────────────────────────────
  if (cart.length === 0 && step !== 3) {
    return (
      <div className="page" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🛒</div>
        <p style={{ color: "var(--muted)", marginBottom: 24, fontSize: 18 }}>Your cart is empty</p>
        <button className="btn-gold" onClick={() => navigate("/events")}>Browse Events</button>
      </div>
    );
  }

  const STEPS = ["Review Order", "Payment", "Confirmed"];

  return (
    <div className="page">
      <div className="checkout-wrap">
        {/* ── Page title ────────────────────────────────── */}
        <h1 style={{ fontFamily: "Cormorant Garamond,serif", fontSize: "clamp(32px,5vw,52px)", fontWeight: 700, letterSpacing: -1, marginBottom: 40 }}>
          {STEPS[step - 1]}
        </h1>

        {/* ── Step tracker ──────────────────────────────── */}
        <div className="step-track" style={{ marginBottom: 48 }}>
          {STEPS.map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "auto" }}>
              <div className={`step-node${step > i + 1 ? " done" : step === i + 1 ? " active" : ""}`}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className="step-label" style={{ marginLeft: 8, marginRight: i < 2 ? 12 : 0, color: step === i + 1 ? "var(--gold)" : "var(--muted)" }}>
                {label}
              </span>
              {i < 2 && <div className={`step-line${step > i + 1 ? " done" : ""}`} />}
            </div>
          ))}
        </div>

        {/* ══ STEP 1 — Cart review ═════════════════════════ */}
        {step === 1 && (
          <div>
            {cart.map((item, i) => (
              <div key={i} className="co-item">
                {item.event.image ? (
                  <img src={item.event.image} alt={item.event.title} style={{ width: 90, height: 66, objectFit: "cover", borderRadius: "var(--radius)", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 90, height: 66, background: "var(--surface)", borderRadius: "var(--radius)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🎭</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.event.title}</div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>
                    📅 {item.event.date ? new Date(item.event.date).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "TBA"} · {item.event.time}
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 13 }}>Qty: {item.qty} × ₹{item.event.price.toLocaleString("en-IN")}</div>
                </div>
                <div style={{ fontFamily: "Bebas Neue,sans-serif", fontSize: 24, color: "var(--gold)", letterSpacing: 1 }}>
                  ₹{(item.event.price * item.qty).toLocaleString("en-IN")}
                </div>
              </div>
            ))}

            {/* Order total */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "20px 0", borderTop: "1px solid rgba(245,200,66,0.14)", marginBottom: 28 }}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>Order Total</span>
              <span style={{ fontFamily: "Bebas Neue,sans-serif", fontSize: 30, color: "var(--gold)", letterSpacing: 1 }}>
                ₹{cartTotal.toLocaleString("en-IN")}
              </span>
            </div>

            <button className="btn-gold" style={{ width: "100%", padding: 15, fontSize: 14 }} onClick={goToPayment}>
              Proceed to Payment →
            </button>
          </div>
        )}

        {/* ══ STEP 2 — Payment ══════════════════════════════ */}
        {step === 2 && (
          <div>
            {/* Payment method tabs */}
            <div className="pay-methods">
              {[["card","💳 Card"],["upi","📱 UPI"],["netbanking","🏦 Net Banking"]].map(([m, l]) => (
                <button key={m} className={`pay-btn${method === m ? " active" : ""}`} onClick={() => setMethod(m)}>{l}</button>
              ))}
            </div>

            {/* Method-specific fields (UI only — Razorpay popup handles actual input) */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px 24px", marginBottom: 20 }}>
              {method === "card" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div><label className="inp-label">Card Number</label><input className="inp" placeholder="Will be entered in Razorpay popup" disabled /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div><label className="inp-label">Expiry</label><input className="inp" placeholder="MM/YY" disabled /></div>
                    <div><label className="inp-label">CVV</label><input className="inp" type="password" placeholder="•••" disabled /></div>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                    🔒 Card details are entered securely in the Razorpay popup — never sent to EventPulse servers.
                  </p>
                </div>
              )}
              {method === "upi" && (
                <div>
                  <label className="inp-label">UPI ID</label>
                  <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                    You'll be prompted for your UPI ID in the Razorpay checkout popup.
                    <br />Test UPI: <code style={{ color: "var(--gold)" }}>success@razorpay</code>
                  </p>
                </div>
              )}
              {method === "netbanking" && (
                <div>
                  <label className="inp-label">Bank</label>
                  <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                    Select your bank in the Razorpay popup to be redirected to your bank's portal.
                  </p>
                </div>
              )}
            </div>

            {/* Amount summary */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 20px", background: "rgba(245,200,66,0.05)", border: "1px solid rgba(245,200,66,0.14)", borderRadius: "var(--radius)", marginBottom: 20 }}>
              <span style={{ color: "var(--muted)", fontSize: 14 }}>Amount to Pay</span>
              <span style={{ fontFamily: "Bebas Neue,sans-serif", fontSize: 24, color: "var(--gold)", letterSpacing: 1 }}>₹{cartTotal.toLocaleString("en-IN")}</span>
            </div>

            {error && <div className="alert-err" style={{ marginBottom: 16 }}>{error}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12 }}>
              <button className="btn-ghost" onClick={() => { setStep(1); setError(""); }}>← Back</button>
              <button className="btn-gold" style={{ padding: 15, fontSize: 14 }} onClick={handlePay} disabled={busy}>
                {busy ? "Opening Razorpay…" : `Pay ₹${cartTotal.toLocaleString("en-IN")} →`}
              </button>
            </div>

            <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted2)", marginTop: 16 }}>
              🔒 Secured by Razorpay · PCI-DSS Compliant
            </p>
          </div>
        )}

        {/* ══ STEP 3 — Confirmation ════════════════════════ */}
        {step === 3 && (
          <div className="fade-up">
            {/* Success banner */}
            <div style={{ textAlign: "center", marginBottom: 36, padding: "32px", background: "rgba(45,212,160,0.06)", border: "1px solid rgba(45,212,160,0.2)", borderRadius: "var(--radius-lg)" }}>
              <div style={{ fontSize: 56, marginBottom: 10 }}>🎉</div>
              <div style={{ fontFamily: "Cormorant Garamond,serif", fontSize: 30, fontWeight: 700, color: "var(--jade)" }}>
                Payment Successful!
              </div>
              <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 8 }}>
                Confirmation emails have been sent to <strong>{user?.email}</strong>
              </p>
            </div>

            {/* Booking cards */}
            {confs.map(b => (
              <div key={b._id || b.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 28, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontFamily: "Cormorant Garamond,serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
                      {b.event?.title || "Event"}
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.8 }}>
                      📅 {b.event?.date ? new Date(b.event.date).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "TBA"} · {b.event?.time}<br />
                      📍 {b.event?.venue}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                      Booking ID: <code style={{ color: "var(--gold)", fontFamily: "monospace" }}>
                        {(b._id || b.id || "").toString().toUpperCase()}
                      </code>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      Payment ID: <code style={{ color: "var(--gold)", fontFamily: "monospace" }}>
                        {b.razorpayPaymentId || "—"}
                      </code>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "Bebas Neue,sans-serif", fontSize: 30, color: "var(--gold)", letterSpacing: 1 }}>
                      ₹{(b.totalAmount || 0).toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
                      {b.qty} ticket{b.qty !== 1 ? "s" : ""}
                    </div>
                    <span className="badge-confirmed">✓ Confirmed</span>
                  </div>
                </div>

                {/* QR Ticket */}
                <div style={{ borderTop: "1px solid rgba(245,200,66,0.1)", paddingTop: 24, textAlign: "center" }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--muted)", marginBottom: 16 }}>
                    Your QR Ticket — Present at Venue
                  </div>
                  <QRCode token={b.qrToken} />
                  <div style={{ fontFamily: "monospace", fontSize: 13, color: "var(--gold)", marginTop: 10, letterSpacing: 3 }}>
                    {b.qrToken}
                  </div>
                </div>
              </div>
            ))}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
              <button className="btn-gold" style={{ padding: 14 }} onClick={() => navigate("/dashboard")}>
                View Dashboard
              </button>
              <button className="btn-outline" style={{ padding: 14 }} onClick={() => navigate("/events")}>
                Browse More Events
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
