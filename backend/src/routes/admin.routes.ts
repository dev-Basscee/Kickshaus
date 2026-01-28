import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { adminController } from '../controllers/admin.controller';
import { authenticateUser, authorizeRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';

const router = Router();

// Protect all admin routes
router.use(authenticateUser);
router.use(authorizeRole('admin'));

// Dashboard Stats
router.get(
  '/stats',
  asyncHandler(adminController.getDashboardStats.bind(adminController))
);

// Merchant Management
router.get(
  '/merchants',
  asyncHandler(authController.listMerchants.bind(authController))
);

router.put(
  '/merchants/:id/status',
  asyncHandler(authController.updateMerchantStatus.bind(authController))
);

export default router;
