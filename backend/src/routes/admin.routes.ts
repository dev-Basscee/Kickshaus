import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { productController } from '../controllers/product.controller';
import { authenticateUser, authorizeAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateUser);
router.use(authorizeAdmin);

// =====================================================
// MERCHANT MANAGEMENT
// =====================================================

/**
 * GET /api/admin/merchants
 * List all merchants (optionally filtered by status)
 */
router.get(
  '/merchants',
  asyncHandler(authController.listMerchants.bind(authController))
);

/**
 * PUT /api/admin/merchants/:id/approve
 * Approve a merchant
 */
router.put(
  '/merchants/:id/approve',
  asyncHandler(async (req, res) => {
    req.body = { status: 'approved' };
    await authController.updateMerchantStatus(req, res);
  })
);

/**
 * PUT /api/admin/merchants/:id/reject
 * Reject a merchant
 */
router.put(
  '/merchants/:id/reject',
  asyncHandler(async (req, res) => {
    req.body = { status: 'rejected' };
    await authController.updateMerchantStatus(req, res);
  })
);

// =====================================================
// PRODUCT MANAGEMENT
// =====================================================

/**
 * GET /api/admin/products/pending
 * Get all products pending approval
 */
router.get(
  '/products/pending',
  asyncHandler(productController.getPendingProducts.bind(productController))
);

/**
 * PUT /api/admin/products/:id/approve
 * Approve a product
 */
router.put(
  '/products/:id/approve',
  asyncHandler(productController.approveProduct.bind(productController))
);

/**
 * PUT /api/admin/products/:id/reject
 * Reject a product
 */
router.put(
  '/products/:id/reject',
  asyncHandler(productController.rejectProduct.bind(productController))
);

export default router;
