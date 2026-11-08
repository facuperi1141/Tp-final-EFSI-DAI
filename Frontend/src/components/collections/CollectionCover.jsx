import { ListMusic } from 'lucide-react';
import Cover from '../UI/Cover.jsx';

// Portada de una playlist:
// - si el usuario eligió una (cover_url), se usa esa
// - si hay 4 portadas de temas, se arma un mosaico de 2x2
// - si hay entre 1 y 3, se muestra la primera
// - si no hay ninguna, una portada por defecto
export default function CollectionCover({ coverUrl, covers = [], className = '' }) {
  if (coverUrl) {
    return (
      <div className={`collection-cover ${className}`}>
        <Cover src={coverUrl} />
      </div>
    );
  }

  if (covers.length >= 4) {
    return (
      <div className={`collection-cover mosaic ${className}`}>
        {covers.slice(0, 4).map((src, index) => (
          <Cover key={index} src={src} />
        ))}
      </div>
    );
  }

  if (covers.length > 0) {
    return (
      <div className={`collection-cover ${className}`}>
        <Cover src={covers[0]} />
      </div>
    );
  }

  return (
    <div className={`collection-cover placeholder ${className}`}>
      <ListMusic />
    </div>
  );
}
