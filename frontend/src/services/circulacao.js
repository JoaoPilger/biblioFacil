import api from "./api";

function extractError(error, fallback) {
  const msg = error?.response?.data?.error || error?.response?.data?.message || fallback;
  const e = new Error(msg);
  e.cause = error;
  return e;
}

export async function getRetiradasPendentes() {
  try {
    const response = await api.get("/circulacao/retiradas");
    return response.data?.items || [];
  } catch (error) {
    throw extractError(error, "Falha ao carregar retiradas pendentes.");
  }
}

export async function confirmarRetirada(id) {
  try {
    const response = await api.post(`/circulacao/retiradas/${id}/confirmar`);
    return response.data;
  } catch (error) {
    throw extractError(error, "Falha ao confirmar retirada.");
  }
}

export async function getDevolucoesPendentes() {
  try {
    const response = await api.get("/circulacao/devolucoes");
    return response.data?.items || [];
  } catch (error) {
    throw extractError(error, "Falha ao carregar devoluções pendentes.");
  }
}

export async function confirmarDevolucao(id) {
  try {
    const response = await api.post(`/circulacao/devolucoes/${id}/confirmar`);
    return response.data;
  } catch (error) {
    throw extractError(error, "Falha ao confirmar devolução.");
  }
}
