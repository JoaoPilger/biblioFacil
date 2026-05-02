import {SearchIcon} from "../../components/Icons";
import { useEffect, useRef, useState } from "react";
import { getLivros } from "../../services/livros";

export default function SearchBar({
  value,
  onChange = ()=>{},
  onSearch,
  fetchBooks = false,
  autoFetch = false,
  onResults,
  onLoadingChange,
  onError,
}) {
  const [loading, setLoading] = useState(false);
  const lastAutoFetchValue = useRef("");

  const setLoadingSafe = (v) => {
    setLoading(v);
    if (onLoadingChange) onLoadingChange(v);
  };

  const doFetch = async (rawTerm) => {
    const term = (rawTerm ?? "").trim();
    setLoadingSafe(true);
    if (onError) onError("");
    try {
      const items = await getLivros({ search: term });
      if (onResults) onResults(items, term);
    } catch (e) {
      if (onResults) onResults([], term);
      if (onError) onError("Erro ao buscar livros.");
    } finally {
      setLoadingSafe(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (onSearch) onSearch(value);
      if (fetchBooks) doFetch(value);
    }
  };

  const handleClick = () => {
    if (onSearch) onSearch(value);
    if (fetchBooks) doFetch(value);
  };

  useEffect(() => {
    if (!fetchBooks || !autoFetch) return;
    const term = (value ?? "").trim();
    if (!term) return;
    if (term === lastAutoFetchValue.current) return;
    lastAutoFetchValue.current = term;
    doFetch(term);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, fetchBooks, autoFetch]);

  return (
    <div className="search-wrap">
      <span className="search-wrap__icon">
        <SearchIcon />
      </span>
      <input
        className="search-input"
        type="text"
        placeholder="Pesquise por livros, gêneros..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <button
        className="search-button"
        onClick={handleClick}
        aria-label="Buscar"
        disabled={loading}
      >
        {loading ? "Buscando..." : "Buscar"}
      </button>
    </div>
  );
}