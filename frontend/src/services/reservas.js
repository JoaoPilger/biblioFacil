import api from "./api";

export async function createReserva(payload) {
  // Backend esperado (a preparar):
  // POST /reservas
  // body: { bookId, userId, nome, email, retirada, limite, observacoes }
  try {
    const response = await api.post("/reservas", payload);
    return response.data;
  } catch (error) {
    const msg =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Falha ao comunicar com o backend de reservas.";
    const e = new Error(msg);
    e.cause = error;
    throw e;
  }
}

