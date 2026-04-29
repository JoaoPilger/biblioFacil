import { useState } from "react";
import "./resultado_busca.css";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import { BookIcon, UserIcon} from "../../components/Icons";
import SearchBar from "../../components/searchBar/SearchBar";


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
      <Header />

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