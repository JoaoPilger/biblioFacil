import toast from "react-hot-toast";
import "./FavoritoButton.css";

export default function FavoritoButton({ favoritado, onToggle, disabled = false, busy = false }) {
  const handleClick = async () => {
    try {
      await onToggle?.();
    } catch (err) {
      toast.error(err?.message || "Erro ao atualizar favorito.");
    }
  };

  return (
    <button
      type="button"
      className={`favorito-btn${favoritado ? " favorito-btn--active" : ""}`}
      onClick={handleClick}
      disabled={disabled || busy}
      aria-pressed={favoritado}
      aria-label={favoritado ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <span className="favorito-btn__icon">{favoritado ? "♥" : "♡"}</span>
      <span>{busy ? "..." : favoritado ? "Favoritado" : "Favoritar"}</span>
    </button>
  );
}
