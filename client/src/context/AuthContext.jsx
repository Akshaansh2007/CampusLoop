
import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => localStorage.getItem("campusloop_token") || ""
  );

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("campusloop_user")) || null;
    } catch {
      return null;
    }
  });

  function login(data) {
    localStorage.setItem("campusloop_token", data.token);
    localStorage.setItem("campusloop_user", JSON.stringify(data.user));

    setToken(data.token);
    setCurrentUser(data.user);
  }

  function logout() {
    localStorage.removeItem("campusloop_token");
    localStorage.removeItem("campusloop_user");

    setToken("");
    setCurrentUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ token, currentUser, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
