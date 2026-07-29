import { useEffect, useState, useCallback } from "react";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import {
  getRetiradasPendentes,
  confirmarRetirada,
  getDevolucoesPendentes,
  confirmarDevolucao,
} from "../../services/circulacao";
import "./circulacao.css";

const API_BASE = "http://localhost:3000/";

function coverUrl(capa_url) {
  return capa_url
    ? `${API_BASE}${capa_url.replace("/public", "")}`
    : `${API_BASE}covers/default.svg`;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

function EmptyState({ text }) {
  return <div className="circ-empty">{text}</div>;
}

function RetiradaCard({ item, onConfirm, busy }) {
  return (
    <div className="circ-card">
      <img className="circ-card__cover" src={coverUrl(item.capa_url)} alt="" />
      <div className="circ-card__info">
        <h3 className="circ-card__title">{item.titulo}</h3>
        <p className="circ-card__subtitle">{item.autor}</p>
        <div className="circ-card__meta">
          <span><strong>Leitor:</strong> {item.nome} ({item.email})</span>
          <span><strong>Retirada prevista:</strong> {formatDate(item.data_retirada)}</span>
          <span><strong>Devolver até:</strong> {formatDate(item.data_limite)}</span>
          {item.observacoes ? <span><strong>Obs.:</strong> {item.observacoes}</span> : null}
        </div>
      </div>
      <button
        type="button"
        className="circ-btn circ-btn--confirm"
        onClick={() => onConfirm(item.id)}
        disabled={busy}
      >
        {busy ? "Confirmando..." : "Confirmar retirada"}
      </button>
    </div>
  );
}

function DevolucaoCard({ item, onConfirm, busy }) {
  return (
    <div className="circ-card">
      <img className="circ-card__cover" src={coverUrl(item.capa_url)} alt="" />
      <div className="circ-card__info">
        <h3 className="circ-card__title">{item.titulo}</h3>
        <p className="circ-card__subtitle">{item.autor}</p>
        <div className="circ-card__meta">
          <span><strong>Leitor:</strong> {item.user_nome || "—"} ({item.user_email || "—"})</span>
          <span><strong>Emprestado em:</strong> {formatDate(item.data_emprestimo)}</span>
          <span><strong>Devolução prevista:</strong> {formatDate(item.data_devolucao_prevista)}</span>
        </div>
      </div>
      <button
        type="button"
        className="circ-btn circ-btn--confirm"
        onClick={() => onConfirm(item.id)}
        disabled={busy}
      >
        {busy ? "Confirmando..." : "Confirmar devolução"}
      </button>
    </div>
  );
}

export default function Circulacao() {
  const [tab, setTab] = useState("retiradas");
  const [retiradas, setRetiradas] = useState([]);
  const [devolucoes, setDevolucoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [r, d] = await Promise.all([getRetiradasPendentes(), getDevolucoesPendentes()]);
      setRetiradas(r);
      setDevolucoes(d);
    } catch (err) {
      setError(err?.message || "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleConfirmRetirada = async (id) => {
    setBusyId(id);
    setError("");
    try {
      await confirmarRetirada(id);
      setRetiradas((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err?.message || "Erro ao confirmar retirada.");
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDevolucao = async (id) => {
    setBusyId(id);
    setError("");
    try {
      await confirmarDevolucao(id);
      setDevolucoes((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err?.message || "Erro ao confirmar devolução.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="circ-app">
      <Header />
      <main className="circ-main">
        <h1 className="circ-title">Confirmações</h1>
        <p className="circ-subtitle">Confirme retiradas e devoluções feitas presencialmente na biblioteca.</p>

        <div className="circ-tabs">
          <button
            type="button"
            className={`circ-tab ${tab === "retiradas" ? "active" : ""}`}
            onClick={() => setTab("retiradas")}
          >
            Retiradas pendentes {retiradas.length > 0 ? `(${retiradas.length})` : ""}
          </button>
          <button
            type="button"
            className={`circ-tab ${tab === "devolucoes" ? "active" : ""}`}
            onClick={() => setTab("devolucoes")}
          >
            Devoluções pendentes {devolucoes.length > 0 ? `(${devolucoes.length})` : ""}
          </button>
        </div>

        {error ? <div className="circ-alert">{error}</div> : null}

        {loading ? (
          <div className="circ-empty">Carregando...</div>
        ) : tab === "retiradas" ? (
          retiradas.length === 0 ? (
            <EmptyState text="Nenhuma retirada pendente no momento." />
          ) : (
            <div className="circ-list">
              {retiradas.map((item) => (
                <RetiradaCard
                  key={item.id}
                  item={item}
                  onConfirm={handleConfirmRetirada}
                  busy={busyId === item.id}
                />
              ))}
            </div>
          )
        ) : devolucoes.length === 0 ? (
          <EmptyState text="Nenhuma devolução pendente no momento." />
        ) : (
          <div className="circ-list">
            {devolucoes.map((item) => (
              <DevolucaoCard
                key={item.id}
                item={item}
                onConfirm={handleConfirmDevolucao}
                busy={busyId === item.id}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
