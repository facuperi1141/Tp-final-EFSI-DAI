import * as activityService from '../services/activity.service.js';
import * as searchService from '../services/search.service.js';
import * as statsService from '../services/stats.service.js';

export async function activity(req, res) {
  res.json({ activities: await activityService.list(req.user.id, req.valid.query) });
}

export async function stats(req, res) {
  res.json(await statsService.overview(req.user.id));
}

export async function wrapped(req, res) {
  res.json(await statsService.wrapped(req.user.id, req.valid.query.year));
}

export async function search(req, res) {
  res.json(await searchService.search(req.valid.query));
}

export async function chart(req, res) {
  res.json(await searchService.chart(req.valid.query));
}

export async function externalDetail(req, res) {
  const { type, externalId } = req.valid.params;
  res.json({ content: await searchService.detail(type, externalId) });
}
