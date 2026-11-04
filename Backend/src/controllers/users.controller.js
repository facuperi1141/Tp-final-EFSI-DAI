import * as usersService from '../services/users.service.js';
import { HttpError } from '../utils/HttpError.js';

export async function getMe(req, res) {
  const [user, preferences] = await Promise.all([
    usersService.getById(req.user.id),
    usersService.getPreferences(req.user.id),
  ]);
  if (!user) throw HttpError.notFound('Usuario no encontrado');
  res.json({ user, preferences });
}

export async function updateMe(req, res) {
  const user = await usersService.updateProfile(req.user.id, req.valid.body);
  if (!user) throw HttpError.notFound('Usuario no encontrado');
  res.json({ user });
}

export async function getPreferences(req, res) {
  const preferences = await usersService.getPreferences(req.user.id);
  res.json({ preferences });
}

export async function replacePreferences(req, res) {
  const preferences = await usersService.replacePreferences(req.user.id, req.valid.body);
  res.json({ preferences });
}
