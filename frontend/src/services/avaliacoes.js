import api from "./api";

export async function getAvaliacoes(bookId) {
  try {
    const response = await api.get(`/livros/${bookId}/avaliacoes`);
    return response.data || { avaliacoes: [], media: 0, total: 0 };
  } catch (error) {
    const msg =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Falha ao carregar avaliações.";
    throw new Error(msg);
  }
}

export async function getMinhaAvaliacao(bookId) {
  try {
    const response = await api.get(`/livros/${bookId}/avaliacoes/minha`);
    return response.data || { avaliacao: null, pode_avaliar: false };
  } catch {
    return { avaliacao: null, pode_avaliar: false };
  }
}

export async function salvarAvaliacao(bookId, { nota, comentario }) {
  try {
    const response = await api.post(`/livros/${bookId}/avaliacoes`, { nota, comentario });
    return response.data;
  } catch (error) {
    const msg =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Falha ao salvar avaliação.";
    throw new Error(msg);
  }
}

export async function excluirAvaliacao(bookId) {
  try {
    const response = await api.delete(`/livros/${bookId}/avaliacoes/minha`);
    return response.data;
  } catch (error) {
    const msg =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Falha ao excluir avaliação.";
    throw new Error(msg);
  }
}

export async function getHistoricoLeituras() {
  try {
    const response = await api.get("/livros/historico-leituras");
    return response.data?.items || [];
  } catch (error) {
    const msg =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Falha ao carregar histórico.";
    throw new Error(msg);
  }
}
