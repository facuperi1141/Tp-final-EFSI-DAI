import { query, withTransaction } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';
import { logActivity } from '../utils/logActivity.js';
import { resolveContent } from './contents.service.js';

const REVIEW_SELECT = `
  SELECT r.id, r.body, r.created_at, r.updated_at, to_jsonb(c) AS content
  FROM reviews r
  JOIN contents c ON c.id = r.content_id`;

export async function listMine(userId) {
  const { rows } = await query(`${REVIEW_SELECT} WHERE r.user_id = $1 ORDER BY r.updated_at DESC`, [userId]);
  return rows;
}

// Reseñas de un contenido: las propias y las de usuarios con perfil público.
// Las de perfiles privados no se muestran, así cada cuenta mantiene sus datos separados.
export async function listByContent(userId, contentId) {
  const { rows } = await query(
    `SELECT r.id, r.body, r.created_at, r.updated_at,
            (r.user_id = $1) AS is_mine,
            json_build_object('username', u.username, 'display_name', u.display_name, 'avatar_url', u.avatar_url) AS author,
            li.rating
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     LEFT JOIN user_preferences p ON p.user_id = r.user_id
     LEFT JOIN library_items li ON li.user_id = r.user_id AND li.content_id = r.content_id
     WHERE r.content_id = $2 AND (r.user_id = $1 OR p.is_public)
     ORDER BY is_mine DESC, r.updated_at DESC`,
    [userId, contentId],
  );
  return rows;
}

async function getOne(client, userId, reviewId) {
  const { rows } = await client.query(`${REVIEW_SELECT} WHERE r.id = $1 AND r.user_id = $2`, [reviewId, userId]);
  return rows[0] ?? null;
}

export async function create(userId, { content, content_id, body }) {
  return withTransaction(async (client) => {
    const saved = await resolveContent(client, { content, content_id });
    const { rows } = await client.query(
      `INSERT INTO reviews (user_id, content_id, body)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, content_id) DO NOTHING
       RETURNING id`,
      [userId, saved.id, body],
    );
    if (!rows[0]) throw HttpError.conflict('Ya escribiste una reseña de este contenido', 'REVIEW_EXISTS');

    await logActivity(client, userId, 'reviewed', {
      contentId: saved.id,
      metadata: { title: saved.title, artist: saved.artist_name, excerpt: body.slice(0, 120) },
    });
    return getOne(client, userId, rows[0].id);
  });
}

export async function update(userId, reviewId, { body }) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE reviews r SET body = $1
       FROM contents c
       WHERE r.id = $2 AND r.user_id = $3 AND c.id = r.content_id
       RETURNING r.content_id, c.title, c.artist_name`,
      [body, reviewId, userId],
    );
    if (!rows[0]) throw HttpError.notFound('Reseña no encontrada');

    await logActivity(client, userId, 'review_updated', {
      contentId: rows[0].content_id,
      metadata: { title: rows[0].title, artist: rows[0].artist_name, excerpt: body.slice(0, 120) },
    });
    return getOne(client, userId, reviewId);
  });
}

export async function remove(userId, reviewId) {
  await withTransaction(async (client) => {
    const { rows } = await client.query(
      `DELETE FROM reviews r
       USING contents c
       WHERE r.id = $1 AND r.user_id = $2 AND c.id = r.content_id
       RETURNING r.content_id, c.title, c.artist_name`,
      [reviewId, userId],
    );
    if (!rows[0]) throw HttpError.notFound('Reseña no encontrada');

    await logActivity(client, userId, 'review_deleted', {
      contentId: rows[0].content_id,
      metadata: { title: rows[0].title, artist: rows[0].artist_name },
    });
  });
}
