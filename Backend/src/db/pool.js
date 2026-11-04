import pg from 'pg';
import { env } from '../config/env.js';

export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  // ssl: true cifra la conexión y verifica el certificado del servidor (Neon tiene uno válido)
  ssl: env.databaseSsl,
  max: 10,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de Postgres', err);
});

export const query = (text, params) => pool.query(text, params);

// Corre fn(client) dentro de BEGIN/COMMIT; si algo falla hace ROLLBACK y relanza el error
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
