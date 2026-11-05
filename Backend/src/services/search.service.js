import { HttpError } from '../utils/HttpError.js';

// Proxy a la API de Deezer. Deezer no pide clave pero no permite CORS desde el navegador,
// por eso el front le pide al backend y el backend a Deezer.
const DEEZER_URL = 'https://api.deezer.com';
async function deezer(path) {
  let res;

  try {
    res = await fetch(`${DEEZER_URL}${path}`, {
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    console.error('ERROR DE CONEXIÓN CON DEEZER:', error);
    throw HttpError.badGateway('No se pudo conectar con Deezer');
  }

  if (!res.ok) {
    console.error('RESPUESTA HTTP DE DEEZER:', res.status);
    throw HttpError.badGateway();
  }

  const data = await res.json();

  if (data.error) {
    console.error('ERROR DEVUELTO POR DEEZER:', data.error);

    if (data.error.code === 800) {
      throw HttpError.notFound('No se encontró en Deezer');
    }

    throw HttpError.badGateway();
  }

  return data;
}
const yearOf = (date) => {
  const year = Number(String(date ?? '').slice(0, 4));
  return year >= 1800 && year <= 2100 ? year : null;
};

// Pasa la respuesta de Deezer al mismo formato que usa la tabla contents,
// así el front puede mandar el resultado tal cual a POST /api/library
function toContent(item, type) {
  if (type === 'artist') {
    return {
      source: 'deezer',
      external_id: String(item.id),
      type,
      title: item.name,
      artist_name: item.name,
      album_name: null,
      cover_url: item.picture_xl || item.picture_big || null,
      duration_ms: null,
      release_year: null,
      genres: [],
      fans: item.nb_fan ?? null,
    };
  }
  if (type === 'album') {
    return {
      source: 'deezer',
      external_id: String(item.id),
      type,
      title: item.title,
      artist_name: item.artist?.name ?? null,
      album_name: item.title,
      cover_url: item.cover_xl || item.cover_big || null,
      duration_ms: item.duration ? item.duration * 1000 : null,
      release_year: yearOf(item.release_date),
      genres: item.genres?.data?.map((g) => g.name) ?? [],
      track_count: item.nb_tracks ?? null,
    };
  }
  return {
    source: 'deezer',
    external_id: String(item.id),
    type: 'track',
    title: item.title,
    artist_name: item.artist?.name ?? null,
    album_name: item.album?.title ?? null,
    cover_url: item.album?.cover_xl || item.album?.cover_big || null,
    duration_ms: item.duration ? item.duration * 1000 : null,
    release_year: yearOf(item.release_date ?? item.album?.release_date),
    genres: [],
    preview_url: item.preview || null,
  };
}

export async function search({ q, type, limit, offset }) {
  const data = await deezer(`/search/${type}?q=${encodeURIComponent(q)}&limit=${limit}&index=${offset}`);
  return {
    results: data.data.map((item) => toContent(item, type)),
    total: data.total ?? data.data.length,
  };
}

// Lo más escuchado en Deezer, para el contenido destacado del Home
export async function chart({ type, limit }) {
  const plural = { track: 'tracks', album: 'albums', artist: 'artists' }[type];
  const data = await deezer(`/chart/0/${plural}?limit=${limit}`);
  return { results: data.data.map((item) => toContent(item, type)) };
}

export async function detail(type, externalId) {
  const item = await deezer(`/${type}/${externalId}`);
  const content = toContent(item, type);

  // Los géneros en Deezer están en el álbum, no en la canción
  if (type === 'track' && item.album?.id) {
    try {
      const album = await deezer(`/album/${item.album.id}`);
      content.genres = album.genres?.data?.map((g) => g.name) ?? [];
      content.release_year ??= yearOf(album.release_date);
    } catch {
      // Sin géneros no se rompe el detalle
    }
  }
  return content;
}
