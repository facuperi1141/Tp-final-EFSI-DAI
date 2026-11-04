import { env } from '../config/env.js';
import { query } from '../db/pool.js';

// Todo se calcula con SQL en el momento, a partir de lo que el usuario tiene guardado.
// Las fechas se agrupan en la zona horaria de la app (Argentina por defecto), no en UTC.
const TZ = env.timezone;

// "Escuchado" cuenta como terminado; "favorito" también (es un estado posterior a escucharlo)
const LISTENED = "('escuchado', 'favorito')";

const one = async (sql, params) => (await query(sql, params)).rows[0];
const all = async (sql, params) => (await query(sql, params)).rows;

export async function overview(userId) {
  const [totals, byStatus, topArtists, topGenres, ratings, minutes, byMonth, decades, favoriteTracks] =
    await Promise.all([
      one(
        `SELECT
           (SELECT count(*) FROM library_items WHERE user_id = $1)::int AS library,
           (SELECT count(*) FROM library_items WHERE user_id = $1 AND is_favorite)::int AS favorites,
           (SELECT count(*) FROM library_items WHERE user_id = $1 AND rating IS NOT NULL)::int AS ratings,
           (SELECT count(*) FROM reviews WHERE user_id = $1)::int AS reviews,
           (SELECT count(*) FROM collections WHERE user_id = $1)::int AS collections,
           (SELECT count(*) FROM library_items WHERE user_id = $1 AND status IN ${LISTENED})::int AS listened`,
        [userId],
      ),

      // Los 4 estados siempre aparecen, aunque tengan 0
      all(
        `SELECT s.status, count(li.id)::int AS count
         FROM unnest(enum_range(NULL::library_status)) AS s(status)
         LEFT JOIN library_items li ON li.status = s.status AND li.user_id = $1
         GROUP BY s.status
         ORDER BY s.status`,
        [userId],
      ),

      all(
        // Por cantidad en la biblioteca; si empatan, por reproducciones del historial
        `SELECT c.artist_name AS name, count(*)::int AS count,
                COALESCE(sum(h.plays), 0)::int AS plays,
                round(avg(li.rating), 2)::float AS avg_rating,
                (array_agg(c.cover_url ORDER BY li.added_at DESC))[1] AS cover_url
         FROM library_items li
         JOIN contents c ON c.id = li.content_id
         LEFT JOIN (SELECT content_id, count(*) AS plays FROM listening_history
                    WHERE user_id = $1 GROUP BY content_id) h ON h.content_id = li.content_id
         WHERE li.user_id = $1 AND c.artist_name IS NOT NULL
         GROUP BY c.artist_name
         ORDER BY count DESC, plays DESC, name
         LIMIT 5`,
        [userId],
      ),

      all(
        `SELECT g AS name, count(*)::int AS count
         FROM library_items li
         JOIN contents c ON c.id = li.content_id
         CROSS JOIN LATERAL unnest(c.genres) AS g
         WHERE li.user_id = $1
         GROUP BY g
         ORDER BY count DESC, name
         LIMIT 5`,
        [userId],
      ),

      one(
        `SELECT
           (SELECT round(avg(rating), 2)::float FROM library_items WHERE user_id = $1) AS average,
           (SELECT count(rating)::int FROM library_items WHERE user_id = $1) AS count,
           (SELECT json_agg(json_build_object('rating', n, 'count', cnt) ORDER BY n)
            FROM (SELECT n, count(li.id)::int AS cnt
                  FROM generate_series(1, 5) AS n
                  LEFT JOIN library_items li ON li.user_id = $1 AND li.rating = n
                  GROUP BY n) d) AS distribution`,
        [userId],
      ),

      // Con historial real se usa lo escuchado; si no, la duración de lo marcado como escuchado
      one(
        `SELECT CASE WHEN h.plays > 0 THEN 'history' ELSE 'library' END AS source,
                round(CASE WHEN h.plays > 0 THEN h.ms ELSE l.ms END / 60000.0)::int AS minutes
         FROM (SELECT count(*) AS plays, COALESCE(sum(ms_played), 0) AS ms
               FROM listening_history WHERE user_id = $1) h,
              (SELECT COALESCE(sum(c.duration_ms), 0) AS ms
               FROM library_items li JOIN contents c ON c.id = li.content_id
               WHERE li.user_id = $1 AND li.status IN ${LISTENED}) l`,
        [userId],
      ),

      // Últimos 12 meses, con 0 en los meses sin actividad
      all(
        `SELECT to_char(m, 'YYYY-MM') AS month, count(a.id)::int AS count
         FROM generate_series(
                date_trunc('month', now() AT TIME ZONE $2) - interval '11 months',
                date_trunc('month', now() AT TIME ZONE $2),
                interval '1 month') AS m
         LEFT JOIN activities a
           ON a.user_id = $1 AND date_trunc('month', a.created_at AT TIME ZONE $2) = m
         GROUP BY m
         ORDER BY m`,
        [userId, TZ],
      ),

      all(
        `SELECT (c.release_year / 10 * 10)::int AS decade, count(*)::int AS count
         FROM library_items li JOIN contents c ON c.id = li.content_id
         WHERE li.user_id = $1 AND c.release_year IS NOT NULL
         GROUP BY decade
         ORDER BY count DESC, decade DESC`,
        [userId],
      ),

      all(
        `SELECT li.id, li.rating, to_jsonb(c) AS content
         FROM library_items li JOIN contents c ON c.id = li.content_id
         WHERE li.user_id = $1 AND li.is_favorite AND c.type = 'track'
         ORDER BY li.rating DESC NULLS LAST, li.updated_at DESC
         LIMIT 5`,
        [userId],
      ),
    ]);

  const progress = totals.library === 0 ? 0 : Math.round((totals.listened / totals.library) * 100);

  return {
    totals,
    progress_percent: progress,
    by_status: byStatus,
    top_artists: topArtists,
    top_genres: topGenres,
    ratings,
    minutes_listened: minutes,
    activity_by_month: byMonth,
    decades,
    favorite_tracks: favoriteTracks,
  };
}

// Resumen del año, estilo Spotify Wrapped.
// Si hay historial de escucha ese año se usa como fuente; si no, la biblioteca.
export async function wrapped(userId, year) {
  // $2 y $3 son el inicio y el fin del año en la zona horaria de la app
  const range = [userId, `${year}-01-01`, `${year + 1}-01-01`, TZ];
  const inYear = (column) => `${column} >= ($2::timestamp AT TIME ZONE $4) AND ${column} < ($3::timestamp AT TIME ZONE $4)`;

  const { plays } = await one(
    `SELECT count(*)::int AS plays FROM listening_history WHERE user_id = $1 AND ${inYear('played_at')}`,
    range,
  );
  const fromHistory = plays > 0;

  // Fuente de datos según haya historial o no: una fila por contenido con su "peso"
  const source = fromHistory
    ? `SELECT h.content_id, count(*)::int AS plays, sum(h.ms_played)::bigint AS ms
       FROM listening_history h
       WHERE h.user_id = $1 AND ${inYear('h.played_at')}
       GROUP BY h.content_id`
    : `SELECT li.content_id, 1 AS plays, COALESCE(c.duration_ms, 0)::bigint AS ms
       FROM library_items li JOIN contents c ON c.id = li.content_id
       WHERE li.user_id = $1 AND ${inYear('li.added_at')}`;

  const [summary, topArtists, topTracks, topGenres, byMonth, topHour, goal] = await Promise.all([
    one(
      `SELECT
         (SELECT round(COALESCE(sum(ms), 0) / 60000.0)::int FROM (${source}) s) AS minutes_listened,
         (SELECT count(*) FROM (${source}) s)::int AS distinct_contents,
         (SELECT count(*) FROM library_items WHERE user_id = $1 AND ${inYear('added_at')})::int AS items_added,
         (SELECT count(*) FROM reviews WHERE user_id = $1 AND ${inYear('created_at')})::int AS reviews_written,
         (SELECT round(avg(rating), 2)::float FROM library_items
          WHERE user_id = $1 AND rating IS NOT NULL AND ${inYear('added_at')}) AS avg_rating,
         (SELECT count(*) FROM activities WHERE user_id = $1 AND ${inYear('created_at')})::int AS activities`,
      range,
    ),

    all(
      `SELECT c.artist_name AS name, sum(s.plays)::int AS plays,
              round(sum(s.ms) / 60000.0)::int AS minutes,
              (array_agg(c.cover_url ORDER BY s.plays DESC))[1] AS cover_url
       FROM (${source}) s JOIN contents c ON c.id = s.content_id
       WHERE c.artist_name IS NOT NULL
       GROUP BY c.artist_name
       ORDER BY plays DESC, minutes DESC, name
       LIMIT 5`,
      range,
    ),

    all(
      `SELECT s.plays, round(s.ms / 60000.0)::int AS minutes, to_jsonb(c) AS content
       FROM (${source}) s JOIN contents c ON c.id = s.content_id
       LEFT JOIN library_items li ON li.user_id = $1 AND li.content_id = c.id
       WHERE c.type = 'track'
       ORDER BY s.plays DESC, li.rating DESC NULLS LAST, s.ms DESC
       LIMIT 5`,
      range,
    ),

    all(
      `SELECT g AS name, sum(s.plays)::int AS plays
       FROM (${source}) s
       JOIN contents c ON c.id = s.content_id
       CROSS JOIN LATERAL unnest(c.genres) AS g
       GROUP BY g
       ORDER BY plays DESC, name
       LIMIT 5`,
      range,
    ),

    // Actividad de cada mes del año (12 filas)
    all(
      `SELECT to_char(m, 'YYYY-MM') AS month, count(a.id)::int AS count
       FROM generate_series($2::timestamp, $3::timestamp - interval '1 month', interval '1 month') AS m
       LEFT JOIN activities a
         ON a.user_id = $1 AND date_trunc('month', a.created_at AT TIME ZONE $4) = m
       GROUP BY m
       ORDER BY m`,
      range,
    ),

    // Hora del día en la que más escucha (solo con historial)
    fromHistory
      ? one(
          `SELECT extract(hour FROM played_at AT TIME ZONE $4)::int AS hour, count(*)::int AS plays
           FROM listening_history
           WHERE user_id = $1 AND ${inYear('played_at')}
           GROUP BY hour
           ORDER BY plays DESC
           LIMIT 1`,
          range,
        )
      : null,

    // Objetivo anual: contenidos que pasaron a escuchado o favorito durante el año
    one(
      `SELECT p.yearly_goal AS goal,
              (SELECT count(DISTINCT a.content_id)::int FROM activities a
               WHERE a.user_id = $1 AND ${inYear('a.created_at')}
                 AND ((a.type = 'status_changed' AND a.metadata->>'to' IN ${LISTENED})
                   OR (a.type = 'added' AND a.metadata->>'status' IN ${LISTENED}))) AS completed
       FROM (SELECT $1::int AS user_id) u
       LEFT JOIN user_preferences p ON p.user_id = u.user_id`,
      range,
    ),
  ]);

  const mostActive = byMonth.reduce((best, m) => (m.count > (best?.count ?? 0) ? m : best), null);

  return {
    year,
    source: fromHistory ? 'history' : 'library',
    ...summary,
    top_artists: topArtists,
    top_tracks: topTracks,
    top_genres: topGenres,
    activity_by_month: byMonth,
    most_active_month: mostActive,
    top_listening_hour: topHour,
    goal: {
      target: goal.goal,
      completed: goal.completed,
      percent: goal.goal ? Math.min(100, Math.round((goal.completed / goal.goal) * 100)) : null,
    },
  };
}
