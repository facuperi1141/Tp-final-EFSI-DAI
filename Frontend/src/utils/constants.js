// Valores fijos que usan varias vistas. Tienen que coincidir con los del backend.

export const STATUS_OPTIONS = [
  { value: 'quiero_escuchar', label: 'Quiero escuchar' },
  { value: 'escuchando', label: 'Escuchando' },
  { value: 'escuchado', label: 'Escuchado' },
  { value: 'favorito', label: 'Favorito' },
];

export const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS.map(({ value, label }) => [value, label]));

export const TYPE_OPTIONS = [
  { value: 'track', label: 'Canciones' },
  { value: 'album', label: 'Álbumes' },
  { value: 'artist', label: 'Artistas' },
];

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Agregados recientemente' },
  { value: 'oldest', label: 'Más antiguos' },
  { value: 'updated', label: 'Modificados recientemente' },
  { value: 'title', label: 'Título (A-Z)' },
  { value: 'artist', label: 'Artista (A-Z)' },
  { value: 'rating', label: 'Mejor puntuados' },
];

export const GENRE_OPTIONS = [
  'Rock',
  'Rock nacional',
  'Pop',
  'Alternativo',
  'Indie',
  'Electrónica',
  'Hip-hop',
  'Urbano latino',
  'R&B',
  'Jazz',
  'Folklore',
  'Clásica',
];

export const LANGUAGE_OPTIONS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
];

export const DEFAULT_COVER = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80';
