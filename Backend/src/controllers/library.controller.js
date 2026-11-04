import * as libraryService from '../services/library.service.js';

export async function list(req, res) {
  res.json(await libraryService.list(req.user.id, req.valid.query));
}

export async function favorites(req, res) {
  res.json(await libraryService.list(req.user.id, { ...req.valid.query, favorite: true }));
}

export async function add(req, res) {
  const item = await libraryService.add(req.user.id, req.valid.body);
  res.status(201).json({ item });
}

export async function getByExternal(req, res) {
  const { source, externalId } = req.valid.params;
  res.json(await libraryService.getByExternal(req.user.id, source, externalId));
}

export async function update(req, res) {
  const item = await libraryService.update(req.user.id, req.valid.params.id, req.valid.body);
  res.json({ item });
}

export async function remove(req, res) {
  await libraryService.remove(req.user.id, req.valid.params.id);
  res.status(204).end();
}
