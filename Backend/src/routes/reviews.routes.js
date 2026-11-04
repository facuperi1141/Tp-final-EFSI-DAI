import { Router } from 'express';
import * as reviews from '../controllers/reviews.controller.js';
import { validate } from '../middlewares/validate.js';
import { idParams } from '../validators/common.js';
import { createReviewBody, updateReviewBody } from '../validators/reviews.validators.js';

const router = Router();

router.get('/me', reviews.listMine);
router.post('/', validate({ body: createReviewBody }), reviews.create);
router.patch('/:id', validate({ params: idParams, body: updateReviewBody }), reviews.update);
router.delete('/:id', validate({ params: idParams }), reviews.remove);

// /api/contents/:id/reviews
export const contentsRouter = Router();
contentsRouter.get('/:id/reviews', validate({ params: idParams }), reviews.listByContent);

export default router;
