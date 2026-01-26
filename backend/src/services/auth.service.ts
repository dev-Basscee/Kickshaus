import { supabaseAdmin } from '../config/supabase';
import { User, Merchant, UserRole, MerchantStatus } from '../types';
import { hashPassword, verifyPassword } from '../utils/helpers';
import { ConflictError, NotFoundError, UnauthorizedError, BadRequestError } from '../utils/errors';

export class AuthService {
  /**
   * Register a new customer
   */
  async registerUser(email: string, password: string): Promise<Omit<User, 'password_hash'>> {
    // Check if user already exists
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = hashPassword(password);

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        role: 'customer' as UserRole,
      })
      .select('id, email, role, created_at, updated_at')
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data;
  }

  /**
   * Login user (customer or admin)
   */
  async loginUser(email: string, password: string): Promise<{ user: Omit<User, 'password_hash'>; type: 'user' | 'admin' }> {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash: _passwordHash, ...userData } = user;
    return {
      user: userData,
      type: user.role === 'admin' ? 'admin' : 'user',
    };
  }

  /**
   * Register a new merchant (pending approval)
   */
  async registerMerchant(data: {
    business_name: string;
    email: string;
    phone?: string;
    password: string;
    wallet_address: string;
  }): Promise<Omit<Merchant, 'password_hash'>> {
    // Check if merchant already exists
    const { data: existing } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('email', data.email)
      .single();

    if (existing) {
      throw new ConflictError('Merchant with this email already exists');
    }

    // Also check in users table
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', data.email)
      .single();

    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = hashPassword(data.password);

    const { data: merchant, error } = await supabaseAdmin
      .from('merchants')
      .insert({
        business_name: data.business_name,
        email: data.email,
        phone: data.phone,
        password_hash: passwordHash,
        wallet_address: data.wallet_address,
        status: 'pending' as MerchantStatus,
      })
      .select('id, business_name, email, phone, status, wallet_address, created_at, updated_at')
      .single();

    if (error) {
      throw new Error(`Failed to create merchant: ${error.message}`);
    }

    return merchant;
  }

  /**
   * Login merchant
   */
  async loginMerchant(email: string, password: string): Promise<Omit<Merchant, 'password_hash'>> {
    const { data: merchant, error } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !merchant) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = verifyPassword(password, merchant.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (merchant.status === 'pending') {
      throw new BadRequestError('Your merchant account is pending approval');
    }

    if (merchant.status === 'rejected') {
      throw new BadRequestError('Your merchant application has been rejected');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash: _passwordHash, ...merchantData } = merchant;
    return merchantData;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<Omit<User, 'password_hash'> | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, role, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  /**
   * Get merchant by ID
   */
  async getMerchantById(merchantId: string): Promise<Omit<Merchant, 'password_hash'> | null> {
    const { data, error } = await supabaseAdmin
      .from('merchants')
      .select('id, business_name, email, phone, status, wallet_address, created_at, updated_at')
      .eq('id', merchantId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  /**
   * List all merchants (admin only)
   */
  async listMerchants(status?: MerchantStatus): Promise<Omit<Merchant, 'password_hash'>[]> {
    let query = supabaseAdmin
      .from('merchants')
      .select('id, business_name, email, phone, status, wallet_address, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list merchants: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update merchant status (admin only)
   */
  async updateMerchantStatus(merchantId: string, status: MerchantStatus): Promise<Omit<Merchant, 'password_hash'>> {
    const { data, error } = await supabaseAdmin
      .from('merchants')
      .update({ status })
      .eq('id', merchantId)
      .select('id, business_name, email, phone, status, wallet_address, created_at, updated_at')
      .single();

    if (error) {
      throw new NotFoundError('Merchant not found');
    }

    return data;
  }
}

export const authService = new AuthService();
