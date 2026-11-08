import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/format.js';
import Cover from '../UI/Cover.jsx';

export default function ReviewList({ reviews }) {
  if (reviews.length === 0) return <p className="muted">Todavía no escribiste reseñas.</p>;

  return (
    <div className="review-list">
      {reviews.map(({ id, body, updated_at, content }) => (
        <Link key={id} className="review-item" to={`/detalle/${content.type}/${content.external_id}`}>
          <Cover src={content.cover_url} alt={content.title} />
          <div>
            <b>{content.title}</b>
            <small className="muted">
              {content.artist_name} · {formatDate(updated_at)}
            </small>
            <p>{body}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
