import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../types';
import { sendSuccess } from '../utils/errors';

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
}

export const adminController = new AdminController();