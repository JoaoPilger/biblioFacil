import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

// Interceptor: Adiciona o token em todas as chamadas automaticamente
api.interceptors.request.use((config) => {
  // Autenticação agora é via cookie HttpOnly (sessão no banco).
  return config;
});

export default api;