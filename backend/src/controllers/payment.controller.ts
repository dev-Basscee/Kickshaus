import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { AuthenticatedRequest } from '../types';
import { sendSuccess } from '../utils/errors';
import { CreateOrderInput, VerifyPaymentInput, CreateTransactionInput } from '../utils/validators';

export class PaymentController {
  /**
   * Initialize Paystack payment
   * POST /api/payment/paystack/initialize
   */
  async initializePaystack(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    // We expect the body to contain items and optional delivery info
    // casting to partial CreateOrderInput for better type checking
    const body = req.body as CreateOrderInput & { 
      callback_url?: string;
      // These fields might come from body if not in standard structure
      email?: string;
    };
    
    const items = body.items;
    
    // Prioritize contact_email, fall back to explicit 'email' field, or fail
    const email = body.contact_email || body.email;
    const callbackUrl = body.callback_url || req.headers.referer || 'http://localhost:3000/payment.html';

    if (!email) {
       res.status(400).json({ success: false, error: 'Email is required for Paystack payment' });
       return;
    }

    // Clean delivery object
    const delivery = {
      contact_name: body.contact_name ?? undefined,
      contact_email: email,
      sender_phone: body.sender_phone ?? undefined,
      receiver_phone: body.receiver_phone ?? undefined,
      shipping_address: body.shipping_address ?? undefined,
      city: body.city ?? undefined,
      state: body.state ?? undefined,
      notes: body.notes ?? undefined,
    };

    const result = await paymentService.initializePaystackTransaction(
      userId,
      email,
      items,
      callbackUrl,
      delivery
    );

    sendSuccess(res, result);
  }

  /**
   * Verify Paystack payment
   * GET /api/payment/paystack/verify?reference=xxx
   */
  async verifyPaystack(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { reference } = req.query as { reference: string };
    
    if (!reference) {
      res.status(400).json({ success: false, error: 'Reference is required' });
      return;
    }

    const result = await paymentService.verifyPaystackTransaction(reference);
    sendSuccess(res, result);
  }

  /**
   * Create a new order with Solana Pay
   * POST /api/payment/create-order
   */
  async createOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    // Extract items and the raw delivery fields
    const { items, ...rawDelivery } = req.body as CreateOrderInput;
    
    // FIX: Sanitize input. Convert 'null' to 'undefined' for TypeScript compatibility.
    // The Service expects optional fields (undefined), not nullable ones.
    const delivery = {
      contact_name: rawDelivery.contact_name ?? undefined,
      contact_email: rawDelivery.contact_email ?? undefined,
      sender_phone: rawDelivery.sender_phone ?? undefined,
      receiver_phone: rawDelivery.receiver_phone ?? undefined,
      shipping_address: rawDelivery.shipping_address ?? undefined,
      city: rawDelivery.city ?? undefined,
      state: rawDelivery.state ?? undefined,
      notes: rawDelivery.notes ?? undefined,
    };
    
    const order = await paymentService.createOrder(userId, items, delivery);

    sendSuccess(res, order, 201);
  }

  /**
   * Create a transaction for an order
   * POST /api/payment/transaction
   */
  async createTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { orderId, account } = req.body as CreateTransactionInput;
    const transaction = await paymentService.createTransaction(orderId, account);
    sendSuccess(res, transaction);
  }

  /**
   * GET /api/payment/chain-info
   * Proxy to get latest blockhash from backend RPC
   */
  async getChainInfo(req: Request, res: Response): Promise<void> {
    const info = await paymentService.getLatestBlockhash();
    sendSuccess(res, info);
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
   * Admin: Get all orders
   * GET /api/admin/orders
   */
  async getAllOrdersAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    const orders = await paymentService.getAllOrders();
    sendSuccess(res, { orders });
  }

  /**
   * Admin: Get order by ID
   * GET /api/admin/orders/:id
   */
  async getOrderAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const order = await paymentService.getOrderAdmin(id);
    sendSuccess(res, { order });
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
