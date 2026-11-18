import api from './api.js';

// Busca contenidos en Deezer a través del backend: devuelve { results, total }
export async function searchMusic({ q, type = 'track', limit = 25, offset = 0 }) {
  const { data } = await api.get('/search', {
    params: { q: q.trim(), type, limit, offset },
  });
  return data;
}

// Obtiene lo más escuchado en Deezer según tipo: devuelve array de contenidos
export async function getChart({ type = 'track', limit = 12 } = {}) {
  const { data } = await api.get('/search/chart', {
    params: { type, limit },
  });
  return data.results || [];
}

// Obtiene el detalle de un contenido específico
export async function getContentDetail(type, externalId) {
  const { data } = await api.get(`/search/${type}/${externalId}`);
  return data.content;
}