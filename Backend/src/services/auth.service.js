import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query, withTransaction } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';
import { USER_COLUMNS } from './users.service.js';

const BCRYPT_COST = 10;

// Hash para comparar cuando el email no existe, así el login tarda lo mismo
// exista o no la cuenta y no se puede averiguar qué emails están registrados
const DUMMY_HASH = bcrypt.hashSync('dummy-password', BCRYPT_COST);

export function signToken(userId) {
  const token = jwt.sign({ sub: String(userId) }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    algorithm: 'HS256',
  });
  const { exp } = jwt.decode(token);
  return { token, expiresAt: new Date(exp * 1000) };
}

export async function register({ username, email, password }) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  try {
    return await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO users (username, email, password_hash, display_name)
         VALUES ($1, $2, $3, $1)
         RETURNING ${USER_COLUMNS}`,
        [username, email, passwordHash],
      );
      const user = rows[0];
      await client.query('INSERT INTO user_preferences (user_id) VALUES ($1)', [user.id]);
      return user;
    });
  } catch (err) {
    if (err.code === '23505') {
      if (err.constraint === 'users_email_key') {
        throw HttpError.conflict('Ya hay una cuenta con ese email', 'EMAIL_TAKEN');
      }
      if (err.constraint === 'users_username_key') {
        throw HttpError.conflict('Ese nombre de usuario ya está en uso', 'USERNAME_TAKEN');
      }
    }
    throw err;
  }
}

export async function login({ email, password }) {
  const { rows } = await query(
    `SELECT ${USER_COLUMNS}, password_hash FROM users WHERE email = $1`,
    [email],
  );
  const found = rows[0];
  const ok = await bcrypt.compare(password, found?.password_hash ?? DUMMY_HASH);

  if (!found || !ok) {
    throw HttpError.unauthorized('Email o contraseña incorrectos', 'INVALID_CREDENTIALS');
  }

  const { password_hash: _omit, ...user } = found;
  return user;
}
