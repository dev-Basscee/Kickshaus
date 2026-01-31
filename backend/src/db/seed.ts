import { supabaseAdmin } from '../config/supabase';
import { hashPassword } from '../utils/helpers';
import { v4 as uuidv4 } from 'uuid';

export async function seedDatabase() {
  console.log('🌱 Seeding database...');

  // 1. Create Admin
  const adminEmail = 'admin@kickshaus.com';
  const adminPassword = 'admin123'; 

  const { data: existingAdmin } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', adminEmail)
    .single();

  if (!existingAdmin) {
    console.log('Creating default admin account...');
    const { error } = await supabaseAdmin.from('users').insert({
      id: uuidv4(),
      email: adminEmail,
      password_hash: hashPassword(adminPassword),
      role: 'admin',
      created_at: new Date().toISOString(),
    });

    if (error) console.error('Error creating admin:', error.message);
    else console.log('✅ Default Admin created: admin@kickshaus.com / admin123');
  } else {
    console.log('ℹ️ Admin account already exists. Updating password to default...');
    const { error } = await supabaseAdmin
      .from('users')
      .update({ password_hash: hashPassword(adminPassword) })
      .eq('email', adminEmail);
    
    if (error) console.error('Error updating admin password:', error.message);
    else console.log('✅ Default Admin password updated: admin@kickshaus.com / admin123');
  }

  // 2. Create Merchant
  const merchantEmail = 'merchant@kickshaus.com';
  let merchantId: string;

  const { data: existingMerchant } = await supabaseAdmin
    .from('merchants')
    .select('id')
    .eq('email', merchantEmail)
    .single();

  if (!existingMerchant) {
    console.log('Creating default merchant account...');
    merchantId = uuidv4();
    const { error } = await supabaseAdmin.from('merchants').insert({
      id: merchantId,
      business_name: 'Kickshaus Official Store',
      email: merchantEmail,
      phone: '+2348000000000',
      password_hash: hashPassword('merchant'),
      wallet_address: 'GkC3J....DemoWalletAddress', // Placeholder, user updates in profile
      status: 'approved',
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error creating merchant:', error.message);
      return; 
    }
    console.log('✅ Default Merchant created: merchant@kickshaus.com / merchant');
  } else {
    console.log('ℹ️ Merchant account already exists.');
    merchantId = existingMerchant.id;
  }

  // 3. Create Products
  console.log('Checking for products...');
  const { count } = await supabaseAdmin
    .from('products')
    .select('id', { count: 'exact', head: true });

  if (count === 0) {
    console.log('Creating sample products...');
    
    const products = [
      {
        merchant_id: merchantId,
        name: 'Nike React Infinity Run',
        description: 'The Nike React Infinity Run Flyknit is designed to help reduce injury and keep you on the run. More foam and improved upper details provide a secure and cushioned feel.',
        category: 'Running',
        base_price: 185000,
        stock: 50,
        status: 'live',
        images: {
          primary: '/images/hero-shoe-1.png',
          gallery: []
        }
      },
      {
        merchant_id: merchantId,
        name: 'Classic Oxford Brogue',
        description: 'Timeless elegance meets modern comfort. These hand-crafted Oxfords feature genuine leather soles and premium calfskin upper.',
        category: 'Formal',
        base_price: 250000,
        stock: 20,
        status: 'live',
        images: {
          primary: '/images/hero-shoe-2.png',
          gallery: []
        }
      },
      {
        merchant_id: merchantId,
        name: 'Urban Street Sneaker',
        description: 'Designed for the city streets. Breathable mesh, durable rubber sole, and a style that stands out.',
        category: 'Casual',
        base_price: 95000,
        stock: 100,
        status: 'live',
        images: {
          primary: '/images/hero-shoe-3.png',
          gallery: []
        }
      },
       {
        merchant_id: merchantId,
        name: 'Air Max Pulse',
        description: 'Bringing a new sensation to Air Max. The Pulse features a point-loaded Air unit (meaning it distributes weight to targeted points on the Air unit) for extra bounce.',
        category: 'Lifestyle',
        base_price: 120000,
        stock: 35,
        status: 'live',
        images: {
          primary: '/images/promo-banner.png',
          gallery: []
        }
      }
    ];

    const { error } = await supabaseAdmin.from('products').insert(products);

    if (error) console.error('Error creating products:', error.message);
    else console.log('✅ Sample products created.');
  } else {
    console.log('ℹ️ Products already exist. Randomizing prices for existing products...');
    
    const { data: existingProducts } = await supabaseAdmin
      .from('products')
      .select('id');

    if (existingProducts) {
      for (const product of existingProducts) {
        const randomPrice = Math.floor(Math.random() * (200000 - 50000 + 1)) + 50000;
        await supabaseAdmin
          .from('products')
          .update({ base_price: randomPrice })
          .eq('id', product.id);
      }
      console.log(`✅ Randomized prices for ${existingProducts.length} products.`);
    }
  }
}

// Allow running directly via ts-node
if (require.main === module) {
  seedDatabase().catch(console.error);
}