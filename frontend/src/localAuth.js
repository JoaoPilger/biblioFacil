import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function registerLocal(payload) {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/cadastro`, payload);
    return { user: response.data.user };
  } catch (error) {
    return {
      error:
        error?.response?.data?.error ||
        "Nao foi possivel cadastrar. Tente novamente.",
    };
  }
}

export async function loginLocal(payload) {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/login`, payload);
    return {
      user: response.data.user,
      token: response.data.token,
    };
  } catch (error) {
    return {
      error:
        error?.response?.data?.error ||
        "Nao foi possivel realizar login. Tente novamente.",
    };
  }
}
