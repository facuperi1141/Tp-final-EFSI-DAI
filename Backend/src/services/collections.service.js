import { pool, query, withTransaction } from '../db/pool.js';
import { HttpError } from '../utils/HttpError.js';
import { logActivity } from '../utils/logActivity.js';
import { resolveContent } from './contents.service.js';

const COLLECTION_COLUMNS = 'id, name, description, cover_url, created_at, updated_at';

function duplicateName(err) {
  if (err.code === '23505' && err.constraint === 'collections_user_name_key') {
    return HttpError.conflict('Ya tenés una playlist con ese nombre', 'COLLECTION_NAME_TAKEN');
  }
  return err;
}

// Trae la playlist solo si es del usuario. Si es de otro, se comporta como si no existiera.
async function getOwned(client, userId, collectionId, { lock = false } = {}) {
  const { rows } = await client.query(
    `SELECT ${COLLECTION_COLUMNS} FROM collections WHERE id = $1 AND user_id = $2 ${lock ? 'FOR UPDATE' : ''}`,
    [collectionId, userId],
  );
  if (!rows[0]) throw HttpError.notFound('Playlist no encontrada');
  return rows[0];
}

export async function list(userId) {
  // item_count y hasta 4 portadas, para armar el mosaico en el front
  const { rows } = await query(
    `SELECT col.id, col.name, col.description, col.cover_url, col.created_at, col.updated_at,
            count(ci.content_id)::int AS item_count,
            (array_remove(array_agg(c.cover_url ORDER BY ci.position), NULL))[1:4] AS covers
     FROM collections col
     LEFT JOIN collection_items ci ON ci.collection_id = col.id
     LEFT JOIN contents c ON c.id = ci.content_id
     WHERE col.user_id = $1
     GROUP BY col.id
     ORDER BY col.updated_at DESC`,
    [userId],
  );
  return rows;
}

export async function getWithItems(userId, collectionId) {
  const collection = await getOwned(pool, userId, collectionId);
  const { rows: items } = await query(
    `SELECT ci.position, ci.added_at, to_jsonb(c) AS content
     FROM collection_items ci
     JOIN contents c ON c.id = ci.content_id
     WHERE ci.collection_id = $1
     ORDER BY ci.position`,
    [collectionId],
  );
  return { ...collection, item_count: items.length, items };
}

export async function create(userId, { name, description, cover_url }) {
  try {
    return await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO collections (user_id, name, description, cover_url)
         VALUES ($1, $2, $3, $4)
         RETURNING ${COLLECTION_COLUMNS}`,
        [userId, name, description ?? null, cover_url ?? null],
      );
      await logActivity(client, userId, 'collection_created', { collectionId: rows[0].id, metadata: { name } });
      return { ...rows[0], item_count: 0, items: [] };
    });
  } catch (err) {
    throw duplicateName(err);
  }
}

export async function update(userId, collectionId, fields) {
  try {
    return await withTransaction(async (client) => {
      const current = await getOwned(client, userId, collectionId, { lock: true });
      const next = { ...current, ...fields };
      const { rows } = await client.query(
        `UPDATE collections SET name = $1, description = $2, cover_url = $3
         WHERE id = $4
         RETURNING ${COLLECTION_COLUMNS}`,
        [next.name, next.description, next.cover_url, collectionId],
      );
      await logActivity(client, userId, 'collection_updated', {
        collectionId,
        metadata: { name: next.name, previous_name: current.name !== next.name ? current.name : undefined },
      });
      return rows[0];
    });
  } catch (err) {
    throw duplicateName(err);
  }
}

export async function remove(userId, collectionId) {
  await withTransaction(async (client) => {
    const { rows } = await client.query(
      'DELETE FROM collections WHERE id = $1 AND user_id = $2 RETURNING name',
      [collectionId, userId],
    );
    if (!rows[0]) throw HttpError.notFound('Playlist no encontrada');
    // La playlist ya no existe: el nombre queda guardado en metadata
    await logActivity(client, userId, 'collection_deleted', { metadata: { name: rows[0].name } });
  });
}

export async function addItem(userId, collectionId, ref) {
  return withTransaction(async (client) => {
    // Bloquear la playlist evita que dos agregados simultáneos tomen la misma posición
    const collection = await getOwned(client, userId, collectionId, { lock: true });
    const content = await resolveContent(client, ref);

    const { rows } = await client.query(
      `INSERT INTO collection_items (collection_id, content_id, position)
       VALUES ($1, $2, (SELECT COALESCE(max(position), 0) + 1 FROM collection_items WHERE collection_id = $1))
       ON CONFLICT (collection_id, content_id) DO NOTHING
       RETURNING position, added_at`,
      [collectionId, content.id],
    );
    if (!rows[0]) throw HttpError.conflict('Ya está en esta playlist', 'ALREADY_IN_COLLECTION');

    // Así la playlist sube al principio de la lista
    await client.query('UPDATE collections SET updated_at = now() WHERE id = $1', [collectionId]);
    await logActivity(client, userId, 'collection_item_added', {
      contentId: content.id,
      collectionId,
      metadata: { name: collection.name, title: content.title, artist: content.artist_name },
    });
    return { ...rows[0], content };
  });
}

export async function removeItem(userId, collectionId, contentId) {
  await withTransaction(async (client) => {
    const collection = await getOwned(client, userId, collectionId, { lock: true });
    const { rows } = await client.query(
      `DELETE FROM collection_items ci
       USING contents c
       WHERE ci.collection_id = $1 AND ci.content_id = $2 AND c.id = ci.content_id
       RETURNING c.title, c.artist_name`,
      [collectionId, contentId],
    );
    if (!rows[0]) throw HttpError.notFound('Ese contenido no está en la playlist');

    await client.query('UPDATE collections SET updated_at = now() WHERE id = $1', [collectionId]);
    await logActivity(client, userId, 'collection_item_removed', {
      contentId,
      collectionId,
      metadata: { name: collection.name, title: rows[0].title, artist: rows[0].artist_name },
    });
  });
}
