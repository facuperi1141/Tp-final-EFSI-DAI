import { Router } from 'express';
import * as collections from '../controllers/collections.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  addItemBody,
  createCollectionBody,
  itemParams,
  updateCollectionBody,
} from '../validators/collections.validators.js';
import { idParams } from '../validators/common.js';

const router = Router();

router.get('/', collections.list);
router.post('/', validate({ body: createCollectionBody }), collections.create);
router.get('/:id', validate({ params: idParams }), collections.get);
router.patch('/:id', validate({ params: idParams, body: updateCollectionBody }), collections.update);
router.delete('/:id', validate({ params: idParams }), collections.remove);
router.post('/:id/items', validate({ params: idParams, body: addItemBody }), collections.addItem);
router.delete('/:id/items/:contentId', validate({ params: itemParams }), collections.removeItem);

export default router;
