import { supabaseAdmin } from '../config/supabase';
import { User, Merchant, UserRole, MerchantStatus } from '../types';
import { hashPassword, verifyPassword } from '../utils/helpers';
import { ConflictError, NotFoundError, UnauthorizedError, BadRequestError, AppError } from '../utils/errors';
import { isSupabaseConfigured } from '../config/env';

export class AuthService {
  /**
   * Register a new customer
   */
  async registerUser(email: string, password: string): Promise<Omit<User, 'password_hash'>> {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      throw new AppError(
        'Registration is currently unavailable. Please contact support or try again later.',
        503,
        'SERVICE_UNAVAILABLE'
      );
    }

    try {
      // Check if user already exists
      const { data: existing, error: existingError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is expected for new users
        console.error('Database error checking existing user:', existingError);
        throw new AppError(
          'Registration service temporarily unavailable. Please try again later.',
          503,
          'SERVICE_UNAVAILABLE'
        );
      }

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
        console.error('Database error creating user:', error);
        throw new AppError(
          'Unable to complete registration. Please try again later.',
          503,
          'SERVICE_UNAVAILABLE'
        );
      }

      return data;
    } catch (error) {
      // If it's already an AppError, rethrow it
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Unexpected error during registration:', error);
      throw new AppError(
        'An unexpected error occurred during registration. Please try again later.',
        500,
        'INTERNAL_ERROR'
      );
    }
  }

  /**
   * Login user (customer or admin)
   */
  async loginUser(email: string, password: string): Promise<{ user: Omit<User, 'password_hash'>; type: 'user' | 'admin' }> {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      throw new AppError(
        'Login is currently unavailable. Please try again later.',
        503,
        'SERVICE_UNAVAILABLE'
      );
    }

    try {
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
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Unexpected error during login:', error);
      throw new AppError(
        'An unexpected error occurred during login. Please try again later.',
        500,
        'INTERNAL_ERROR'
      );
    }
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
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      throw new AppError(
        'Merchant registration is currently unavailable. Please try again later.',
        503,
        'SERVICE_UNAVAILABLE'
      );
    }

    try {
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
        console.error('Database error creating merchant:', error);
        throw new AppError(
          'Unable to complete merchant registration. Please try again later.',
          503,
          'SERVICE_UNAVAILABLE'
        );
      }

      return merchant;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Unexpected error during merchant registration:', error);
      throw new AppError(
        'An unexpected error occurred during registration. Please try again later.',
        500,
        'INTERNAL_ERROR'
      );
    }
  }

  /**
   * Login merchant
   */
  async loginMerchant(email: string, password: string): Promise<Omit<Merchant, 'password_hash'>> {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      throw new AppError(
        'Merchant login is currently unavailable. Please try again later.',
        503,
        'SERVICE_UNAVAILABLE'
      );
    }

    try {
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
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Unexpected error during merchant login:', error);
      throw new AppError(
        'An unexpected error occurred during login. Please try again later.',
        500,
        'INTERNAL_ERROR'
      );
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<Omit<User, 'password_hash'> | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

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
    if (!isSupabaseConfigured()) {
      return null;
    }

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
    if (!isSupabaseConfigured()) {
      return [];
    }

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
    if (!isSupabaseConfigured()) {
      throw new AppError(
        'Admin operations are currently unavailable. Please try again later.',
        503,
        'SERVICE_UNAVAILABLE'
      );
    }

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
