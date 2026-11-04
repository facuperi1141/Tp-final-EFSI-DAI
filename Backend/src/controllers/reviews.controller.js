import * as reviewsService from '../services/reviews.service.js';

export async function listMine(req, res) {
  res.json({ reviews: await reviewsService.listMine(req.user.id) });
}

export async function listByContent(req, res) {
  res.json({ reviews: await reviewsService.listByContent(req.user.id, req.valid.params.id) });
}

export async function create(req, res) {
  const review = await reviewsService.create(req.user.id, req.valid.body);
  res.status(201).json({ review });
}

export async function update(req, res) {
  const review = await reviewsService.update(req.user.id, req.valid.params.id, req.valid.body);
  res.json({ review });
}

export async function remove(req, res) {
  await reviewsService.remove(req.user.id, req.valid.params.id);
  res.status(204).end();
}
