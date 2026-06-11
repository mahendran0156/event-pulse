# EventPulse 🎭
### India's Premier Full-Stack Event Management Platform

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb&logoColor=white)](https://mongodb.com/atlas)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay-02042B?style=flat&logo=razorpay&logoColor=white)](https://razorpay.com)
[![License](https://img.shields.io/badge/License-MIT-gold?style=flat)](LICENSE)

EventPulse is a production-grade event management platform built on the **MERN stack**. Attendees can browse, book, and receive QR tickets. Organisers can create and manage events. Payments are processed via **Razorpay** with cryptographic signature verification.

---

## ✨ Features

### For Attendees
- 🔍 Browse events with real-time search, category filtering, and sort (date / rating / price)
- 🎟 Book tickets with quantity selector and live seat availability bar
- 💳 Pay via **UPI, Credit/Debit Card, or Net Banking** — powered by Razorpay
- 📱 Receive an instant **QR ticket by email** on payment confirmation
- 📊 Personal dashboard — view all bookings, show/hide QR codes, cancel bookings

### For Organisers
- ✏️ **3-step event creation form** — details → schedule & image → live preview → publish
- 🖼 Upload a cover image or use the auto-styled placeholder
- 📈 Real-time seat fill tracking and revenue summary in the organiser dashboard
- 🗑 Delete events from the dashboard

### Platform
- 🔐 JWT-based authentication with bcrypt password hashing
- 🛡 HMAC-SHA256 Razorpay signature verification on every payment
- 📧 Booking confirmation emails with QR token via Nodemailer
- 🔒 Helmet headers, CORS origin guard, Express rate limiting
- 📑 Razorpay webhook — backup payment confirmation even if browser closes

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Context API |
| **Styling** | Custom CSS — Midnight Navy × Molten Gold design system |
| **Backend** | Node.js 18, Express 4 |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Auth** | JSON Web Tokens (JWT), bcryptjs |
| **Payments** | Razorpay (UPI, Cards, Net Banking) |
| **Email** | Nodemailer + Gmail SMTP |
| **Security** | Helmet, CORS, express-rate-limit |

---

## 📁 Project Structure

```
event_pulse/
├── eventpulse-backend/
│   ├── server.js
│   ├── .env.example
│   ├── models/          User.js  Event.js  Booking.js
│   ├── routes/          auth.js  events.js  payments.js  bookings.js  users.js
│   ├── middleware/      auth.js
│   └── utils/           seed.js  email.js
│
└── eventpulse-frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── api/         index.js
        ├── context/     AuthContext.jsx  CartContext.jsx
        ├── components/  Navbar  EventCard  QRCode  OrganizerEvents  Cursor
        ├── pages/       Home  Events  Detail  Auth  CreateEvent  Checkout  Dashboard
        └── styles/      global.css
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Download |
|---|---|---|
| Node.js | v18 or later | [nodejs.org](https://nodejs.org) |
| npm | v9+ | Comes with Node |
| Git | Any | [git-scm.com](https://git-scm.com) |

You also need free accounts at:
- [MongoDB Atlas](https://cloud.mongodb.com) — free M0 cluster
- [Razorpay](https://razorpay.com) — test mode keys
- Google Account with App Password for emails

---

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/mahendran0156/eventpulse.git
cd eventpulse
```

**2. Backend setup**
```bash
cd eventpulse-backend
npm install
cp .env.example .env
# Fill in MONGODB_URI, JWT_SECRET, RAZORPAY keys, EMAIL credentials
```

**3. Seed the database**
```bash
node utils/seed.js
# Adds 6 events + 2 demo users
```

**4. Start the backend**
```bash
npm run dev
# ✅  MongoDB connected
# 🚀  Server running on port 5000
```

**5. Frontend setup** *(new terminal)*
```bash
cd eventpulse-frontend
npm install
cp .env.example .env
# Set VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
npm run dev
# ➜  http://localhost:5173
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Attendee | demo@eventpulse.com | demo123 |
| Organizer | org@eventpulse.com | demo123 |

---

## 💳 Test Payments

| Method | Test Value | Result |
|---|---|---|
| Card | `4111 1111 1111 1111` | ✅ Success |
| Card | `4000 0000 0000 0002` | ❌ Decline |
| UPI | `success@razorpay` | ✅ Success |

Use any future expiry date and any 3-digit CVV.

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/auth/me` | Get current user |

### Events
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/events` | List (search, filter, sort, paginate) |
| GET | `/api/events/:id` | Single event |
| POST | `/api/events` | Create (Organizer) |
| PUT | `/api/events/:id` | Update (Owner) |
| DELETE | `/api/events/:id` | Delete (Owner) |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/payments/create-order` | Step 1 — Create Razorpay order |
| POST | `/api/payments/verify` | Step 2 — Verify HMAC signature |
| POST | `/api/payments/webhook` | Backup from Razorpay |

---

## 💳 Payment Flow

```
User → "Book Now"
     → POST /api/payments/create-order  (backend creates Razorpay order)
     → Razorpay popup  (user pays securely)
     → POST /api/payments/verify  (HMAC-SHA256 check)
     → Booking confirmed in MongoDB
     → QR ticket emailed to attendee
     → POST /api/payments/webhook  (backup — fires even if browser closes)
```

> **Security rule**: Never trust the frontend. Always verify `razorpay_signature` server-side.

---

## 🌐 Deployment

### Backend → Render
```
Build:  npm install
Start:  node server.js
Env:    Add all .env variables in Render dashboard
```

### Frontend → Vercel
```
Framework: Vite
Env vars:  VITE_API_URL + VITE_RAZORPAY_KEY_ID
```

---

## 🔒 Security

| Feature | Implementation |
|---|---|
| Password hashing | bcryptjs — salt rounds 12 |
| Authentication | JWT — 7-day expiry |
| Payment fraud prevention | HMAC-SHA256 signature verification |
| HTTP security headers | Helmet.js |
| CORS | Origin whitelist |
| Rate limiting | 100 req / 15 min per IP |
| Role guards | `protect()` + `authorise()` middleware |

---

## 👤 Author

**Mahendran K** — MERN Stack Developer

- 🔗 LinkedIn: [linkedin.com/in/mahendran0156](https://linkedin.com/in/mahendran0156)
- 🐙 GitHub: [github.com/mahendran0156](https://github.com/mahendran0156)
- 📧 Email: mahendran0156@gmail.com
- 🌐 Portfolio: [collab-frontend-sjlx.onrender.com](https://collab-frontend-sjlx.onrender.com)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  Made with ❤️ in Coimbatore, Tamil Nadu
  <br />
  <strong>EventPulse</strong> — Discover &amp; Live Every Moment
</div>
