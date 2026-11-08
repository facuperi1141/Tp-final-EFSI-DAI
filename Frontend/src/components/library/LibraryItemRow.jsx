import { Heart, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { STATUS_OPTIONS } from '../../utils/constants.js';
import Cover from '../UI/Cover.jsx';
import StarRating from '../UI/StarRating.jsx';

const TYPE_LABELS = { track: 'Canción', album: 'Álbum', artist: 'Artista' };

// Una fila de la biblioteca: { id, status, is_favorite, rating, content }.
// onUpdate y onRemove los maneja la página, que es la dueña de la lista.
export default function LibraryItemRow({ item, onUpdate, onRemove }) {
  const [saving, setSaving] = useState(false);
  const { content } = item;

  // Mientras se guarda un cambio se bloquean los controles para no mandar dos PATCH a la vez
  async function run(action) {
    setSaving(true);
    try {
      await action();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`library-row ${saving ? 'is-saving' : ''}`}>
      <Link className="library-row-info" to={`/detalle/${content.type}/${content.external_id}`}>
        <Cover src={content.cover_url} alt={content.title} />
        <span>
          <b>{content.title}</b>
          <small>
            {TYPE_LABELS[content.type]}
            {content.artist_name && content.type !== 'artist' && ` · ${content.artist_name}`}
          </small>
        </span>
      </Link>

      <select
        className="library-row-status"
        value={item.status}
        disabled={saving}
        aria-label="Estado"
        onChange={(event) => run(() => onUpdate(item.id, { status: event.target.value }))}
      >
        {STATUS_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <div className="library-row-rating">
        <StarRating
          value={item.rating}
          disabled={saving}
          onChange={(rating) => run(() => onUpdate(item.id, { rating }))}
        />
      </div>

      <button
        type="button"
        className={`icon-btn library-row-fav ${item.is_favorite ? 'liked' : ''}`}
        disabled={saving}
        aria-label={item.is_favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
        onClick={() => run(() => onUpdate(item.id, { is_favorite: !item.is_favorite }))}
      >
        <Heart fill={item.is_favorite ? 'currentColor' : 'none'} />
      </button>

      <button
        type="button"
        className="icon-btn library-row-remove"
        disabled={saving}
        aria-label="Quitar de la biblioteca"
        onClick={() => run(() => onRemove(item))}
      >
        <Trash2 />
      </button>
    </div>
  );
}
