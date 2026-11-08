import { cleanParams } from '../utils/forms.js';
import api from './api.js';

// filters: { status, favorite, type, q, sort, limit, offset }. Los vacíos no se mandan.
// Responde { items, total, limit, offset }
export async function getLibrary(filters = {}) {
  const { data } = await api.get('/library', { params: cleanParams(filters) });
  return data;
}

// Mismos filtros que getLibrary (menos favorite) y la misma respuesta
export async function getFavorites(filters = {}) {
  const { data } = await api.get('/favorites', { params: cleanParams(filters) });
  return data;
}

// changes: { status?, is_favorite?, rating? }. Devuelve el item actualizado.
export async function updateLibraryItem(id, changes) {
  const { data } = await api.patch(`/library/${id}`, changes);
  return data.item;
}

export async function removeLibraryItem(id) {
  await api.delete(`/library/${id}`);
}
