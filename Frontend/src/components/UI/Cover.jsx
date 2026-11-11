import { DEFAULT_COVER } from '../../utils/constants.js';

// Portada cuadrada. Si no hay imagen o no carga, muestra la portada por defecto.
export default function Cover({ src, alt = '', className = '' }) {
  function handleError(event) {
    if (event.currentTarget.src !== DEFAULT_COVER) event.currentTarget.src = DEFAULT_COVER;
  }

  return <img className={`cover ${className}`} src={src || DEFAULT_COVER} alt={alt} loading="lazy" onError={handleError} />;
}
