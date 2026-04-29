import api from "./services/api";

export async function registerLocal(payload) {
  try {
    const response = await api.post("/users/cadastro", payload);
    return { user: response.data.user };
  } catch (error) {
    return { error: error?.response?.data?.error || "Erro no cadastro." };
  }
}

export async function loginLocal(payload) {
  try {
    const response = await api.post("/users/login", payload);
    return {
      user: response.data.user,
      token: response.data.token,
    };
  } catch (error) {
    return { error: error?.response?.data?.error || "Erro no login." };
  }
}

export async function validateToken() {
  try {
    const response = await api.get("/users/me");
    return response.data;
  } catch (error) {
    return { error: "Token inválido" };
  }
}