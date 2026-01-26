import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticateUser } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { asyncHandler } from '../middleware/error';
import { createOrderSchema, verifyPaymentSchema } from '../utils/validators';

const router = Router();

// =====================================================
// PAYMENT ROUTES
// =====================================================

/**
 * GET /api/payment/sol-price
 * Get current SOL price in USD
 * (Public endpoint for price display)
 */
router.get(
  '/sol-price',
  asyncHandler(paymentController.getSolPrice.bind(paymentController))
);

/**
 * POST /api/payment/create-order
 * Create a new order with Solana Pay
 * (Requires authentication)
 */
router.post(
  '/create-order',
  authenticateUser,
  validateBody(createOrderSchema),
  asyncHandler(paymentController.createOrder.bind(paymentController))
);

/**
 * POST /api/payment/create
 * Alias for create-order (matches API spec)
 * (Requires authentication)
 */
router.post(
  '/create',
  authenticateUser,
  validateBody(createOrderSchema),
  asyncHandler(paymentController.createOrder.bind(paymentController))
);

/**
 * GET /api/payment/verify/:reference
 * Verify payment status by reference key (path parameter)
 * (Public endpoint for frontend polling)
 */
router.get(
  '/verify/:reference',
  asyncHandler(paymentController.verifyPaymentByPath.bind(paymentController))
);

/**
 * GET /api/payment/verify
 * Verify payment status by reference key (query parameter)
 * (Requires authentication)
 */
router.get(
  '/verify',
  authenticateUser,
  validateQuery(verifyPaymentSchema),
  asyncHandler(paymentController.verifyPayment.bind(paymentController))
);

// =====================================================
// ORDER ROUTES
// =====================================================

/**
 * GET /api/orders
 * Get user's orders
 */
router.get(
  '/orders',
  authenticateUser,
  asyncHandler(paymentController.getUserOrders.bind(paymentController))
);

/**
 * GET /api/orders/:id
 * Get order details
 */
router.get(
  '/orders/:id',
  authenticateUser,
  asyncHandler(paymentController.getOrder.bind(paymentController))
);

export default router;
