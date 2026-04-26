import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./page_inicial.css";

const USER_KEY = "biblioFacil_user";
const API_BASE = "http://localhost:3000";

// ── Icons ──────────────────────────────────────────────
const BookIcon = ({ size = 24, color = "currentColor", strokeWidth = 2 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const UserIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SearchIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

// ── UI ────────────────────────────────────────────────
function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar__logo">
        <div className="navbar__logo-icon">
          <BookIcon size={22} color="#f5f0e8" />
        </div>
        <span className="navbar__title">BiblioFácil</span>
      </div>

      <div className="navbar__right">
        <a href="#" className="nav-link">
          Quem somos
        </a>
        {user ? (
          <>
            <div className="nav-avatar" aria-label="Usuário logado">
              <UserIcon />
            </div>
            <button type="button" className="nav-cta" onClick={onLogout}>
              Sair
            </button>
          </>
        ) : (
          <Link to="/login" className="nav-cta">
            <UserIcon />
            <span style={{ marginLeft: 8 }}>Entrar</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="hero" aria-label="Destaque">
      <div className="hero__accent" />
    </section>
  );
}

function SearchBar({ value, onChange }) {
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
      />
    </div>
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

function Footer() {
  const columns = useMemo(
    () => [
      { heading: "Athom System", links: ["Produtos", "Quem Somos", "Log In"] },
      { heading: "Social", links: ["LinkedIn", "Instagram", "Contato"] },
    ],
    []
  );

  return (
    <footer className="footer">
      <div>
        <div className="footer__brand">
          <div className="footer__logo-icon">
            <BookIcon size={22} color="#f5f0e8" />
          </div>
          <div className="footer__brand-name">
            ATHOM
            <br />
            <span className="footer__brand-sub">SYSTEM</span>
          </div>
        </div>
        <p className="footer__copy">© 2024 Athom System. Todos os direitos reservados</p>
      </div>

      <div className="footer__links">
        {columns.map((col) => (
          <div key={col.heading} className="footer__col">
            <h4>{col.heading}</h4>
            {col.links.map((link) => (
              <a key={link} href="#" className="footer-link">
                {link}
              </a>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}

export default function PageInicial() {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(USER_KEY) : null;
  const user = raw ? JSON.parse(raw) : null;
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
      <Navbar
        user={user}
        onLogout={() => {
          localStorage.removeItem("biblioFacil_user");
          localStorage.removeItem("biblioFacil_token");
          window.location.href = "/";
        }}
      />
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
