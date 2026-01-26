import { Router } from 'express';
import authRoutes from './auth.routes';
import merchantRoutes from './merchant.routes';
import productRoutes from './product.routes';
import adminRoutes from './admin.routes';
import cartRoutes from './cart.routes';
import paymentRoutes from './payment.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/merchants', merchantRoutes); // Registration, login, and merchant-only operations
router.use('/products', productRoutes);
router.use('/admin', adminRoutes);
router.use('/cart', cartRoutes);
router.use('/payment', paymentRoutes);

export default router;
