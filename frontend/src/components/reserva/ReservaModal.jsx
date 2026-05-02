import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/authContext";
import { createReserva } from "../../services/reservas";
import "./ReservaModal.css";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toDateInputValue(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseDateInputValue(s) {
  // Evita bug de fuso horário do `new Date("YYYY-MM-DD")` (interpreta como UTC).
  // Aqui tratamos como data local (meia-noite local).
  if (typeof s !== "string") return new Date(NaN);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return new Date(NaN);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return new Date(y, mo - 1, d, 0, 0, 0, 0);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function normalizeDateOnly(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function clampDate(date, min, max) {
  const t = date.getTime();
  if (t < min.getTime()) return new Date(min);
  if (t > max.getTime()) return new Date(max);
  return date;
}

export default function ReservaModal({ open, onClose, book }) {
  const { user, authenticated, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const today = useMemo(() => normalizeDateOnly(new Date()), []);
  const defaultRetirada = useMemo(() => today, [today]);
  const defaultLimite = useMemo(() => addDays(defaultRetirada, 14), [defaultRetirada]);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    retirada: toDateInputValue(defaultRetirada),
    limite: toDateInputValue(defaultLimite),
    observacoes: "",
  });

  const maxLimiteByRetirada = useMemo(() => {
    const retiradaDate = parseDateInputValue(form.retirada);
    return addDays(retiradaDate, 14);
  }, [form.retirada]);

  useEffect(() => {
    if (!open) return;
    setError("");
    setSuccess("");

    const nome = user?.nome || "";
    const email = user?.email || "";

    setForm((f) => ({
      ...f,
      nome,
      email,
      retirada: toDateInputValue(defaultRetirada),
      limite: toDateInputValue(defaultLimite),
      observacoes: "",
    }));
  }, [open, user, defaultRetirada, defaultLimite]);

  useEffect(() => {
    if (!open) return;

    const retiradaDate = parseDateInputValue(form.retirada);
    const min = retiradaDate;
    const max = addDays(retiradaDate, 14);
    const limiteDate = parseDateInputValue(form.limite);

    // Só corrige automaticamente se estiver fora do intervalo permitido.
    if (
      Number.isNaN(retiradaDate.getTime()) ||
      Number.isNaN(limiteDate.getTime())
    ) {
      return;
    }
    if (limiteDate.getTime() < min.getTime() || limiteDate.getTime() > max.getTime()) {
      const clamped = clampDate(limiteDate, min, max);
      const next = toDateInputValue(clamped);
      if (next !== form.limite) {
        setForm((f) => ({ ...f, limite: next }));
      }
    }
  }, [open, form.retirada, form.limite]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const retiradaDate = parseDateInputValue(form.retirada);
  const limiteDate = parseDateInputValue(form.limite);
  const limiteMax = maxLimiteByRetirada;

  const canSubmit =
    !submitting &&
    form.nome.trim().length > 0 &&
    form.email.trim().length > 0 &&
    !Number.isNaN(retiradaDate.getTime()) &&
    !Number.isNaN(limiteDate.getTime()) &&
    limiteDate.getTime() >= retiradaDate.getTime() &&
    limiteDate.getTime() <= limiteMax.getTime();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (authLoading) {
      setError("Carregando sua sessão... tente novamente.");
      return;
    }

    if (!authenticated) {
      setError("Faça login para reservar.");
      return;
    }

    if (!book?.id) {
      setError("Não foi possível identificar o livro para reservar.");
      return;
    }
    if (!canSubmit) {
      setError("Revise os dados da reserva. O limite máximo é de 2 semanas.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        bookId: book.id,
        nome: form.nome.trim(),
        email: form.email.trim(),
        retirada: form.retirada,
        limite: form.limite,
        observacoes: form.observacoes.trim(),
      };

      await createReserva(payload);
      setSuccess("Reserva enviada. Aguarde a confirmação.");
      onClose?.();
    } catch (err) {
      setError(err?.message || "Não foi possível enviar a reserva.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="rf-modal__backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="presentation"
    >
      <div className="rf-modal" role="dialog" aria-modal="true" aria-label="Reserva do livro">
        <div className="rf-modal__header">
          <div>
            <h2 className="rf-modal__title">Reservar livro</h2>
          </div>
          <button type="button" className="rf-modal__close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        <form className="rf-modal__body" onSubmit={handleSubmit}>
          {error ? <div className="rf-alert rf-alert--error">{error}</div> : null}
          {success ? <div className="rf-alert rf-alert--success">{success}</div> : null}

          <div className="rf-grid">
            <div className="rf-field">
              <label className="rf-label" htmlFor="rf-nome">
                Nome
              </label>
              <input
                id="rf-nome"
                className="rf-input"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Seu nome"
                autoComplete="name"
                required
              />
            </div>

            <div className="rf-field">
              <label className="rf-label" htmlFor="rf-email">
                E-mail
              </label>
              <input
                id="rf-email"
                className="rf-input"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="seu@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="rf-field">
              <label className="rf-label" htmlFor="rf-retirada">
                Data de retirada
              </label>
              <input
                id="rf-retirada"
                className="rf-input"
                type="date"
                value={form.retirada}
                min={toDateInputValue(today)}
                onChange={(e) => setForm((f) => ({ ...f, retirada: e.target.value }))}
                required
              />
              <div className="rf-hint">Você pode retirar a partir de hoje.</div>
            </div>

            <div className="rf-field">
              <label className="rf-label" htmlFor="rf-limite">
                Reservar até
              </label>
              <input
                id="rf-limite"
                className="rf-input"
                type="date"
                value={form.limite}
                min={form.retirada}
                max={toDateInputValue(limiteMax)}
                onChange={(e) => setForm((f) => ({ ...f, limite: e.target.value }))}
                required
              />
              <div className="rf-hint">
                Limite máximo: <strong>14 dias</strong> após a retirada.
              </div>
            </div>
          </div>

          <div className="rf-modal__footer">
            <button type="button" className="rf-btn rf-btn--ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="rf-btn" disabled={!canSubmit}>
              {submitting ? "Enviando..." : "Confirmar reserva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

