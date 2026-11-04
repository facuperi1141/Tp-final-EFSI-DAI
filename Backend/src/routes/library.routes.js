import { Router } from 'express';
import * as library from '../controllers/library.controller.js';
import { validate } from '../middlewares/validate.js';
import { idParams } from '../validators/common.js';
import {
  addLibraryBody,
  byExternalParams,
  listLibraryQuery,
  updateLibraryBody,
} from '../validators/library.validators.js';

const router = Router();

router.get('/', validate({ query: listLibraryQuery }), library.list);
router.post('/', validate({ body: addLibraryBody }), library.add);
router.get('/by-external/:source/:externalId', validate({ params: byExternalParams }), library.getByExternal);
router.patch('/:id', validate({ params: idParams, body: updateLibraryBody }), library.update);
router.delete('/:id', validate({ params: idParams }), library.remove);

// /api/favorites: la misma lista, filtrada por is_favorite
export const favoritesRouter = Router();
favoritesRouter.get('/', validate({ query: listLibraryQuery.omit({ favorite: true }) }), library.favorites);

export default router;
