import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount — rehydrate session from localStorage token
  useEffect(() => {
    const token = localStorage.getItem("ep_token");
    if (!token) { setLoading(false); return; }
    authAPI.me()
      .then(d => setUser(d.user))
      .catch(() => localStorage.removeItem("ep_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await authAPI.login({ email, password });
    localStorage.setItem("ep_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, role) => {
    const data = await authAPI.register({ name, email, password, role });
    localStorage.setItem("ep_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("ep_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
