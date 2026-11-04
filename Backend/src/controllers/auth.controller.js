import { env } from '../config/env.js';
import { AUTH_COOKIE } from '../middlewares/auth.js';
import * as authService from '../services/auth.service.js';
import * as usersService from '../services/users.service.js';
import { HttpError } from '../utils/HttpError.js';

// Front y back están en dominios distintos en producción: la cookie tiene que ser
// SameSite=None y Secure. En local (http) se usa Lax, porque Secure no anda sin https.
const cookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? 'none' : 'lax',
  path: '/',
};

function sendSession(res, status, user) {
  const { token, expiresAt } = authService.signToken(user.id);
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions, expires: expiresAt });
  // El token también va en el body, por si el front necesita mandarlo como Bearer
  res.status(status).json({ user, token, expiresAt });
}

export async function register(req, res) {
  const user = await authService.register(req.valid.body);
  sendSession(res, 201, user);
}

export async function login(req, res) {
  const user = await authService.login(req.valid.body);
  sendSession(res, 200, user);
}

export function logout(req, res) {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
  res.status(204).end();
}

export async function me(req, res) {
  const user = await usersService.getById(req.user.id);
  if (!user) {
    // El token es válido pero la cuenta ya no existe
    res.clearCookie(AUTH_COOKIE, cookieOptions);
    throw HttpError.unauthorized('La cuenta ya no existe');
  }
  res.json({ user });
}
