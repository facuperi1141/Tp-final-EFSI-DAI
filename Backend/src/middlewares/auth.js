import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';

export const AUTH_COOKIE = 'token';

// Lee el token de la cookie HttpOnly o, si no está, del header Authorization: Bearer
function getToken(req) {
  if (req.cookies?.[AUTH_COOKIE]) return req.cookies[AUTH_COOKIE];
  const header = req.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

export function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!token) return next(HttpError.unauthorized('Tenés que iniciar sesión'));

  try {
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
    req.user = { id: Number(payload.sub) };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(HttpError.unauthorized('La sesión venció, volvé a iniciar sesión', 'TOKEN_EXPIRED'));
    }
    next(HttpError.unauthorized('Token inválido', 'INVALID_TOKEN'));
  }
}
