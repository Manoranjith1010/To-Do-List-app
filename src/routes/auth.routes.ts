import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/async-handler';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));

export default router;
