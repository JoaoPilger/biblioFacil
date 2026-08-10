const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function getLivros({ search, genero, limit } = {}) {
  const params = new URLSearchParams();
  if (genero) params.set("genero", genero);
  if (limit) params.set("limit", String(limit));
  if (search) params.set("search", search);

  const qs = params.toString();
  const url = qs ? `${API_BASE}/livros?${qs}` : `${API_BASE}/livros`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha ao buscar livros (${res.status})`);
  }
  const json = await res.json();
  return Array.isArray(json.items) ? json.items : [];
}

