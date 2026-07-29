import api from "./api";

export async function getMinhaReserva(bookId) {
  try {
    const response = await api.get(`/livros/${bookId}/minha-reserva`);
    return response.data?.reserva || null;
  } catch {
    return null;
  }
}

export async function cancelarReserva(bookId) {
  try {
    const response = await api.post(`/livros/${bookId}/reserva/cancelar`);
    return response.data;
  } catch (error) {
    const msg =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Falha ao cancelar a reserva.";
    const e = new Error(msg);
    e.cause = error;
    throw e;
  }
}

export async function getMeuEmprestimo(bookId) {
  try {
    const response = await api.get(`/livros/${bookId}/meu-emprestimo`);
    return response.data?.emprestimo || null;
  } catch {
    return null;
  }
}

export async function getMinhasReservas() {
  try {
    const response = await api.get(`/livros/minhas-reservas`);
    return response.data || { reservas: [], emprestimos: [] };
  } catch (error) {
    const msg =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Falha ao carregar suas reservas.";
    const e = new Error(msg);
    e.cause = error;
    throw e;
  }
}

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

