import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import SearchBar from "./components/SearchBar";
import Shelf from "./components/Shelf";
import "./page_inicial.css";

const USER_KEY = "biblioFacil_user";
const API_BASE = "http://localhost:3000";

export default function PageInicial() {
  const navigate = useNavigate();
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(USER_KEY) : null;
  const user = raw ? JSON.parse(raw) : null;
  const [query, setQuery] = useState("");
  const [recomendados, setRecomendados] = useState([]);
  const [porGenero, setPorGenero] = useState([]);
  const [maisProcurados, setMaisProcurados] = useState([]);
  const [loading, setLoading] = useState(true);
  const categories = useMemo(() => ["Aventura", "Fantasia", "Romance", "Ficção", "Infantojuvenil"], []);

  const allBooks = useMemo(() => {
    const merged = [...recomendados, ...porGenero, ...maisProcurados];
    const uniqueBooks = new Map();
    merged.forEach((book) => {
      if (book && book.id) uniqueBooks.set(book.id, book);
    });
    return Array.from(uniqueBooks.values());
  }, [recomendados, porGenero, maisProcurados]);

  const handleSearch = () => {
    if (query.trim()) {
      navigate(`/resultado_busca?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleGenreSelect = (genre) => {
    setQuery(genre);
    navigate(`/resultado_busca?q=${encodeURIComponent(genre)}`);
  };

  const totalBooks = allBooks.length;

  useEffect(() => {
    var cancelled = false;

    async function load() {
      try {
        var resRec = await fetch(API_BASE + "/api/books?limit=6");
        var jsonRec = await resRec.json();

        var resGen = await fetch(
          API_BASE + "/api/books?genero=" + encodeURIComponent("Aventura") + "&limit=5"
        );
        var jsonGen = await resGen.json();

        var resMais = await fetch(API_BASE + "/api/books?limit=5");
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
      <Navbar
        user={user}
        onLogout={() => {
          localStorage.removeItem("biblioFacil_user");
          localStorage.removeItem("biblioFacil_token");
          window.location.href = "/";
        }}
      />
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
