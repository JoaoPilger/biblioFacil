import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../../components/footer/Footer";
import Header from "../../components/header/Header";
import SearchBar from "../../components/searchBar/SearchBar";
import "./page_inicial.css";
import useUniqueBooks from "../../hooks/useUniqueBooks";
import useBookSearchNavigation from "../../hooks/useBookSearchNavigation";
import { useAuth } from "../../context/authContext";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function Hero({ user, totalBooks, loading }) {
  return (
    <section className="hero" aria-label="Destaque">
      <div className="hero__content">
        <span className="hero__eyebrow">Biblioteca digital</span>
        <h1 className="hero__title">Seu acervo literário mais organizado e inspirador.</h1>
        <p className="hero__subtitle">
          Encontre livros, explore gêneros e acompanhe os títulos favoritos com uma experiência leve e moderna.
        </p>
        <div className="hero__actions">
          <Link to="/" className="hero__btn hero__btn--primary">
            Explorar livros
          </Link>
          <Link to={user ? "/adicionar-livro" : "/login"} className="hero__btn hero__btn--secondary">
            {user ? "Adicionar livro" : "Faça login"}
          </Link>
        </div>
        <div className="hero__stats">
          <div className="hero__stat-card">
            <strong>{loading ? "..." : totalBooks || 0}</strong>
            <span>livros presentes</span>
          </div>
          <div className="hero__stat-card">
            <strong>35</strong>
            <span>gêneros disponíveis</span>
          </div>
          <div className="hero__stat-card">
            <strong>9/10</strong>
            <span>avaliação média</span>
          </div>
        </div>
      </div>
      <div className="hero__accent" />
    </section>
  );
}

function BookTile({ loading = false }) {
  return (
    <div className={`tile ${loading ? "tile--loading" : ""}`}>
      <div className="tile__cover" aria-hidden="true" />
      <div className="tile__meta">
        <div className="tile__line" />
        <div className="tile__line tile__line--sm" />
      </div>
    </div>
  );
}

function BookTileData({ book, loading = false }) {
  if (!book) return <BookTile loading={loading} />;

  const coverSrc = book.capa_url
    ? `${API_BASE}${book.capa_url.replace("/public", "")}`
    : `${API_BASE}/covers/default.svg`;

  return (
    <Link to={`/livro/${book.id}`} className="tile tile--data tile--link">
      <div className="tile__cover tile__cover--data">
        <img
          className="tile__img"
          src={coverSrc}
          alt={`Capa de ${book.titulo}`}
          loading="lazy"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      </div>
      <div className="tile__meta tile__meta--data">
        <div className="tile__title" title={book.titulo}>
          {book.titulo}
        </div>
        <div className="tile__author" title={book.autor}>
          {book.autor}
        </div>
      </div>
    </Link>
  );
}

function Shelf({ title, items = 6, books, loading = false }) {
  return (
    <section className="shelf">
      <h2 className="shelf__title">{title}</h2>
      <div className="shelf__grid">
        {Array.from({ length: items }).map((_, i) => (
          <BookTileData key={i} book={books && books[i] ? books[i] : null} loading={loading} />
        ))}
      </div>
    </section>
  );
}

export default function PageInicial() {
  const { search, selectGenre } = useBookSearchNavigation();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [recomendados, setRecomendados] = useState([]);
  const [porGenero, setPorGenero] = useState([]);
  const [maisProcurados, setMaisProcurados] = useState([]);
  const [loading, setLoading] = useState(true);
  const categories = useMemo(() => ["Aventura", "Fantasia", "Romance", "Ficção", "Infantojuvenil"], []);

  const allBooks = useUniqueBooks(recomendados, porGenero, maisProcurados);
  const handleSearch = () => search(query);
  const handleGenreSelect = (genre) => selectGenre(genre, setQuery);

  const totalBooks = allBooks.length;

  useEffect(() => {
    var cancelled = false;

    async function load() {
      try {
        var resRec = await fetch(API_BASE + "/livros?limit=6");
        var jsonRec = await resRec.json();

        var resGen = await fetch(
          API_BASE + "/livros?genero=" + encodeURIComponent("Aventura") + "&limit=5"
        );
        var jsonGen = await resGen.json();

        var resMais = await fetch(API_BASE + "/livros?limit=5");
        var jsonMais = await resMais.json();

        if (cancelled) return;
        setRecomendados(Array.isArray(jsonRec.items) ? jsonRec.items : []);
        setPorGenero(Array.isArray(jsonGen.items) ? jsonGen.items : []);
        setMaisProcurados(Array.isArray(jsonMais.items) ? jsonMais.items : []);
        setLoading(false);
      } catch {
        if (cancelled) return;
        setRecomendados([]);
        setPorGenero([]);
        setMaisProcurados([]);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app">
      <Header />
      <Hero user={user} totalBooks={totalBooks} loading={loading} />

      <main className="main">
        <SearchBar value={query} onChange={setQuery} onSearch={handleSearch} />
        <section className="category-panel">
          <div className="category-panel__header">
            <h2>Descubra por gêneros</h2>
            <p>Pesquise rapidamente pelo tema que você mais gosta.</p>
          </div>
          <div className="category-panel__chips">
            {categories.map((genre) => (
              <button key={genre} className="genre-chip" onClick={() => handleGenreSelect(genre)}>
                {genre}
              </button>
            ))}
          </div>
        </section>
        <Shelf title="Recomendados" books={recomendados} loading={loading} />
        <Shelf title="Gênero (Aventura)" items={5} books={porGenero} loading={loading} />
        <Shelf title="Mais procurados" items={5} books={maisProcurados} loading={loading} />
      </main>

      <Footer />
    </div>
  );
}
