import { Response } from 'express';
import { paymentService } from '../services/payment.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess } from '../utils/errors';
import { CreateOrderInput, VerifyPaymentInput } from '../utils/validators';

export class PaymentController {
  /**
   * Create a new order with Solana Pay
   * POST /api/payment/create-order
   */
  async createOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { items } = req.body as CreateOrderInput;
    
    const order = await paymentService.createOrder(userId, items);

    sendSuccess(res, order, 201);
  }

  /**
   * Verify payment status
   * GET /api/payment/verify?reference_key=xxx
   */
  async verifyPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { reference_key } = req.query as VerifyPaymentInput;
    
    const result = await paymentService.verifyPayment(reference_key);

    sendSuccess(res, result);
  }

  /**
   * Get order details
   * GET /api/orders/:id
   */
  async getOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { id } = req.params;
    
    const order = await paymentService.getOrder(id, userId);

    sendSuccess(res, { order });
  }

  /**
   * Get user's orders
   * GET /api/orders
   */
  async getUserOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    
    const orders = await paymentService.getUserOrders(userId);

    sendSuccess(res, { orders });
  }

  /**
   * Get current SOL price
   * GET /api/payment/sol-price
   */
  async getSolPrice(req: AuthenticatedRequest, res: Response): Promise<void> {
    const price = await paymentService.getSolPrice();

    sendSuccess(res, { 
      sol_price_usd: price,
      timestamp: new Date().toISOString(),
    });
  }
}

export const paymentController = new PaymentController();
