import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error';

// Create Express app
const app = express();

// =====================================================
// SECURITY MIDDLEWARE
// =====================================================

// Helmet for security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// =====================================================
// BODY PARSING
// =====================================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =====================================================
// ROUTES
// =====================================================

// Mount API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Kickshaus API',
      version: '1.0.0',
      description: 'Production-ready REST API for Kickshaus e-commerce platform',
      documentation: '/api/docs',
      health: '/api/health',
    },
  });
});

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler
app.use(notFoundHandler);

// Central error handler
app.use(errorHandler);

// =====================================================
// SERVER STARTUP
// =====================================================

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║   🚀 Kickshaus API Server                          ║
║                                                    ║
║   Environment: ${config.nodeEnv.padEnd(33)}║
║   Port: ${PORT.toString().padEnd(40)}║
║   URL: http://localhost:${PORT.toString().padEnd(25)}║
║                                                    ║
╚════════════════════════════════════════════════════╝
  `);
  
  if (config.isDevelopment) {
    console.log('📚 API Endpoints:');
    console.log('   GET  /api/health          - Health check');
    console.log('   POST /api/auth/register   - Register customer');
    console.log('   POST /api/auth/login      - Login user/admin');
    console.log('   POST /api/merchants/register - Register merchant');
    console.log('   POST /api/merchants/login - Login merchant');
    console.log('   GET  /api/products        - List products');
    console.log('   POST /api/cart/validate   - Validate cart');
    console.log('   POST /api/payment/create-order - Create order');
    console.log('   GET  /api/payment/verify  - Verify payment');
    console.log('');
  }
});

export default app;
