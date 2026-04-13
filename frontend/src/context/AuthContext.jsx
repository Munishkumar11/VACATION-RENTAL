import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { getStoredUser } from "../utils/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(true);

  const refreshAuth = async () => {
    try {
      const res = await axios.get("/user/me", { withCredentials: true });
      const nextUser = res.data?.data || null;

      setUser(nextUser);

      if (nextUser) {
        localStorage.setItem("user", JSON.stringify(nextUser));
      } else {
        localStorage.removeItem("user");
      }
    } catch {
      setUser(null);
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        refreshAuth,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
