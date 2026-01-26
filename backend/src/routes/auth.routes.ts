import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateUser } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../middleware/error';
import { 
  registerUserSchema, 
  loginSchema
} from '../utils/validators';

const router = Router();

// =====================================================
// PUBLIC ROUTES
// =====================================================

/**
 * POST /api/auth/register
 * Register a new customer
 */
router.post(
  '/register',
  validateBody(registerUserSchema),
  asyncHandler(authController.register.bind(authController))
);

/**
 * POST /api/auth/login
 * Login user (customer or admin)
 */
router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(authController.login.bind(authController))
);

// =====================================================
// PROTECTED ROUTES
// =====================================================

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get(
  '/me',
  authenticateUser,
  asyncHandler(authController.getProfile.bind(authController))
);

export default router;
