import { Link } from 'react-router-dom';
import { pluralize } from '../../utils/format.js';
import CollectionCover from './CollectionCover.jsx';

export default function CollectionCard({ collection }) {
  return (
    <Link className="collection-card" to={`/colecciones/${collection.id}`}>
      <CollectionCover coverUrl={collection.cover_url} covers={collection.covers} />
      <b>{collection.name}</b>
      <small>{pluralize(collection.item_count, 'tema')}</small>
    </Link>
  );
}
