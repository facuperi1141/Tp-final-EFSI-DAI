import api from './api.js';

export async function getActivity(limit = 10) {
  const { data } = await api.get('/activity', { params: { limit } });
  return data.activities;
}
