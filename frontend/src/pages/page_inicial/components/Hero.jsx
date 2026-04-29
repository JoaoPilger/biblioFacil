import { Link } from "react-router-dom";

export default function Hero({ user, totalBooks, loading }) {
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
