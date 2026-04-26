import { useState } from "react";
import "./resultado_busca.css";

// ── Icons ──────────────────────────────────────────────
const BookIcon = ({ size = 24, color = "currentColor", strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const UserIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SearchIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const FilterIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

// ── Components ─────────────────────────────────────────
function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar__logo">
        <div className="navbar__logo-icon">
          <BookIcon size={22} color="#f5f0e8" />
        </div>
        <span className="navbar__title">BiblioFácil</span>
      </div>

      <div className="navbar__right">
        <a href="#" className="nav-link">Quem somos</a>
        <div className="nav-avatar">
          <UserIcon />
        </div>
      </div>
    </nav>
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
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

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
  return (
    <div className="book-cover">
      <BookIcon size={32} color="#7a5c48" strokeWidth={1.5} />
    </div>
  );
}

function BookCard({ title, author, status = "Disponível", index }) {
  return (
    <div className={`book-card book-card--anim-${Math.min(index, 2)}`}>
      <BookCover />
      <div className="book-info">
        <div className="book-info__title">
          {title} — {author}
        </div>
        <div className="book-info__status">
          <span className="status-dot" />
          Status: {status}
        </div>
        <button className="btn-saiba">Saiba Mais</button>
      </div>
    </div>
  );
}

function Footer() {
  const columns = [
    { heading: "Athom System", links: ["Produtos", "Quem Somos", "Log In"] },
    { heading: "Social",       links: ["LinkedIn", "Instagram", "Contato"] },
  ];

  return (
    <footer className="footer">
      <div>
        <div className="footer__brand">
          <div className="footer__logo-icon">
            <BookIcon size={22} color="#f5f0e8" />
          </div>
          <div className="footer__brand-name">
            ATHOM<br />
            <span className="footer__brand-sub">SYSTEM</span>
          </div>
        </div>
        <p className="footer__copy">© 2024 Athom System. Todos os direitos reservados</p>
      </div>

      <div className="footer__links">
        {columns.map(col => (
          <div key={col.heading} className="footer__col">
            <h4>{col.heading}</h4>
            {col.links.map(link => (
              <a key={link} href="#" className="footer-link">{link}</a>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}

// ── Data ───────────────────────────────────────────────
const BOOKS = [
  { id: 1, title: "Titulo Livro", author: "Escritor", status: "Disponível" },
  { id: 2, title: "Titulo Livro", author: "Escritor", status: "Disponível" },
  { id: 3, title: "Titulo Livro", author: "Escritor", status: "Disponível" },
];

// ── App ────────────────────────────────────────────────
export default function BiblioFacil() {
  const [query, setQuery] = useState("");

  const filtered = BOOKS.filter(b =>
    `${b.title} ${b.author}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="app">
      <Navbar />

      <main className="main">
        <SearchBar value={query} onChange={setQuery} />
        <Toolbar count={filtered.length} />

        <div className="results-list">
          {filtered.length > 0
            ? filtered.map((book, i) => (
                <BookCard key={book.id} {...book} index={i} />
              ))
            : (
              <p className="results-list__empty">Nenhum livro encontrado.</p>
            )
          }
        </div>
      </main>

      <Footer />
    </div>
  );
}