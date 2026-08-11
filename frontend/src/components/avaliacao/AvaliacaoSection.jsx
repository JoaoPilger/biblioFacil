import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import StarRating, { StarDisplay } from "./StarRating";
import { salvarAvaliacao, excluirAvaliacao } from "../../services/avaliacoes";
import "./AvaliacaoSection.css";

const MAX_COMENTARIO = 2000;

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR");
}

export default function AvaliacaoSection({
  bookId,
  authenticated,
  isBibliotecario,
  minhaAvaliacao,
  podeAvaliar,
  avaliacoes = [],
  media = 0,
  total = 0,
  onSaved,
  autoEdit = false,
}) {
  const [nota, setNota] = useState(minhaAvaliacao?.nota || 0);
  const [comentario, setComentario] = useState(minhaAvaliacao?.comentario || "");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNota(minhaAvaliacao?.nota || 0);
    setComentario(minhaAvaliacao?.comentario || "");
    if (!autoEdit) {
      setEditing(false);
    }
  }, [minhaAvaliacao, autoEdit]);

  useEffect(() => {
    if (autoEdit && (podeAvaliar || minhaAvaliacao)) {
      setEditing(true);
    }
  }, [autoEdit, podeAvaliar, minhaAvaliacao]);

  const isLeitorLogado = authenticated && !isBibliotecario;
  const showForm = isLeitorLogado && (podeAvaliar || minhaAvaliacao);
  const canSubmit = nota >= 1 && nota <= 5;

  const avaliacoesPublicas = minhaAvaliacao
    ? avaliacoes.filter((av) => av.id !== minhaAvaliacao.id)
    : avaliacoes;

  const handleSave = async () => {
    if (!canSubmit) {
      toast.error("Selecione uma nota entre 1 e 5 estrelas.");
      return;
    }
    if (comentario.length > MAX_COMENTARIO) {
      toast.error(`Comentário deve ter no máximo ${MAX_COMENTARIO} caracteres.`);
      return;
    }
    setBusy(true);
    try {
      await salvarAvaliacao(bookId, { nota, comentario: comentario.trim() || null });
      toast.success(minhaAvaliacao ? "Avaliação atualizada!" : "Avaliação enviada!");
      setEditing(false);
      onSaved?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Remover sua avaliação?")) return;
    setBusy(true);
    try {
      await excluirAvaliacao(bookId);
      setNota(0);
      setComentario("");
      setEditing(false);
      toast.success("Avaliação removida.");
      onSaved?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="avaliacao-section">
      <h2 className="avaliacao-section__heading">Avaliações</h2>

      <div className="avaliacao-section__summary">
        <StarDisplay rating={media} size={22} />
        <span className="avaliacao-section__media">
          {Number(media) > 0 ? Number(media).toFixed(1) : "—"}
        </span>
        <span className="avaliacao-section__total">
          ({total} avaliação{total !== 1 ? "ões" : ""})
        </span>
      </div>

      {showForm && (
        <div className="avaliacao-section__form">
          {minhaAvaliacao && !editing ? (
            <div className="avaliacao-section__minha">
              <p className="avaliacao-section__label">Sua avaliação:</p>
              <StarDisplay rating={minhaAvaliacao.nota} size={20} />
              {minhaAvaliacao.comentario && (
                <p className="avaliacao-section__meu-comentario">{minhaAvaliacao.comentario}</p>
              )}
              <div className="avaliacao-section__form-actions">
                <button type="button" className="avaliacao-btn" onClick={() => setEditing(true)}>
                  Editar
                </button>
                <button type="button" className="avaliacao-btn avaliacao-btn--danger" onClick={handleDelete} disabled={busy}>
                  Remover
                </button>
              </div>
            </div>
          ) : podeAvaliar || editing ? (
            <>
              <p className="avaliacao-section__label">
                {minhaAvaliacao ? "Editar avaliação" : "Avalie este livro"}
              </p>
              <StarRating value={nota} onChange={setNota} disabled={busy} />
              <textarea
                className="avaliacao-section__textarea"
                placeholder="Comentário opcional sobre sua leitura..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                maxLength={MAX_COMENTARIO}
                rows={3}
                disabled={busy}
              />
              <div className="avaliacao-section__form-actions">
                <button type="button" className="avaliacao-btn avaliacao-btn--primary" onClick={handleSave} disabled={busy || !canSubmit}>
                  {busy ? "Salvando..." : "Salvar avaliação"}
                </button>
                {editing && (
                  <button type="button" className="avaliacao-btn" onClick={() => { setEditing(false); setNota(minhaAvaliacao?.nota || 0); setComentario(minhaAvaliacao?.comentario || ""); }}>
                    Cancelar
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {isLeitorLogado && !podeAvaliar && !minhaAvaliacao && (
        <p className="avaliacao-section__hint">Devolva o livro para poder avaliá-lo.</p>
      )}

      {!authenticated && total === 0 && (
        <p className="avaliacao-section__empty">Este livro ainda não possui avaliações.</p>
      )}

      {avaliacoesPublicas.length > 0 && (
        <ul className="avaliacao-list">
          {avaliacoesPublicas.map((av) => (
            <li key={av.id} className="avaliacao-list__item">
              <div className="avaliacao-list__header">
                <strong>{av.user_nome}</strong>
                <StarDisplay rating={av.nota} size={14} />
                <span className="avaliacao-list__date">{formatDate(av.updated_at || av.created_at)}</span>
              </div>
              {av.comentario && <p className="avaliacao-list__comentario">{av.comentario}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
