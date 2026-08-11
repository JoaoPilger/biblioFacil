import { useState } from "react";
import "./StarRating.css";

export function StarDisplay({ rating = 0, size = 18 }) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  const filledUpTo = Math.round(value);
  return (
    <span className="star-display" aria-label={`${value.toFixed(1)} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star-display__star${star <= filledUpTo && value > 0 ? " star-display__star--filled" : ""}`}
          style={{ fontSize: size }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function StarRating({ value = 0, onChange, disabled = false, size = 28 }) {
  const [hover, setHover] = useState(null);
  const active = hover ?? value;

  return (
    <div className="star-rating" role="group" aria-label="Avaliar com estrelas">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-rating__btn${star <= active ? " star-rating__btn--active" : ""}`}
          style={{ fontSize: size }}
          disabled={disabled}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => !disabled && setHover(null)}
          aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
