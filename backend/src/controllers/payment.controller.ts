import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, BadRequestError } from '../utils/errors';
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
   * Verify payment status by path parameter (public endpoint)
   * GET /api/payment/verify/:reference
   */
  async verifyPaymentByPath(req: Request, res: Response): Promise<void> {
    const { reference } = req.params;
    
    // Validate reference parameter exists and has valid format (Solana public key base58)
    if (!reference || reference.length < 32 || reference.length > 44) {
      throw new BadRequestError('Invalid reference key format');
    }
    
    // Solana public key base58 character validation
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (!base58Regex.test(reference)) {
      throw new BadRequestError('Invalid reference key format');
    }
    
    const result = await paymentService.verifyPayment(reference);

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
