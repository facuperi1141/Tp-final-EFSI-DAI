import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import routes from './routes/index.js';
import './validators/common.js'; // registra los mensajes de zod en castellano

const app = express();

// En Render/Railway la app corre detrás de un proxy: hace falta para las cookies Secure
app.set('trust proxy', 1);

app.use(helmet());
// FRONTEND_URL acepta varias URLs separadas por coma (por ejemplo, local y producción)
app.use(cors({ origin: env.frontendUrl.split(',').map((url) => url.trim()), credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(morgan(env.isProduction ? 'combined' : 'dev'));

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
