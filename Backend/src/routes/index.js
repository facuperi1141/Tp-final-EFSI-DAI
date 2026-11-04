import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import authRoutes from './auth.routes.js';
import collectionsRoutes from './collections.routes.js';
import healthRoutes from './health.routes.js';
import libraryRoutes, { favoritesRouter } from './library.routes.js';
import { activityRouter, searchRouter, statsRouter } from './misc.routes.js';
import reviewsRoutes, { contentsRouter } from './reviews.routes.js';
import usersRoutes from './users.routes.js';

const router = Router();

// Públicas
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// Privadas: todo lo que sigue necesita sesión
router.use(requireAuth);
router.use('/users', usersRoutes);
router.use('/library', libraryRoutes);
router.use('/favorites', favoritesRouter);
router.use('/reviews', reviewsRoutes);
router.use('/contents', contentsRouter);
router.use('/collections', collectionsRoutes);
router.use('/activity', activityRouter);
router.use('/stats', statsRouter);
router.use('/search', searchRouter);

export default router;
