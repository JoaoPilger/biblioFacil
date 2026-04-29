import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./page_inicial.css";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import { BookIcon, UserIcon} from "../../components/Icons";
import SearchBar from "../../components/searchBar/SearchBar";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";


function Hero() {
  return (
    <section className="hero" aria-label="Destaque">
      <div className="hero__accent" />
    </section>
  );
}

function BookTile() {
  return (
    <div className="tile">
      <div className="tile__cover" aria-hidden="true" />
      <div className="tile__meta">
        <div className="tile__line" />
        <div className="tile__line tile__line--sm" />
      </div>
    </div>
  );
}

function BookTileData({ book }) {
  if (!book) return <BookTile />;

  var coverSrc = API_BASE + (book.capa || "/covers/default.svg");

  return (
    <div className="tile tile--data">
      <div className="tile__cover tile__cover--data">
        <img className="tile__img" src={coverSrc} alt={`Capa de ${book.titulo}`} />
      </div>
      <div className="tile__meta tile__meta--data">
        <div className="tile__title" title={book.titulo}>
          {book.titulo}
        </div>
        <div className="tile__author" title={book.autor}>
          {book.autor}
        </div>
      </div>
    </div>
  );
}

function Shelf({ title, items = 6, books }) {
  return (
    <section className="shelf">
      <h2 className="shelf__title">{title}</h2>
      <div className="shelf__grid">
        {Array.from({ length: items }).map((_, i) => (
          <BookTileData key={i} book={books && books[i] ? books[i] : null} />
        ))}
      </div>
    </section>
  );
}

export default function PageInicial() {
  const [query, setQuery] = useState("");
  const [recomendados, setRecomendados] = useState([]);
  const [porGenero, setPorGenero] = useState([]);
  const [maisProcurados, setMaisProcurados] = useState([]);

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
      } catch {
        if (cancelled) return;
        setRecomendados([]);
        setPorGenero([]);
        setMaisProcurados([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app">
      <Header/>
      <Hero />

      <main className="main">
        <SearchBar value={query} onChange={setQuery} />
        <Shelf title="Recomendados" books={recomendados} />
        <Shelf title="Gênero (Aventura)" items={5} books={porGenero} />
        <Shelf title="Mais procurados" items={5} books={maisProcurados} />
      </main>

      <Footer />
    </div>
  );
}
