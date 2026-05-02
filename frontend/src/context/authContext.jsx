import { createContext, useState, useEffect, useContext } from 'react';
import api from "../services/api";

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Esta função corre assim que o site abre
  useEffect(() => {
    async function checkLogin() {
      try {
        const response = await api.get('/users/me');
        setUser(response.data.user || null);
      } catch {
        setUser(null);
      }
      setLoading(false);
    }
    checkLogin();
  }, []);

  const login = (userData) => {
    // Sessão é criada no backend e armazenada em cookie HttpOnly.
    setUser(userData || null);
  };

  const logout = () => {
    api.post("/auth/logout").catch(() => {});
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ user, login, logout, authenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);