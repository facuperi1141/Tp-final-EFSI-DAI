import api from './api.js';

// Reseñas del usuario, cada una con su content
export async function getMyReviews() {
  const { data } = await api.get('/reviews/me');
  return data.reviews;
}
