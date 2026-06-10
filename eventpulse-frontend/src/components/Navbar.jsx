import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, logout }  = useAuth();
  const { cart }          = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const is = (path) => location.pathname === path;

  return (
    <nav className={`nav${scrolled ? " scrolled" : ""}`}>
      {/* Logo */}
      <Link to="/" className="nav-logo">
        EVENT<span>PULSE</span>
      </Link>

      {/* Desktop links */}
      <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Link to="/"       className={`nav-link${is("/") ? " active" : ""}`}>Home</Link>
        <Link to="/events" className={`nav-link${is("/events") ? " active" : ""}`}>Events</Link>

        {user && (
          <Link to="/dashboard" className={`nav-link${is("/dashboard") ? " active" : ""}`}>
            Dashboard
          </Link>
        )}

        {/* Cart */}
        {cart.length > 0 && (
          <Link to="/checkout" className="nav-link" style={{ position: "relative" }}>
            Cart
            <span className="nav-cart-badge">{cart.length}</span>
          </Link>
        )}

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: 8 }}>
            <div className="nav-avatar" title={user.name}>{user.name.slice(0, 2).toUpperCase()}</div>
            <button
              className="btn-ghost"
              style={{ padding: "7px 16px", fontSize: 12 }}
              onClick={() => { logout(); navigate("/"); }}
            >
              Logout
            </button>
          </div>
        ) : (
          <Link to="/auth" className="btn-gold" style={{ padding: "9px 22px", fontSize: 12, marginLeft: 8 }}>
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
