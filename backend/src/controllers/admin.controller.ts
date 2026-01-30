import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendError } from '../utils/errors';

export class AdminController {
  /**
   * GET /api/admin/stats
   * Returns real counts for the dashboard
   */
  async getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    // 1. Count Users
    const { count: userCount } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer');

    // 2. Count Merchants
    const { count: merchantCount } = await supabaseAdmin
      .from('merchants')
      .select('*', { count: 'exact', head: true });

    // 3. Count Products
    const { count: productCount } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true });

    // 4. Calculate Total Revenue (Confirmed Orders)
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('total_amount_fiat')
      .eq('payment_status', 'confirmed');

    const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount_fiat), 0) || 0;

    // 5. Recent Activity (Last 5 Orders)
    const { data: recentOrders } = await supabaseAdmin
      .from('orders')
      .select('id, total_amount_fiat, payment_status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    sendSuccess(res, {
      total_users: userCount || 0,
      total_merchants: merchantCount || 0,
      total_products: productCount || 0,
      total_revenue: totalRevenue,
      recent_orders: recentOrders || []
    });
  }

  /**
   * GET /api/admin/orders
   * Retrieves all orders for the admin dashboard.
   */
  async getAllOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        customer_id,
        total_amount_fiat,
        payment_status,
        order_status,
        created_at,
        users (full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(res, error.message, 500);
    }

    // Manually map the user's full_name to a top-level customer_name property
    const orders = data.map((order: any) => ({
      ...order,
      customer_name: order.users ? order.users.full_name : 'Guest User'
    }));

    sendSuccess(res, { orders });
  }

  /**
   * PUT /api/admin/orders/:orderId/status
   * Updates the status of a specific order.
   */
  async updateOrderStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return sendError(res, 'Status is required.', 400);
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return sendError(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ order_status: status })
      .eq('id', orderId)
      .select();

    if (error) {
      return sendError(res, `Failed to update order status: ${error.message}`, 500);
    }

    if (!data || data.length === 0) {
      return sendError(res, 'Order not found.', 404);
    }

    sendSuccess(res, { message: 'Order status updated successfully', order: data[0] });
  }

  /**
   * GET /api/admin/customers
   * Retrieves all customers for the admin dashboard.
   */
  async getAllCustomers(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, created_at')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(res, error.message, 500);
    }

    sendSuccess(res, { customers: data });
  }

  /**
   * GET /api/admin/products
   * Retrieves all products for the admin dashboard.
   */
  async getAllProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id, name, category, base_price, stock')
      .order('created_at', { ascending: false });

    if (error) {
      return sendError(res, error.message, 500);
    }

    sendSuccess(res, { products: data });
  }

}

export const adminController = new AdminController();