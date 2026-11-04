import { Router } from 'express';
import * as users from '../controllers/users.controller.js';
import { validate } from '../middlewares/validate.js';
import { preferencesBody, updateProfileBody } from '../validators/users.validators.js';

const router = Router();

router.get('/me', users.getMe);
router.patch('/me', validate({ body: updateProfileBody }), users.updateMe);
router.get('/me/preferences', users.getPreferences);
router.put('/me/preferences', validate({ body: preferencesBody }), users.replacePreferences);

export default router;
