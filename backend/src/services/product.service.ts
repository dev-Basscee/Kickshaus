import { supabaseAdmin } from '../config/supabase';
import { Product, ProductStatus, ProductImages } from '../types';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { PaginationInput } from '../utils/validators';
import { demoProducts, getDemoProductById, isDemoProduct } from './demo-products';
import { config } from '../config/env';

export class ProductService {
  /**
   * Check if Supabase is properly configured
   */
  private isSupabaseConfigured(): boolean {
    return (
      config.supabase.url !== 'https://placeholder.supabase.co' &&
      config.supabase.serviceRoleKey !== 'placeholder-service-key'
    );
  }

  /**
   * Get demo products with pagination and filtering
   */
  private getDemoProducts(pagination: PaginationInput): {
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    const { page, limit, category, search, sort } = pagination;
    let filtered = [...demoProducts];

    // Apply category filter
    if (category) {
      filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    switch (sort) {
      case 'price_asc':
        filtered.sort((a, b) => a.base_price - b.base_price);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.base_price - a.base_price);
        break;
      case 'name_asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const paginatedProducts = filtered.slice(offset, offset + limit);

    return {
      products: paginatedProducts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get all live products with pagination and filtering
   */
  async getPublicProducts(pagination: PaginationInput): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // If Supabase is not configured, return demo products
    if (!this.isSupabaseConfigured()) {
      console.log('📦 Supabase not configured, serving demo products');
      return this.getDemoProducts(pagination);
    }

    const { page, limit, category, search, sort } = pagination;
    const offset = (page - 1) * limit;

    try {
      // Build query for count
      let countQuery = supabaseAdmin
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'live');

      // Build query for data
      let dataQuery = supabaseAdmin
        .from('products')
        .select('*')
        .eq('status', 'live');

      // Apply category filter
      if (category) {
        countQuery = countQuery.eq('category', category);
        dataQuery = dataQuery.eq('category', category);
      }

      // Apply search filter
      if (search) {
        const searchFilter = `name.ilike.%${search}%,description.ilike.%${search}%`;
        countQuery = countQuery.or(searchFilter);
        dataQuery = dataQuery.or(searchFilter);
      }

      // Get total count
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.error('Database count error, falling back to demo products:', countError);
        return this.getDemoProducts(pagination);
      }
      
      const total = count || 0;

      // Apply sorting
      switch (sort) {
        case 'price_asc':
          dataQuery = dataQuery.order('base_price', { ascending: true });
          break;
        case 'price_desc':
          dataQuery = dataQuery.order('base_price', { ascending: false });
          break;
        case 'name_asc':
          dataQuery = dataQuery.order('name', { ascending: true });
          break;
        case 'name_desc':
          dataQuery = dataQuery.order('name', { ascending: false });
          break;
        case 'newest':
        default:
          dataQuery = dataQuery.order('created_at', { ascending: false });
      }

      // Apply pagination
      dataQuery = dataQuery.range(offset, offset + limit - 1);

      const { data, error } = await dataQuery;

      if (error) {
        console.error('Database query error, falling back to demo products:', error);
        return this.getDemoProducts(pagination);
      }

      // If no products in database, fallback to demo products
      if (!data || data.length === 0) {
        console.log('📦 No products in database, serving demo products');
        return this.getDemoProducts(pagination);
      }

      return {
        products: data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Failed to fetch products from database, using demo products:', error);
      return this.getDemoProducts(pagination);
    }
  }

  /**
   * Get a single product by ID
   */
  async getProductById(productId: string): Promise<Product> {
    // Check for demo product first
    if (isDemoProduct(productId)) {
      const demoProduct = getDemoProductById(productId);
      if (demoProduct) {
        return demoProduct;
      }
      throw new NotFoundError('Product not found');
    }

    // If Supabase is not configured, check demo products
    if (!this.isSupabaseConfigured()) {
      const demoProduct = getDemoProductById(productId);
      if (demoProduct) {
        return demoProduct;
      }
      throw new NotFoundError('Product not found');
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error || !data) {
        throw new NotFoundError('Product not found');
      }

      return data;
    } catch (error) {
      // If database error, try demo products as fallback
      const demoProduct = getDemoProductById(productId);
      if (demoProduct) {
        return demoProduct;
      }
      throw error;
    }
  }

  /**
   * Get products by merchant (merchant only)
   */
  async getMerchantProducts(merchantId: string, status?: ProductStatus): Promise<Product[]> {
    if (!this.isSupabaseConfigured()) {
      return []; // Cannot list merchant products without database
    }

    let query = supabaseAdmin
      .from('products')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch merchant products: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a new product (merchant only)
   */
  async createProduct(merchantId: string, productData: {
    name: string;
    description?: string;
    category: string;
    base_price: number;
    stock: number;
    images: ProductImages;
  }): Promise<Product> {
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        merchant_id: merchantId,
        name: productData.name,
        description: productData.description,
        category: productData.category,
        base_price: productData.base_price,
        stock: productData.stock,
        images: productData.images,
        status: 'pending_approval' as ProductStatus,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }

    return data;
  }

  /**
   * Update a product (merchant only - own products)
   */
  async updateProduct(
    productId: string,
    merchantId: string,
    updates: Partial<{
      name: string;
      description: string;
      category: string;
      base_price: number;
      stock: number;
      images: ProductImages;
    }>
  ): Promise<Product> {
    // Verify ownership
    const existing = await this.getProductById(productId);
    if (existing.merchant_id !== merchantId) {
      throw new ForbiddenError('You can only update your own products');
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a product (merchant only - own products)
   */
  async deleteProduct(productId: string, merchantId: string): Promise<void> {
    // Verify ownership
    const existing = await this.getProductById(productId);
    if (existing.merchant_id !== merchantId) {
      throw new ForbiddenError('You can only delete your own products');
    }

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }

  /**
   * Get products pending approval (admin only)
   */
  async getPendingProducts(): Promise<Product[]> {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch pending products: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Approve or reject a product (admin only)
   */
  async updateProductStatus(productId: string, status: 'live' | 'rejected'): Promise<Product> {
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ status })
      .eq('id', productId)
      .select('*')
      .single();

    if (error) {
      throw new NotFoundError('Product not found');
    }

    return data;
  }

  /**
   * Check stock availability for multiple products
   */
  async checkStock(items: { product_id: string; quantity: number }[]): Promise<{
    available: boolean;
    details: {
      product_id: string;
      requested: number;
      available: number;
      in_stock: boolean;
    }[];
  }> {
    const productIds = items.map(item => item.product_id);

    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, stock')
      .in('id', productIds);

    if (error) {
      throw new Error(`Failed to check stock: ${error.message}`);
    }

    const stockMap = new Map(products?.map(p => [p.id, p.stock]) || []);
    
    const details = items.map(item => {
      const available = stockMap.get(item.product_id) || 0;
      return {
        product_id: item.product_id,
        requested: item.quantity,
        available,
        in_stock: available >= item.quantity,
      };
    });

    return {
      available: details.every(d => d.in_stock),
      details,
    };
  }
}

export const productService = new ProductService();
