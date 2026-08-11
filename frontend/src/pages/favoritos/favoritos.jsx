import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import { StarDisplay } from "../../components/avaliacao/StarRating";
import { getFavoritos, removerFavorito } from "../../services/favoritos";
import API_BASE from "../../lib/apiBase";
import "./favoritos.css";

function coverUrl(capa_url) {
  return capa_url
    ? `${API_BASE}/${capa_url.replace("/public", "")}`
    : `${API_BASE}/covers/default.svg`;
}

export default function MeusFavoritos() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getFavoritos();
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRemove = async (livroId) => {
    setBusyId(livroId);
    try {
      await removerFavorito(livroId);
      setItems((prev) => prev.filter((i) => i.id !== livroId));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fav-app">
      <Header />
      <main className="fav-main">
        <h1 className="fav-title">Meus Favoritos</h1>
        <p className="fav-subtitle">Livros salvos para leitura futura.</p>

        {error && <div className="fav-alert">{error}</div>}

        {loading ? (
          <div className="fav-empty">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="fav-empty">
            <p>Você ainda não favoritou nenhum livro.</p>
            <button type="button" className="fav-link-btn" onClick={() => navigate("/")}>
              Explorar acervo
            </button>
          </div>
        ) : (
          <div className="fav-grid">
            {items.map((book) => (
              <article key={book.favorito_id} className="fav-card">
                <img
                  className="fav-card__cover"
                  src={coverUrl(book.capa_url)}
                  alt=""
                  onClick={() => navigate(`/livro/${book.id}`)}
                />
                <div className="fav-card__body">
                  <h3 className="fav-card__title" onClick={() => navigate(`/livro/${book.id}`)}>
                    {book.titulo}
                  </h3>
                  <p className="fav-card__author">{book.autor}</p>
                  {Number(book.media_avaliacao) > 0 && (
                    <div className="fav-card__rating">
                      <StarDisplay rating={book.media_avaliacao} size={14} />
                    </div>
                  )}
                  <span className={`fav-card__status${book.exemplares_disponiveis > 0 ? "" : " fav-card__status--off"}`}>
                    {book.exemplares_disponiveis > 0 ? "Disponível" : "Indisponível"}
                  </span>
                  <div className="fav-card__actions">
                    <button type="button" className="fav-btn fav-btn--primary" onClick={() => navigate(`/livro/${book.id}`)}>
                      Ver livro
                    </button>
                    <button
                      type="button"
                      className="fav-btn"
                      onClick={() => handleRemove(book.id)}
                      disabled={busyId === book.id}
                    >
                      {busyId === book.id ? "..." : "Remover"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
