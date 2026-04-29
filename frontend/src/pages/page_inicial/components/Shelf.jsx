import { Link } from "react-router-dom";

const API_BASE = "http://localhost:3000";

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

  const coverSrc = API_BASE + (book.capa || "/covers/default.svg");

  return (
    <Link to={`/editar-livro/${book.id}`} className="tile tile--data tile--link">
      <div className="tile__cover tile__cover--data">
        <img className="tile__img" src={coverSrc} alt={`Capa de ${book.titulo}`} loading="lazy" />
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

export default function Shelf({ title, items = 6, books, loading = false }) {
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
