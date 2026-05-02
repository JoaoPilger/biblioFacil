import api from "./api";

export async function createReserva(payload) {
  const { bookId, ...body } = payload || {};
  if (bookId == null || String(bookId).trim() === "") {
    const e = new Error("Livro não informado.");
    throw e;
  }
  try {
    const response = await api.post(`/livros/${bookId}/reservar`, body);
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

