import "./livro.css";
import { useState } from "react";
import Header from "../../components/header/Header"
import Footer from "../../components/footer/Footer"
import { BookIcon, UserIcon, SearchIcon} from "../../components/Icons";
import ReservaModal from "../../components/reserva/ReservaModal";

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

function SearchBar() {
  return (
    <div className="search-wrap">
      <span className="search-wrap__icon">
        <SearchIcon />
      </span>
      <input
        className="search-input"
        type="text"
        placeholder="Pesquise por livros, gêneros..."
      />
    </div>
  );
}

function BookHero({ title, author, status = "Disponível", onReserve, reserveDisabled }) {
  return (
    <div className="book-hero">
      <div className="book-hero__cover">
        <BookIcon size={48} color="#7a5c48" strokeWidth={1.2} />
      </div>
      <div className="book-hero__info">
        <h1 className="book-hero__title">{title} - {author}</h1>
        <div className="book-hero__status">
          <span className="status-dot" />
          Status: {status}
        </div>
        <button className="btn-schedule" type="button" onClick={onReserve} disabled={reserveDisabled}>
          Reservar/Retirar
        </button>
      </div>
    </div>
  );
}

function Sinopse({ text }) {
  return (
    <div className="sinopse">
      <h2 className="sinopse__heading">Sinopse</h2>
      <p className="sinopse__text">{text}</p>
    </div>
  );
}

// ── Data ───────────────────────────────────────────────
const BOOK = {
  id: 1,
  title: "Titulo Livro",
  author: "Escritor",
  status: "Disponível",
  sinopse: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus tincidunt sollicitudin lobortis. Duis in risus accumsan, aliquam lacus vitae, pellentesque ipsum. Praesent sodales ipsum non tortor vulputate euismod eu non quam. Ut maximus mollis ipsum, at tempor ligula tempor in. In ultricies posuere arcu id tristique. Nulla sit amet lorem tellus. Fusce non accumsan elit. Donec semper nec mauris at pharetra. Sed sit amet neque tellus. Duis sit amet accumsan ligula. Nam nibh nunc, vulputate sit amet consectetur eget, feugiat eget lectus.`,
};

// ── Page ───────────────────────────────────────────────
export default function BiblioFacilDetail() {
  const [reservaOpen, setReservaOpen] = useState(false);

  const s = String(BOOK?.status || "").toLowerCase();
  // Ajuste fino depois quando o backend definir status oficialmente.
  const reserveDisabled = s.includes("reservado") || s.includes("indispon") || s.includes("emprest");

  return (
    <div className="app">
      <Header />
      <SearchBar />

      <main className="main">
        <BookHero
          title={BOOK.title}
          author={BOOK.author}
          status={BOOK.status}
          onReserve={() => setReservaOpen(true)}
          reserveDisabled={reserveDisabled}
        />
        <Sinopse text={BOOK.sinopse} />
      </main>

      <Footer />

      <ReservaModal
        open={reservaOpen}
        onClose={() => setReservaOpen(false)}
        book={BOOK}
      />
    </div>
  );
}