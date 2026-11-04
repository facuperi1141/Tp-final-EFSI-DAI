// Registra una actividad. Se llama con el mismo client de la transacción del cambio,
// así nunca queda una actividad de algo que no se guardó.
export async function logActivity(client, userId, type, { contentId = null, collectionId = null, metadata = {} } = {}) {
  await client.query(
    `INSERT INTO activities (user_id, type, content_id, collection_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, type, contentId, collectionId, metadata],
  );
}
