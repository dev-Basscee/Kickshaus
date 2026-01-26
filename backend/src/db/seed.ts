import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// Simple password hash for demo purposes (in production, use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Demo merchant data
const demoMerchant = {
  business_name: 'Kickshaus Official Store',
  email: 'store@kickshaus.com',
  phone: '+1234567890',
  password_hash: hashPassword('demo123'),
  status: 'approved',
  wallet_address: 'DemoWa11etAddressForKickshausStore123456789012',
};

// Demo products data
const demoProducts = [
  {
    name: 'Air Jordan 1 Retro High OG',
    description: 'The Air Jordan 1 Retro High OG is a legendary sneaker that started it all. Featuring premium leather construction and the iconic Wings logo.',
    category: 'Basketball',
    base_price: 180.00,
    stock: 50,
    images: {
      main: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
      top: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
      left: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
      right: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    },
    status: 'live',
    solana_price: 1.2,
  },
  {
    name: 'Nike Dunk Low Panda',
    description: 'The Nike Dunk Low Panda features a clean black and white colorway. Classic basketball style meets streetwear culture.',
    category: 'Lifestyle',
    base_price: 110.00,
    stock: 75,
    images: {
      main: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800',
      top: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800',
      left: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800',
      right: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800',
    },
    status: 'live',
    solana_price: 0.75,
  },
  {
    name: 'Yeezy Boost 350 V2 Zebra',
    description: 'The Yeezy Boost 350 V2 Zebra is one of the most iconic colorways. Features Primeknit upper and Boost midsole for ultimate comfort.',
    category: 'Lifestyle',
    base_price: 230.00,
    stock: 30,
    images: {
      main: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800',
      top: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800',
      left: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800',
      right: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800',
    },
    status: 'live',
    solana_price: 1.5,
  },
  {
    name: 'New Balance 550 White Green',
    description: 'The New Balance 550 brings back retro basketball vibes with a clean white and green colorway. Premium leather construction.',
    category: 'Lifestyle',
    base_price: 130.00,
    stock: 60,
    images: {
      main: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800',
      top: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800',
      left: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800',
      right: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800',
    },
    status: 'live',
    solana_price: 0.85,
  },
  {
    name: 'Nike Air Max 1',
    description: 'The Nike Air Max 1 introduced visible Air technology to the world. A timeless classic that defined sneaker culture.',
    category: 'Running',
    base_price: 150.00,
    stock: 45,
    images: {
      main: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800',
      top: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800',
      left: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800',
      right: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800',
    },
    status: 'live',
    solana_price: 1.0,
  },
  {
    name: 'Adidas Samba OG',
    description: 'The Adidas Samba OG is a timeless indoor soccer shoe that has become a streetwear staple. Suede and leather upper.',
    category: 'Lifestyle',
    base_price: 100.00,
    stock: 80,
    images: {
      main: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800',
      top: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800',
      left: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800',
      right: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800',
    },
    status: 'live',
    solana_price: 0.65,
  },
  {
    name: 'Nike Air Force 1 Low White',
    description: 'The Nike Air Force 1 Low is a true icon. All-white leather upper with Nike Air cushioning for all-day comfort.',
    category: 'Lifestyle',
    base_price: 115.00,
    stock: 100,
    images: {
      main: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800',
      top: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800',
      left: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800',
      right: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800',
    },
    status: 'live',
    solana_price: 0.75,
  },
  {
    name: 'Jordan 4 Retro Black Cat',
    description: 'The Jordan 4 Retro Black Cat features an all-black nubuck upper with matching midsole. Stealthy and sleek.',
    category: 'Basketball',
    base_price: 210.00,
    stock: 25,
    images: {
      main: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800',
      top: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800',
      left: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800',
      right: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800',
    },
    status: 'live',
    solana_price: 1.4,
  },
];

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Step 1: Check if demo merchant already exists
    console.log('📦 Checking for existing demo merchant...');
    const { data: existingMerchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('email', demoMerchant.email)
      .single();

    let merchantId: string;

    if (existingMerchant) {
      merchantId = existingMerchant.id;
      console.log(`✅ Demo merchant already exists with ID: ${merchantId}`);
    } else {
      // Create demo merchant
      console.log('📦 Creating demo merchant...');
      const { data: newMerchant, error: merchantError } = await supabase
        .from('merchants')
        .insert(demoMerchant)
        .select('id')
        .single();

      if (merchantError) {
        throw new Error(`Failed to create merchant: ${merchantError.message}`);
      }

      merchantId = newMerchant.id;
      console.log(`✅ Created demo merchant with ID: ${merchantId}`);
    }

    // Step 2: Delete existing demo products (to avoid duplicates on re-run)
    console.log('\n🗑️  Clearing existing products from demo merchant...');
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('merchant_id', merchantId);

    if (deleteError) {
      console.warn(`⚠️  Warning: Could not delete existing products: ${deleteError.message}`);
    }

    // Step 3: Insert demo products
    console.log('\n👟 Inserting demo products...');
    const productsWithMerchant = demoProducts.map((product) => ({
      ...product,
      merchant_id: merchantId,
    }));

    const { data: insertedProducts, error: productsError } = await supabase
      .from('products')
      .insert(productsWithMerchant)
      .select('id, name');

    if (productsError) {
      throw new Error(`Failed to insert products: ${productsError.message}`);
    }

    console.log(`✅ Inserted ${insertedProducts.length} products:\n`);
    insertedProducts.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (ID: ${p.id})`);
    });

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Demo Merchant Credentials:');
    console.log(`   Email: ${demoMerchant.email}`);
    console.log(`   Password: demo123`);

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seed function
seed();
