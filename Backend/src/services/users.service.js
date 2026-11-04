import { query } from '../db/pool.js';

// Columnas que se pueden mostrar. password_hash nunca sale de acá.
export const USER_COLUMNS = 'id, username, email, display_name, bio, avatar_url, created_at, updated_at';

const PREFERENCES_COLUMNS = 'favorite_genres, language, is_public, yearly_goal, updated_at';

export async function getById(userId) {
  const { rows } = await query(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [userId]);
  return rows[0] ?? null;
}

export async function updateProfile(userId, fields) {
  // Solo se actualizan las columnas que vinieron en el body (ya validado)
  const allowed = ['display_name', 'bio', 'avatar_url'];
  const keys = allowed.filter((key) => key in fields);
  const sets = keys.map((key, i) => `${key} = $${i + 2}`);

  const { rows } = await query(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $1 RETURNING ${USER_COLUMNS}`,
    [userId, ...keys.map((key) => fields[key])],
  );
  return rows[0];
}

export async function getPreferences(userId) {
  const { rows } = await query(
    `SELECT ${PREFERENCES_COLUMNS} FROM user_preferences WHERE user_id = $1`,
    [userId],
  );
  return rows[0];
}

export async function replacePreferences(userId, { favorite_genres, language, is_public, yearly_goal }) {
  const { rows } = await query(
    `INSERT INTO user_preferences (user_id, favorite_genres, language, is_public, yearly_goal)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE
       SET favorite_genres = EXCLUDED.favorite_genres,
           language = EXCLUDED.language,
           is_public = EXCLUDED.is_public,
           yearly_goal = EXCLUDED.yearly_goal
     RETURNING ${PREFERENCES_COLUMNS}`,
    [userId, favorite_genres, language, is_public, yearly_goal],
  );
  return rows[0];
}
