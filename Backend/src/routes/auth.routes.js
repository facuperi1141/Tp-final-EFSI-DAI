import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { loginBody, registerBody } from '../validators/auth.validators.js';

const router = Router();

router.post('/register', validate({ body: registerBody }), auth.register);
router.post('/login', validate({ body: loginBody }), auth.login);
// Sin requireAuth: si el token ya venció, igual tiene que poder borrar la cookie
router.post('/logout', auth.logout);
router.get('/me', requireAuth, auth.me);

export default router;
