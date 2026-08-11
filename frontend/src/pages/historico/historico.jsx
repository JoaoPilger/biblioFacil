import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import { StarDisplay } from "../../components/avaliacao/StarRating";
import { getHistoricoLeituras } from "../../services/avaliacoes";
import API_BASE from "../../lib/apiBase";
import "./historico.css";

function coverUrl(capa_url) {
  return capa_url
    ? `${API_BASE}/${capa_url.replace("/public", "")}`
    : `${API_BASE}/covers/default.svg`;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

const STATUS_LABEL = {
  ativo: "Em andamento",
  devolvido: "Devolvido",
};

export default function HistoricoLeituras() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getHistoricoLeituras();
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

  return (
    <div className="hist-app">
      <Header />
      <main className="hist-main">
        <h1 className="hist-title">Histórico de Leituras</h1>
        <p className="hist-subtitle">Todos os livros que você já emprestou na biblioteca.</p>

        {error && <div className="hist-alert">{error}</div>}

        {loading ? (
          <div className="hist-empty">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="hist-empty">Você ainda não possui histórico de empréstimos.</div>
        ) : (
          <div className="hist-list">
            {items.map((item) => (
              <article key={item.id} className="hist-card" onClick={() => navigate(`/livro/${item.livro_id}`)}>
                <img className="hist-card__cover" src={coverUrl(item.capa_url)} alt="" />
                <div className="hist-card__info">
                  <h3 className="hist-card__title">{item.titulo}</h3>
                  <p className="hist-card__author">{item.autor}</p>
                  <div className="hist-card__dates">
                    <span><strong>Empréstimo:</strong> {formatDate(item.data_emprestimo)}</span>
                    <span><strong>Devolução prevista:</strong> {formatDate(item.data_devolucao_prevista)}</span>
                    {item.data_devolucao_real && (
                      <span><strong>Devolvido em:</strong> {formatDate(item.data_devolucao_real)}</span>
                    )}
                  </div>
                  <span className={`hist-card__badge hist-card__badge--${item.status}`}>
                    {STATUS_LABEL[item.status] || item.status}
                  </span>
                  {item.avaliacao_nota && (
                    <div className="hist-card__avaliacao">
                      Sua nota: <StarDisplay rating={item.avaliacao_nota} size={14} />
                    </div>
                  )}
                </div>
                <div className="hist-card__actions" onClick={(e) => e.stopPropagation()}>
                  {(item.pode_avaliar === true || item.pode_avaliar === "true") && (
                    <button
                      type="button"
                      className="hist-btn hist-btn--primary"
                      onClick={() => navigate(`/livro/${item.livro_id}#avaliar`)}
                    >
                      Avaliar
                    </button>
                  )}
                  {item.avaliacao_id && (
                    <button
                      type="button"
                      className="hist-btn"
                      onClick={() => navigate(`/livro/${item.livro_id}#avaliar`)}
                    >
                      Editar avaliação
                    </button>
                  )}
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
