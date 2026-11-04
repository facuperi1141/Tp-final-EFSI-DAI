import { pool, query, withTransaction } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';
import { logActivity } from '../utils/logActivity.js';
import { findByExternal, upsertContent } from './contents.service.js';

// Cada item de la biblioteca sale con su contenido anidado en "content"
const ITEM_SELECT = `
  SELECT li.id, li.status, li.is_favorite, li.rating, li.added_at, li.updated_at,
         to_jsonb(c) AS content
  FROM library_items li
  JOIN contents c ON c.id = li.content_id`;

// El orden viene de una lista cerrada, nunca del texto que manda el cliente
const SORTS = {
  recent: 'li.added_at DESC',
  oldest: 'li.added_at ASC',
  updated: 'li.updated_at DESC',
  title: 'lower(c.title) ASC',
  artist: 'lower(c.artist_name) ASC NULLS LAST, lower(c.title) ASC',
  rating: 'li.rating DESC NULLS LAST, li.added_at DESC',
};

export async function list(userId, { status, favorite, type, q, sort, limit, offset }) {
  const params = [userId];
  const where = ['li.user_id = $1'];

  if (status) {
    params.push(status);
    where.push(`li.status = $${params.length}`);
  }
  if (favorite !== undefined) {
    params.push(favorite);
    where.push(`li.is_favorite = $${params.length}`);
  }
  if (type) {
    params.push(type);
    where.push(`c.type = $${params.length}`);
  }
  if (q) {
    // Se escapan % y _ para que se busquen como texto y no como comodines de ILIKE
    params.push(`%${q.replace(/[\\%_]/g, '\\$&')}%`);
    const p = `$${params.length}`;
    where.push(`(c.title ILIKE ${p} OR c.artist_name ILIKE ${p} OR c.album_name ILIKE ${p})`);
  }

  const whereSql = where.join(' AND ');
  const [{ rows: items }, { rows: count }] = await Promise.all([
    query(
      `${ITEM_SELECT}
       WHERE ${whereSql}
       ORDER BY ${SORTS[sort]}, li.id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    ),
    query(
      `SELECT count(*)::int AS total
       FROM library_items li JOIN contents c ON c.id = li.content_id
       WHERE ${whereSql}`,
      params,
    ),
  ]);

  return { items, total: count[0].total, limit, offset };
}

async function getItem(client, userId, itemId) {
  const { rows } = await client.query(`${ITEM_SELECT} WHERE li.id = $1 AND li.user_id = $2`, [itemId, userId]);
  return rows[0] ?? null;
}

export async function add(userId, { content, status, is_favorite, rating }) {
  return withTransaction(async (client) => {
    const saved = await upsertContent(client, content);

    const { rows } = await client.query(
      `INSERT INTO library_items (user_id, content_id, status, is_favorite, rating)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, content_id) DO NOTHING
       RETURNING id`,
      [userId, saved.id, status, is_favorite, rating],
    );
    if (!rows[0]) throw HttpError.conflict('Ya está en tu biblioteca', 'ALREADY_IN_LIBRARY');

    const meta = { title: saved.title, artist: saved.artist_name };
    await logActivity(client, userId, 'added', { contentId: saved.id, metadata: { ...meta, status } });
    if (is_favorite) await logActivity(client, userId, 'favorited', { contentId: saved.id, metadata: meta });
    if (rating) await logActivity(client, userId, 'rated', { contentId: saved.id, metadata: { ...meta, rating } });

    return getItem(client, userId, rows[0].id);
  });
}

export async function update(userId, itemId, changes) {
  return withTransaction(async (client) => {
    // FOR UPDATE bloquea la fila para que dos cambios simultáneos no se pisen
    const { rows } = await client.query(
      `SELECT li.*, c.title, c.artist_name
       FROM library_items li JOIN contents c ON c.id = li.content_id
       WHERE li.id = $1 AND li.user_id = $2
       FOR UPDATE OF li`,
      [itemId, userId],
    );
    const current = rows[0];
    // Si el item es de otro usuario también da 404, así no se revela que existe
    if (!current) throw HttpError.notFound('No está en tu biblioteca');

    const next = { ...current, ...changes };
    await client.query(
      'UPDATE library_items SET status = $1, is_favorite = $2, rating = $3 WHERE id = $4',
      [next.status, next.is_favorite, next.rating, itemId],
    );

    const contentId = current.content_id;
    const meta = { title: current.title, artist: current.artist_name };
    if (next.status !== current.status) {
      await logActivity(client, userId, 'status_changed', {
        contentId,
        metadata: { ...meta, from: current.status, to: next.status },
      });
    }
    if (next.is_favorite !== current.is_favorite) {
      await logActivity(client, userId, next.is_favorite ? 'favorited' : 'unfavorited', { contentId, metadata: meta });
    }
    if (next.rating !== current.rating) {
      await logActivity(client, userId, 'rated', { contentId, metadata: { ...meta, rating: next.rating } });
    }

    return getItem(client, userId, itemId);
  });
}

export async function remove(userId, itemId) {
  await withTransaction(async (client) => {
    const { rows } = await client.query(
      `DELETE FROM library_items li
       USING contents c
       WHERE li.id = $1 AND li.user_id = $2 AND c.id = li.content_id
       RETURNING li.content_id, c.title, c.artist_name`,
      [itemId, userId],
    );
    if (!rows[0]) throw HttpError.notFound('No está en tu biblioteca');
    await logActivity(client, userId, 'removed', {
      contentId: rows[0].content_id,
      metadata: { title: rows[0].title, artist: rows[0].artist_name },
    });
  });
}

// Para el Detalle: el contenido (si alguien ya lo guardó), el item del usuario y su reseña
export async function getByExternal(userId, source, externalId) {
  const content = await findByExternal(pool, source, externalId);
  if (!content) return { content: null, item: null, review: null };

  const [{ rows: items }, { rows: reviews }] = await Promise.all([
    query(`${ITEM_SELECT} WHERE li.user_id = $1 AND li.content_id = $2`, [userId, content.id]),
    query('SELECT id, body, created_at, updated_at FROM reviews WHERE user_id = $1 AND content_id = $2', [
      userId,
      content.id,
    ]),
  ]);
  return { content, item: items[0] ?? null, review: reviews[0] ?? null };
}
