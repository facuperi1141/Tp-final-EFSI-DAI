import { STATUS_LABELS } from './constants.js';

// Arma el texto de un evento del feed de actividad (GET /activity).
// El título y el nombre de la playlist se toman de metadata, porque el contenido
// o la playlist pueden haberse borrado después.
export function describeActivity({ type, metadata = {}, content, collection }) {
  const title = metadata.title ?? content?.title ?? 'un tema';
  const playlist = metadata.name ?? collection?.name ?? 'una playlist';

  switch (type) {
    case 'added':
      return `Agregaste "${title}" a tu biblioteca`;
    case 'removed':
      return `Quitaste "${title}" de tu biblioteca`;
    case 'status_changed':
      return `Marcaste "${title}" como ${STATUS_LABELS[metadata.to] ?? metadata.to}`;
    case 'favorited':
      return `Marcaste "${title}" como favorito`;
    case 'unfavorited':
      return `Sacaste "${title}" de favoritos`;
    case 'rated':
      return metadata.rating ? `Puntuaste "${title}" con ${metadata.rating} ★` : `Quitaste la puntuación de "${title}"`;
    case 'reviewed':
      return `Escribiste una reseña de "${title}"`;
    case 'review_updated':
      return `Editaste tu reseña de "${title}"`;
    case 'review_deleted':
      return `Borraste tu reseña de "${title}"`;
    case 'collection_created':
      return `Creaste la playlist "${playlist}"`;
    case 'collection_updated':
      return `Editaste la playlist "${playlist}"`;
    case 'collection_deleted':
      return `Borraste la playlist "${playlist}"`;
    case 'collection_item_added':
      return `Agregaste "${title}" a "${playlist}"`;
    case 'collection_item_removed':
      return `Quitaste "${title}" de "${playlist}"`;
    default:
      return 'Actualizaste tu colección';
  }
}
