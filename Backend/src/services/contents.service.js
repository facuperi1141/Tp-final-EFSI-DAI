import { HttpError } from '../utils/HttpError.js';

// Guarda (o reutiliza) un contenido de la API externa en la caché y devuelve su fila.
// Si ya existía, solo completa los campos que estaban vacíos: así un usuario no puede
// pisar los datos que ven los demás.
export async function upsertContent(client, content) {
  const { rows } = await client.query(
    `INSERT INTO contents
       (source, external_id, type, title, artist_name, album_name, cover_url, duration_ms, release_year, genres)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (source, external_id) DO UPDATE SET
       artist_name  = COALESCE(contents.artist_name, EXCLUDED.artist_name),
       album_name   = COALESCE(contents.album_name, EXCLUDED.album_name),
       cover_url    = COALESCE(contents.cover_url, EXCLUDED.cover_url),
       duration_ms  = COALESCE(contents.duration_ms, EXCLUDED.duration_ms),
       release_year = COALESCE(contents.release_year, EXCLUDED.release_year),
       genres       = CASE WHEN cardinality(contents.genres) = 0 THEN EXCLUDED.genres ELSE contents.genres END
     RETURNING *`,
    [
      content.source,
      content.external_id,
      content.type,
      content.title,
      content.artist_name ?? null,
      content.album_name ?? null,
      content.cover_url ?? null,
      content.duration_ms ?? null,
      content.release_year ?? null,
      content.genres ?? [],
    ],
  );
  return rows[0];
}

// Resuelve { content } o { content_id } a una fila de contents
export async function resolveContent(client, { content, content_id }) {
  if (content) return upsertContent(client, content);

  const { rows } = await client.query('SELECT * FROM contents WHERE id = $1', [content_id]);
  if (!rows[0]) throw HttpError.notFound('Contenido no encontrado');
  return rows[0];
}

export async function findByExternal(client, source, externalId) {
  const { rows } = await client.query(
    'SELECT * FROM contents WHERE source = $1 AND external_id = $2',
    [source, externalId],
  );
  return rows[0] ?? null;
}
