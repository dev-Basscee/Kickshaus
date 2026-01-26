import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Environment validation schema
const envSchema = z.object({
  // Server
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),

  // Solana
  SOLANA_RPC_URL: z.string().url(),
  PLATFORM_WALLET_ADDRESS: z.string().min(32),

  // CoinGecko
  COINGECKO_API_URL: z.string().url().default('https://api.coingecko.com/api/v3'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),

  // CORS
  CORS_ORIGIN: z.string().default('*'),
});

// Parse and validate environment
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      console.error('❌ Environment validation failed:');
      missingVars.forEach(v => console.error(`   - ${v}`));
      
      // In development, provide a fallback for easier testing
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        console.warn('⚠️  Using default development configuration');
        return {
          PORT: process.env.PORT || '3000',
          NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
          SUPABASE_URL: process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
          SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key',
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key',
          JWT_SECRET: process.env.JWT_SECRET || 'development-jwt-secret-minimum-32-characters',
          JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
          SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
          PLATFORM_WALLET_ADDRESS: process.env.PLATFORM_WALLET_ADDRESS || '11111111111111111111111111111111',
          COINGECKO_API_URL: process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3',
          RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || '900000',
          RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || '100',
          CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
        };
      }
      
      process.exit(1);
    }
    throw error;
  }
}

export const env = validateEnv();

export const config = {
  port: parseInt(env.PORT, 10),
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',

  supabase: {
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  },

  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },

  solana: {
    rpcUrl: env.SOLANA_RPC_URL,
    platformWalletAddress: env.PLATFORM_WALLET_ADDRESS,
  },

  coingecko: {
    apiUrl: env.COINGECKO_API_URL,
  },

  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
  },

  cors: {
    origin: env.CORS_ORIGIN,
  },
};
