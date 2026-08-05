import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import { getMinhasReservas, cancelarReserva } from "../../services/reservas";
import "./minhas_reservas.css";
import API_BASE from "../../lib/apiBase";

const API_BASE_SLASH = `${API_BASE}/`;

function coverUrl(capa_url) {
  return capa_url
    ? `${API_BASE_SLASH}${capa_url.replace("/public", "")}`
    : `${API_BASE_SLASH}covers/default.svg`;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

const RESERVA_STATUS_LABEL = {
  pendente: "Aguardando retirada",
  confirmada: "Retirada confirmada",
  cancelada: "Cancelada",
};

const EMPRESTIMO_STATUS_LABEL = {
  ativo: "Emprestado",
  devolvido: "Devolvido",
};

function EmptyState({ text }) {
  return <div className="mr-empty">{text}</div>;
}

function ItemCard({ item, navigate, actionLabel, onAction, busy, statusLabel }) {
  return (
    <div className="mr-card" onClick={() => navigate(`/livro/${item.livro_id}`)}>
      <img className="mr-card__cover" src={coverUrl(item.capa_url)} alt="" />
      <div className="mr-card__info">
        <h3 className="mr-card__title">{item.titulo}</h3>
        <p className="mr-card__subtitle">{item.autor}</p>
        <span className="mr-card__badge">{statusLabel}</span>
      </div>
      {onAction ? (
        <button
          type="button"
          className="mr-btn"
          onClick={(e) => {
            e.stopPropagation();
            onAction(item.id);
          }}
          disabled={busy}
        >
          {busy ? "Aguarde..." : actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export default function MinhasReservas() {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [emprestimos, setEmprestimos] = useState([]);
  const [tab, setTab] = useState("pendentes");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMinhasReservas();
      setReservas(data.reservas || []);
      setEmprestimos(data.emprestimos || []);
    } catch (err) {
      setError(err?.message || "Erro ao carregar suas reservas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pendentes = reservas.filter((r) => r.status === "pendente");
  const emprestados = emprestimos.filter((e) => e.status === "ativo");
  const historico = [
    ...reservas
      .filter((r) => r.status !== "pendente")
      .map((r) => ({ ...r, __tipo: "reserva", __data: r.created_at })),
    ...emprestimos
      .filter((e) => e.status !== "ativo")
      .map((e) => ({ ...e, __tipo: "emprestimo", __data: e.data_emprestimo })),
  ].sort((a, b) => new Date(b.__data) - new Date(a.__data));

  const handleCancelar = async (reservaId) => {
    const item = pendentes.find((r) => r.id === reservaId);
    if (!item) return;
    setBusyId(reservaId);
    setError("");
    try {
      await cancelarReserva(item.livro_id);
      await load();
    } catch (err) {
      setError(err?.message || "Erro ao cancelar reserva.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mr-app">
      <Header />
      <main className="mr-main">
        <h1 className="mr-title">Minhas Reservas</h1>
        <p className="mr-subtitle">Acompanhe suas retiradas, empréstimos e histórico na biblioteca.</p>

        <div className="mr-tabs">
          <button
            type="button"
            className={`mr-tab ${tab === "pendentes" ? "active" : ""}`}
            onClick={() => setTab("pendentes")}
          >
            Pendentes {pendentes.length > 0 ? `(${pendentes.length})` : ""}
          </button>
          <button
            type="button"
            className={`mr-tab ${tab === "emprestados" ? "active" : ""}`}
            onClick={() => setTab("emprestados")}
          >
            Emprestados {emprestados.length > 0 ? `(${emprestados.length})` : ""}
          </button>
          <button
            type="button"
            className={`mr-tab ${tab === "historico" ? "active" : ""}`}
            onClick={() => setTab("historico")}
          >
            Histórico
          </button>
        </div>

        {error ? <div className="mr-alert">{error}</div> : null}

        {loading ? (
          <div className="mr-empty">Carregando...</div>
        ) : tab === "pendentes" ? (
          pendentes.length === 0 ? (
            <EmptyState text="Você não tem retiradas pendentes." />
          ) : (
            <div className="mr-list">
              {pendentes.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  navigate={navigate}
                  statusLabel={RESERVA_STATUS_LABEL[item.status]}
                  actionLabel="Cancelar"
                  onAction={handleCancelar}
                  busy={busyId === item.id}
                />
              ))}
            </div>
          )
        ) : tab === "emprestados" ? (
          emprestados.length === 0 ? (
            <EmptyState text="Você não tem livros emprestados no momento." />
          ) : (
            <div className="mr-list">
              {emprestados.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  navigate={navigate}
                  statusLabel={`${EMPRESTIMO_STATUS_LABEL[item.status]} · devolver até ${formatDate(item.data_devolucao_prevista)}`}
                />
              ))}
            </div>
          )
        ) : historico.length === 0 ? (
          <EmptyState text="Nenhum histórico ainda." />
        ) : (
          <div className="mr-list">
            {historico.map((item) => (
              <ItemCard
                key={`${item.__tipo}-${item.id}`}
                item={item}
                navigate={navigate}
                statusLabel={
                  item.__tipo === "reserva"
                    ? RESERVA_STATUS_LABEL[item.status]
                    : EMPRESTIMO_STATUS_LABEL[item.status]
                }
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
