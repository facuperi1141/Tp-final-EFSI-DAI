import { Router } from 'express';
import * as misc from '../controllers/misc.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  activityQuery,
  chartQuery,
  externalDetailParams,
  searchQuery,
  wrappedQuery,
} from '../validators/misc.validators.js';

export const activityRouter = Router();
activityRouter.get('/', validate({ query: activityQuery }), misc.activity);

export const statsRouter = Router();
statsRouter.get('/', misc.stats);
statsRouter.get('/wrapped', validate({ query: wrappedQuery }), misc.wrapped);

// Proxy a Deezer
export const searchRouter = Router();
searchRouter.get('/', validate({ query: searchQuery }), misc.search);
searchRouter.get('/chart', validate({ query: chartQuery }), misc.chart);
searchRouter.get('/:type/:externalId', validate({ params: externalDetailParams }), misc.externalDetail);
