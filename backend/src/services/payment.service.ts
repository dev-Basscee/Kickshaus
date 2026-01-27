import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { encodeURL, findReference, validateTransfer } from '@solana/pay';
import BigNumber from 'bignumber.js';
import { config } from '../config/env';
import { supabaseAdmin } from '../config/supabase';
import { 
  Order, 
  OrderItem, 
  PaymentStatus, 
  CreateOrderResponse, 
  VerifyPaymentResponse 
} from '../types';
import { CartItem } from '../utils/validators';
import { cartService } from './cart.service';
import { 
  NotFoundError, 
  PaymentError, 
  InsufficientStockError 
} from '../utils/errors';

/**
 * ============================================================================
 * SOLANA PAY PAYMENT SERVICE
 * ============================================================================
 * 
 * SECURITY ARCHITECTURE:
 * ----------------------
 * This service implements the official Solana Pay specification for secure
 * cryptocurrency payment processing. Key security measures include:
 * 
 * 1. SERVER-SIDE VERIFICATION (Critical)
 *    - All payment verification happens on the backend using `findReference()`
 *      and `validateTransfer()` from @solana/pay
 *    - Frontend NEVER verifies payments directly - it only polls this API
 *    - This prevents transaction spoofing and amount manipulation
 * 
 * 2. CRYPTOGRAPHIC REFERENCE TRACKING
 *    - Each order generates a unique Keypair reference
 *    - The reference PublicKey is embedded in the Solana Pay URL
 *    - `findReference()` locates the on-chain transaction by this reference
 *    - `validateTransfer()` cryptographically verifies recipient, amount, and reference
 * 
 * 3. ATOMIC DATABASE UPDATES
 *    - Order confirmation uses Supabase RPC functions for atomic updates
 *    - Prevents race conditions and double-confirmation attacks
 * 
 * 4. ZERO-TRUST CART VALIDATION
 *    - Cart prices are re-validated server-side before order creation
 *    - Client-submitted prices are NEVER trusted
 * 
 * FLOW:
 * -----
 * 1. Client calls POST /api/payment/create-order with cart items
 * 2. Server validates cart, generates reference, creates order in DB
 * 3. Server returns Solana Pay URL (encoded with @solana/pay encodeURL())
 * 4. Client displays QR code and polls GET /api/payment/verify
 * 5. Server uses findReference() to locate transaction on-chain
 * 6. Server uses validateTransfer() to verify payment matches order
 * 7. On success, server confirms order and returns status to client
 * 
 * ============================================================================
 */

// Payment expiration time (15 minutes)
const PAYMENT_EXPIRY_MS = 15 * 60 * 1000;

// Default NGN to USD exchange rate (configurable via environment)
const DEFAULT_NGN_USD_RATE = 1600;

// Fallback SOL price in USD (used when API is unreachable)
const FALLBACK_SOL_PRICE_USD = 150.0;

export class PaymentService {
  private connection: Connection;
  private platformWallet: PublicKey;

  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, 'confirmed');
    this.platformWallet = new PublicKey(config.solana.platformWalletAddress);
  }

  /**
   * Fetch current SOL price in USD from CoinGecko
   */
  async getSolPrice(): Promise<number> {
    try {
      const response = await fetch(
        `${config.coingecko.apiUrl}/simple/price?ids=solana&vs_currencies=usd`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch SOL price');
      }

      const data = await response.json() as { solana: { usd: number } };
      return data.solana.usd;
    } catch (error) {
      // Fallback price in case of API failure (should be replaced with a more robust solution)
      console.error('Failed to fetch SOL price:', error);
      console.warn(`Using fallback SOL price: $${FALLBACK_SOL_PRICE_USD}`);
      return FALLBACK_SOL_PRICE_USD;
    }
  }

  /**
   * Convert fiat (NGN) to SOL
   * Uses USD as intermediate conversion
   */
  async convertToSol(amountNGN: number): Promise<number> {
    const solPriceUSD = await this.getSolPrice();
    
    // Get NGN to USD rate from config or use default
    const ngnUsdRate = config.ngnUsdRate || DEFAULT_NGN_USD_RATE;
    const NGN_TO_USD = 1 / ngnUsdRate;
    
    const amountUSD = amountNGN * NGN_TO_USD;
    const amountSOL = amountUSD / solPriceUSD;
    
    // Round to 9 decimal places (SOL precision)
    return Math.round(amountSOL * 1e9) / 1e9;
  }

  /**
   * Create a new order with Solana Pay payment
   */
  async createOrder(
    userId: string,
    items: CartItem[],
    delivery?: {
      contact_name?: string;
      contact_email?: string;
      sender_phone?: string;
      receiver_phone?: string;
      shipping_address?: string;
      city?: string;
      state?: string;
      notes?: string;
    }
  ): Promise<CreateOrderResponse> {
    // Validate cart and get current prices from DB (zero-trust)
    const validation = await cartService.validateCart(items);
    
    if (!validation.success) {
      const outOfStock = validation.items.filter(i => !i.in_stock);
      throw new InsufficientStockError(outOfStock.map(i => i.product_id).join(', '));
    }

    const totalFiat = validation.total_fiat;
    
    // Convert to SOL
    const totalSol = await this.convertToSol(totalFiat);
    
    // Generate unique reference key for this transaction
    // Use the PublicKey base58 string as the reference key for Solana Pay
    const reference = Keypair.generate().publicKey;
    const referenceKey = reference.toBase58();
    
    // Calculate expiration time
    const expiresAt = new Date(Date.now() + PAYMENT_EXPIRY_MS);

    // Create order in database
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        total_amount_fiat: totalFiat,
        total_amount_sol: totalSol,
        payment_status: 'pending' as PaymentStatus,
        fulfillment_status: 'pending',
        reference_key: referenceKey,
        expires_at: expiresAt.toISOString(),
        // Delivery details (optional)
        contact_name: delivery?.contact_name ?? null,
        contact_email: delivery?.contact_email ?? null,
        sender_phone: delivery?.sender_phone ?? null,
        receiver_phone: delivery?.receiver_phone ?? null,
        shipping_address: delivery?.shipping_address ?? null,
        city: delivery?.city ?? null,
        state: delivery?.state ?? null,
        notes: delivery?.notes ?? null,
      })
      .select('*')
      .single();

    if (orderError || !order) {
      throw new Error(`Failed to create order: ${orderError?.message}`);
    }

    // Create order items
    const orderItems = validation.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_purchase: item.unit_price,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // Rollback order if items fail
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    // Construct Solana Pay URL
    const solanaPayUrl = encodeURL({
      recipient: this.platformWallet,
      amount: new BigNumber(totalSol),
      reference,
      label: `Kickshaus Order #${order.id.slice(0, 8)}`,
      message: 'Payment for shoes',
    });

    return {
      success: true,
      order_id: order.id,
      reference_key: referenceKey,
      total_fiat: totalFiat,
      total_sol: totalSol,
      solana_pay_url: solanaPayUrl.toString(),
      qr_code_data: solanaPayUrl.toString(),
      expires_at: expiresAt.toISOString(),
    };
  }

  /**
   * Verify payment status for an order
   * 
   * SECURITY: This is the critical verification endpoint that validates payments
   * on the Solana blockchain. The frontend MUST call this endpoint - it should
   * NEVER attempt to verify payments client-side.
   * 
   * Verification Process:
   * 1. findReference() - Locates the transaction on-chain by reference PublicKey
   * 2. validateTransfer() - Cryptographically verifies:
   *    - Recipient matches our platform wallet
   *    - Amount matches the order's SOL amount
   *    - Reference PublicKey is embedded in the transaction
   * 
   * @param referenceKey - The base58-encoded reference PublicKey from order creation
   * @returns VerifyPaymentResponse with status: 'pending' | 'confirmed' | 'failed'
   */
  async verifyPayment(referenceKey: string): Promise<VerifyPaymentResponse> {
    // Get order from database
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('reference_key', referenceKey)
      .single();

    if (error || !order) {
      throw new NotFoundError('Order not found');
    }

    // If already confirmed, return status
    if (order.payment_status === 'confirmed') {
      return {
        success: true,
        status: 'confirmed',
        transaction_signature: order.transaction_signature,
        order_id: order.id,
      };
    }

    // If already failed, return status
    if (order.payment_status === 'failed') {
      return {
        success: false,
        status: 'failed',
        order_id: order.id,
      };
    }

    // Check if order has expired
    if (new Date(order.expires_at) < new Date()) {
      await this.failOrder(order.id, 'Payment expired');
      return {
        success: false,
        status: 'failed',
        order_id: order.id,
      };
    }

    try {
      // Parse the reference public key from the stored base58 string
      const reference = new PublicKey(referenceKey);

      // Find the transaction on Solana
      const signatureInfo = await findReference(this.connection, reference, {
        finality: 'confirmed',
      });

      // Validate the transfer
      await validateTransfer(
        this.connection,
        signatureInfo.signature,
        {
          recipient: this.platformWallet,
          amount: new BigNumber(order.total_amount_sol),
          reference,
        },
        { commitment: 'confirmed' }
      );

      // Confirm the order using database function (atomic operation)
      const { data: confirmed, error: confirmError } = await supabaseAdmin
        .rpc('confirm_order', {
          p_order_id: order.id,
          p_transaction_signature: signatureInfo.signature,
        });

      if (confirmError || !confirmed) {
        throw new PaymentError('Failed to confirm order in database');
      }

      return {
        success: true,
        status: 'confirmed',
        transaction_signature: signatureInfo.signature,
        order_id: order.id,
      };
    } catch (error) {
      // Transaction not found yet - payment still pending
      if ((error as Error).message?.includes('not found')) {
        return {
          success: true,
          status: 'pending',
          order_id: order.id,
        };
      }

      // Validation failed
      if ((error as Error).message?.includes('amount') || 
          (error as Error).message?.includes('recipient')) {
        await this.failOrder(order.id, 'Payment validation failed');
        return {
          success: false,
          status: 'failed',
          order_id: order.id,
        };
      }

      throw error;
    }
  }

  /**
   * Mark order as failed
   */
  private async failOrder(orderId: string, reason: string): Promise<void> {
    await supabaseAdmin
      .from('orders')
      .update({ 
        payment_status: 'failed',
        fulfillment_status: 'cancelled',
      })
      .eq('id', orderId);
    
    console.log(`Order ${orderId} failed: ${reason}`);
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string, userId: string): Promise<Order & { items: OrderItem[] }> {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (error || !order) {
      throw new NotFoundError('Order not found');
    }

    return {
      ...order,
      items: order.order_items,
    };
  }

  /**
   * Get user's orders
   */
  async getUserOrders(userId: string): Promise<Order[]> {
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    return orders || [];
  }

  /**
   * Admin: Get all orders
   */
  async getAllOrders(): Promise<Order[]> {
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    return orders || [];
  }

  /**
   * Admin: Get order by ID (with items)
   */
  async getOrderAdmin(orderId: string): Promise<Order & { items: OrderItem[] }> {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .single();

    if (error || !order) {
      throw new NotFoundError('Order not found');
    }

    return {
      ...order,
      items: order.order_items,
    } as unknown as Order & { items: OrderItem[] };
  }
}

export const paymentService = new PaymentService();
