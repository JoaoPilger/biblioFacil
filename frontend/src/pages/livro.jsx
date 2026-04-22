import "./livro.css";

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

function BookHero({ title, author, status = "Disponível" }) {
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
        <button className="btn-schedule">
          Agende aqui Retirada/Devolução
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
const BOOK = {
  title: "Titulo Livro",
  author: "Escritor",
  status: "Disponível",
  sinopse: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus tincidunt sollicitudin lobortis. Duis in risus accumsan, aliquam lacus vitae, pellentesque ipsum. Praesent sodales ipsum non tortor vulputate euismod eu non quam. Ut maximus mollis ipsum, at tempor ligula tempor in. In ultricies posuere arcu id tristique. Nulla sit amet lorem tellus. Fusce non accumsan elit. Donec semper nec mauris at pharetra. Sed sit amet neque tellus. Duis sit amet accumsan ligula. Nam nibh nunc, vulputate sit amet consectetur eget, feugiat eget lectus.`,
};

// ── Page ───────────────────────────────────────────────
export default function BiblioFacilDetail() {
  return (
    <div className="app">
      <Navbar />
      <SearchBar />

      <main className="main">
        <BookHero
          title={BOOK.title}
          author={BOOK.author}
          status={BOOK.status}
        />
        <Sinopse text={BOOK.sinopse} />
      </main>

      <Footer />
    </div>
  );
}