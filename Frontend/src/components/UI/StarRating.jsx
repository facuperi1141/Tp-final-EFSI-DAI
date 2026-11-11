import { Star } from 'lucide-react';

// Puntuación de 1 a 5. Tocar la estrella que ya está elegida borra la puntuación (null).
export default function StarRating({ value, onChange, disabled = false }) {
  return (
    <div className="star-rating" role="group" aria-label="Puntuación">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={star <= (value ?? 0) ? 'chosen' : ''}
          disabled={disabled}
          aria-label={`${star} estrellas`}
          onClick={(event) => {
            event.stopPropagation();
            onChange(star === value ? null : star);
          }}
        >
          <Star fill="currentColor" />
        </button>
      ))}
    </div>
  );
}
