import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar          from "./components/Navbar";
import Cursor          from "./components/Cursor";
import HomePage        from "./pages/HomePage";
import EventsPage      from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import AuthPage        from "./pages/AuthPage";
import CheckoutPage    from "./pages/CheckoutPage";
import DashboardPage   from "./pages/DashboardPage";
import CreateEventPage from "./pages/CreateEventPage";

// Protect routes that require login
const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/auth" replace />;
};

// Organizer-only route guard
const OrganizerRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return children; // CreateEventPage handles the role check with a friendly message
};

export default function App() {
  return (
    <>
      <Cursor />
      <Navbar />
      <Routes>
        <Route path="/"              element={<HomePage />} />
        <Route path="/events"        element={<EventsPage />} />
        <Route path="/events/:id"    element={<EventDetailPage />} />
        <Route path="/auth"          element={<AuthPage />} />
        <Route path="/create-event"  element={<OrganizerRoute><CreateEventPage /></OrganizerRoute>} />
        <Route path="/checkout"      element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
        <Route path="/dashboard"     element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
