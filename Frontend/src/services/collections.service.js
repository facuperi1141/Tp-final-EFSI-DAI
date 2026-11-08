import api from './api.js';

// Cada playlist viene con item_count y covers (hasta 4 portadas para el mosaico)
export async function getCollections() {
  const { data } = await api.get('/collections');
  return data.collections;
}

// La playlist con sus temas: items: [{ position, added_at, content }]
export async function getCollection(id) {
  const { data } = await api.get(`/collections/${id}`);
  return data.collection;
}

// fields: { name, description?, cover_url? }. Si el nombre ya existe responde 409.
export async function createCollection(fields) {
  const { data } = await api.post('/collections', fields);
  return data.collection;
}

export async function updateCollection(id, changes) {
  const { data } = await api.patch(`/collections/${id}`, changes);
  return data.collection;
}

export async function deleteCollection(id) {
  await api.delete(`/collections/${id}`);
}

// contentId es el id de nuestra tabla contents, no el external_id de Deezer
export async function removeCollectionItem(collectionId, contentId) {
  await api.delete(`/collections/${collectionId}/items/${contentId}`);
}
