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
    items: CartItem[]
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
}

export const paymentService = new PaymentService();
