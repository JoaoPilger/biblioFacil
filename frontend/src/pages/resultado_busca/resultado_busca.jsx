import { useEffect, useMemo, useState } from "react";
import "./resultado_busca.css";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import { BookIcon } from "../../components/Icons";
import SearchBar from "../../components/searchBar/SearchBar";
import { useNavigate, useSearchParams } from "react-router-dom";


const FilterIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

function Toolbar({ count }) {
  return (
    <div className="toolbar">
      <span className="toolbar__title">
        Resultado da busca{count !== null ? ` (${count})` : ""}
      </span>
      <button className="filter-btn">
        Filtrar <FilterIcon />
      </button>
    </div>
  );
}

function BookCover() {
  return null;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function BookCard({ id, titulo, autor, status = "disponivel", capa_url, index, onOpen }) {
  const coverSrc = capa_url ? `${API_BASE}${capa_url}` : null;
  const statusLabel = useMemo(() => {
    if (!status) return "Disponível";
    const s = String(status).toLowerCase();
    if (s === "disponivel") return "Disponível";
    if (s === "reservado") return "Reservado";
    if (s === "emprestado") return "Emprestado";
    return status;
  }, [status]);

  return (
    <div className={`book-card book-card--anim-${Math.min(index, 2)}`}>
      <div className="book-cover">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={`Capa de ${titulo}`}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <BookIcon size={32} color="#7a5c48" strokeWidth={1.5} />
        )}
      </div>
      <div className="book-info">
        <div className="book-info__title">
          {titulo} — {autor}
        </div>
        <div className="book-info__status">
          <span className="status-dot" />
          Status: {statusLabel}
        </div>
        <button className="btn-saiba" onClick={() => onOpen(id)}>
          Saiba Mais
        </button>
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────
export default function BiblioFacil() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") ?? searchParams.get("search") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const effectiveQuery = useMemo(() => {
    return (searchParams.get("q") ?? searchParams.get("search") ?? "").trim();
  }, [searchParams]);

  const handleSearch = (rawTerm) => {
    const term = (rawTerm ?? query).trim();
    if (!term) {
      setSearchParams({});
      return;
    }
    setSearchParams({ q: term });
  };

  const openBook = (id) => {
    navigate(`/livro/${id}`);
  };

  useEffect(() => {
    setQuery(effectiveQuery);
  }, [effectiveQuery]);

  return (
    <div className="app">
      <Header />

      <main className="main">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSearch={handleSearch}
          fetchBooks
          autoFetch
          onResults={(items) => setBooks(items)}
          onLoadingChange={setLoading}
          onError={(msg) => setError(msg)}
        />
        <Toolbar count={loading ? null : books.length} />

        <div className="results-list">
          {error ? <p className="results-list__empty">{error}</p> : null}
          {!error && loading ? <p className="results-list__empty">Carregando...</p> : null}
          {!error && !loading && books.length > 0
            ? books.map((book, i) => (
                <BookCard key={book.id} {...book} index={i} onOpen={openBook} />
              ))
            : null}
          {!error && !loading && books.length === 0 ? (
            <p className="results-list__empty">Nenhum livro encontrado.</p>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}