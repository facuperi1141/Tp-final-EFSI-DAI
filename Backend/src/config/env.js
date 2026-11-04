import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Faltan variables de entorno: ${missing.join(', ')}`);
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET tiene que tener al menos 32 caracteres');
  process.exit(1);
}

// Formato que entiende jsonwebtoken: número de segundos o número con unidad (15m, 12h, 7d)
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
if (!/^\d+\s*(s|m|h|d|w|y)?$/.test(jwtExpiresIn)) {
  console.error('JWT_EXPIRES_IN inválido. Ejemplos: 3600, 12h, 7d');
  process.exit(1);
}

const nodeEnv = process.env.NODE_ENV || 'development';

export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv,
  isProduction: nodeEnv === 'production',
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl: process.env.DATABASE_SSL === 'true',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: /^\d+$/.test(jwtExpiresIn) ? Number(jwtExpiresIn) : jwtExpiresIn,
  // Sin la barra final: el navegador manda el origin sin barra y CORS compara texto exacto
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, ''),
  timezone: process.env.APP_TIMEZONE || 'America/Argentina/Buenos_Aires',
};
