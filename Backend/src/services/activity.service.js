import { query } from '../db/pool.js';

export async function list(userId, { limit, offset }) {
  const { rows } = await query(
    `SELECT a.id, a.type, a.metadata, a.created_at,
            CASE WHEN c.id IS NULL THEN NULL ELSE
              json_build_object('id', c.id, 'source', c.source, 'external_id', c.external_id, 'type', c.type,
                                'title', c.title, 'artist_name', c.artist_name, 'cover_url', c.cover_url)
            END AS content,
            CASE WHEN col.id IS NULL THEN NULL ELSE
              json_build_object('id', col.id, 'name', col.name)
            END AS collection
     FROM activities a
     LEFT JOIN contents c ON c.id = a.content_id
     LEFT JOIN collections col ON col.id = a.collection_id
     WHERE a.user_id = $1
     ORDER BY a.created_at DESC, a.id DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  return rows;
}
