import api from "./api";

export async function getFavoritos() {
  try {
    const response = await api.get("/livros/favoritos");
    return response.data?.items || [];
  } catch (error) {
    const msg =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Falha ao carregar favoritos.";
    throw new Error(msg);
  }
}

export async function verificarFavorito(bookId) {
  try {
    const response = await api.get(`/livros/${bookId}/favorito`);
    return response.data?.favoritado === true;
  } catch {
    return false;
  }
}

export async function adicionarFavorito(bookId) {
  try {
    const response = await api.post(`/livros/${bookId}/favoritar`);
    return response.data;
  } catch (error) {
    const msg =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Falha ao favoritar livro.";
    throw new Error(msg);
  }
}

export async function removerFavorito(bookId) {
  try {
    const response = await api.delete(`/livros/${bookId}/favoritar`);
    return response.data;
  } catch (error) {
    const msg =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      "Falha ao remover favorito.";
    throw new Error(msg);
  }
}
