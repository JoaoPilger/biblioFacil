import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import { getMinhasReservas, cancelarReserva, renovarEmprestimo } from "../../services/reservas";
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

function formatCurrency(value) {
  const num = parseFloat(value) || 0;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

function MultaBadge({ diasAtraso, multaAcumulada }) {
  if (!diasAtraso || Number(diasAtraso) === 0) return null;
  return (
    <div className="mr-multa-badge">
      <span className="mr-multa-icon">⚠️</span>
      <span>
        Atraso: <strong>{diasAtraso} dia{Number(diasAtraso) !== 1 ? "s" : ""}</strong>
        {" · "}Multa: <strong>{formatCurrency(multaAcumulada)}</strong>
      </span>
    </div>
  );
}

function ItemCard({ item, navigate, actionLabel, onAction, busy, statusLabel, extraAction, metaLines }) {
  return (
    <div className="mr-card" onClick={() => navigate(`/livro/${item.livro_id}`)}>
      <img className="mr-card__cover" src={coverUrl(item.capa_url)} alt="" />
      <div className="mr-card__info">
        <h3 className="mr-card__title">{item.titulo}</h3>
        <p className="mr-card__subtitle">{item.autor}</p>
        {metaLines?.map((line, i) => (
          <p key={i} className="mr-card__meta">{line}</p>
        ))}
        <span className="mr-card__badge">{statusLabel}</span>
        {item.status === "ativo" && (
          <MultaBadge
            diasAtraso={item.dias_atraso}
            multaAcumulada={item.multa_acumulada}
          />
        )}
      </div>
      <div className="mr-card__actions" onClick={(e) => e.stopPropagation()}>
        {onAction ? (
          <button
            type="button"
            className="mr-btn"
            onClick={() => onAction(item.id)}
            disabled={busy}
          >
            {busy ? "Aguarde..." : actionLabel}
          </button>
        ) : null}
        {extraAction ? extraAction : null}
      </div>
    </div>
  );
}

function RenovarButton({ item, onRenovar, busyRenovarId }) {
  const busy = busyRenovarId === item.id;

  if (item.status !== "ativo") return null;

  const podRenovar = item.pode_renovar === true || item.pode_renovar === "true";
  const renovacoesRestantes = 2 - (Number(item.renovacoes) || 0);

  let tooltip = "";
  if (!podRenovar) {
    if (Number(item.renovacoes) >= 2) {
      tooltip = "Limite de renovações atingido (máximo 2)";
    } else {
      tooltip = "Livro reservado por outro leitor";
    }
  }

  return (
    <div className="mr-renovar-wrapper" title={tooltip}>
      <button
        type="button"
        className={`mr-btn mr-btn--renovar${!podRenovar ? " mr-btn--disabled" : ""}`}
        onClick={() => podRenovar && onRenovar(item.id)}
        disabled={busy || !podRenovar}
      >
        {busy ? "Renovando..." : `Renovar${podRenovar ? ` (+7 dias)` : ""}`}
      </button>
      {podRenovar && (
        <span className="mr-renovacoes-restantes">
          {renovacoesRestantes} renovação{renovacoesRestantes !== 1 ? "ões" : ""} restante{renovacoesRestantes !== 1 ? "s" : ""}
        </span>
      )}
      {!podRenovar && tooltip && (
        <span className="mr-renovar-aviso">{tooltip}</span>
      )}
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
  const [busyRenovarId, setBusyRenovarId] = useState(null);

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

  // Saldo devedor total (empréstimos ativos com atraso)
  const saldoDevedor = emprestados.reduce(
    (acc, e) => acc + parseFloat(e.multa_acumulada || 0),
    0
  );

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

  const handleRenovar = async (emprestimoId) => {
    setBusyRenovarId(emprestimoId);
    setError("");
    try {
      await renovarEmprestimo(emprestimoId);
      await load();
    } catch (err) {
      setError(err?.message || "Erro ao renovar empréstimo.");
    } finally {
      setBusyRenovarId(null);
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
            <>
              {saldoDevedor > 0 && (
                <div className="mr-saldo-devedor">
                  <span className="mr-saldo-icon">💰</span>
                  <div>
                    <strong>Saldo devedor total em multas:</strong>
                    <span className="mr-saldo-valor">{formatCurrency(saldoDevedor)}</span>
                  </div>
                  <p className="mr-saldo-aviso">Regularize na devolução dos livros em atraso.</p>
                </div>
              )}
              <div className="mr-list">
                {emprestados.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    navigate={navigate}
                    statusLabel={`${EMPRESTIMO_STATUS_LABEL[item.status]} · devolver até ${formatDate(item.data_devolucao_prevista)}`}
                    extraAction={
                      <RenovarButton
                        item={item}
                        onRenovar={handleRenovar}
                        busyRenovarId={busyRenovarId}
                      />
                    }
                  />
                ))}
              </div>
            </>
          )
        ) : historico.length === 0 ? (
          <EmptyState text="Nenhum histórico ainda." />
        ) : (
          <div className="mr-list">
            {historico.map((item) => {
              const isEmprestimo = item.__tipo === "emprestimo";
              const metaLines = isEmprestimo
                ? [
                    `Empréstimo: ${formatDate(item.data_emprestimo)}`,
                    item.data_devolucao_real
                      ? `Devolvido: ${formatDate(item.data_devolucao_real)}`
                      : `Devolução prevista: ${formatDate(item.data_devolucao_prevista)}`,
                  ]
                : [`Reserva: ${formatDate(item.created_at)}`];

              const podeAvaliar = isEmprestimo && item.status === "devolvido" &&
                (item.pode_avaliar === true || item.pode_avaliar === "true");
              const temAvaliacao = isEmprestimo && item.avaliacao_id;

              return (
                <ItemCard
                  key={`${item.__tipo}-${item.id}`}
                  item={item}
                  navigate={navigate}
                  metaLines={metaLines}
                  statusLabel={
                    item.__tipo === "reserva"
                      ? RESERVA_STATUS_LABEL[item.status]
                      : EMPRESTIMO_STATUS_LABEL[item.status]
                  }
                  extraAction={
                    podeAvaliar ? (
                      <button
                        type="button"
                        className="mr-btn mr-btn--renovar"
                        onClick={() => navigate(`/livro/${item.livro_id}#avaliar`)}
                      >
                        Avaliar
                      </button>
                    ) : temAvaliacao ? (
                      <button
                        type="button"
                        className="mr-btn"
                        onClick={() => navigate(`/livro/${item.livro_id}#avaliar`)}
                      >
                        Editar avaliação
                      </button>
                    ) : null
                  }
                />
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
