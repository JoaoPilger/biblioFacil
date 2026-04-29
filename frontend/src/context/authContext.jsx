import { createContext, useState, useEffect, useContext } from 'react';
import api from "../services/api";

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Esta função corre assim que o site abre
  useEffect(() => {
    async function checkLogin() {
      const storageUser = localStorage.getItem("biblioFacil_user");
      const storageToken = localStorage.getItem("biblioFacil_token");

      if (storageUser && storageToken) {
        // 1. Configura o token no axios para as próximas chamadas
        api.defaults.headers.Authorization = `Bearer ${storageToken}`;
        
        try {
          // 2. Chama a rota /me que criaste no backend para validar o token
          const response = await api.get('/me');
          setUser(response.data.user);
        } catch (error) {
          // Se o token for inválido/expirado, o backend responde 403 e limpamos tudo
          logout();
        }
      }
      setLoading(false);
    }
    checkLogin();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("biblioFacil_user", JSON.stringify(userData));
    localStorage.setItem("biblioFacil_token", token);
    api.defaults.headers.Authorization = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("biblioFacil_user");
    localStorage.removeItem("biblioFacil_token");
    api.defaults.headers.Authorization = null;
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ user, login, logout, authenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);