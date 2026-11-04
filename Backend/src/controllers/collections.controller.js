import * as collectionsService from '../services/collections.service.js';

export async function list(req, res) {
  res.json({ collections: await collectionsService.list(req.user.id) });
}

export async function get(req, res) {
  res.json({ collection: await collectionsService.getWithItems(req.user.id, req.valid.params.id) });
}

export async function create(req, res) {
  const collection = await collectionsService.create(req.user.id, req.valid.body);
  res.status(201).json({ collection });
}

export async function update(req, res) {
  const collection = await collectionsService.update(req.user.id, req.valid.params.id, req.valid.body);
  res.json({ collection });
}

export async function remove(req, res) {
  await collectionsService.remove(req.user.id, req.valid.params.id);
  res.status(204).end();
}

export async function addItem(req, res) {
  const item = await collectionsService.addItem(req.user.id, req.valid.params.id, req.valid.body);
  res.status(201).json({ item });
}

export async function removeItem(req, res) {
  await collectionsService.removeItem(req.user.id, req.valid.params.id, req.valid.params.contentId);
  res.status(204).end();
}
