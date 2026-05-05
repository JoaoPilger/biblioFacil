import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function useBookSearchNavigation() {
  const navigate = useNavigate();

  const search = useCallback(
    (rawTerm) => {
      const term = (rawTerm ?? "").trim();
      if (!term) return;
      navigate(`/resultado_busca?q=${encodeURIComponent(term)}`);
    },
    [navigate]
  );

  const selectGenre = useCallback(
    (genre, setQuery) => {
      const term = (genre ?? "").trim();
      if (setQuery) setQuery(term);
      if (!term) return;
      navigate(`/resultado_busca?genero=${encodeURIComponent(term)}`);
    },
    [navigate]
  );

  return { search, selectGenre };
}

