import api from './api.js';

// Responde { user, preferences }
export async function getMe() {
  const { data } = await api.get('/users/me');
  return data;
}

// changes: { display_name?, bio?, avatar_url? }. Mandar solo lo que cambió.
export async function updateProfile(changes) {
  const { data } = await api.patch('/users/me', changes);
  return data.user;
}

// Reemplaza todas las preferencias: hay que mandar los 4 campos siempre
export async function replacePreferences({ favorite_genres, language, is_public, yearly_goal }) {
  const { data } = await api.put('/users/me/preferences', { favorite_genres, language, is_public, yearly_goal });
  return data.preferences;
}
