import { supabaseAdmin } from '../config/supabase';
import { hashPassword } from '../utils/helpers';
import { v4 as uuidv4 } from 'uuid';

export async function seedDatabase() {
  console.log('🌱 Seeding database...');

  const adminEmail = 'admin@kickshaus.com';
  const adminPassword = 'admin'; // Default password

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
    else console.log('✅ Default Admin created: admin@kickshaus.com / admin');
  } else {
    console.log('ℹ️ Admin account already exists.');
  }
}

// Allow running directly via ts-node
if (require.main === module) {
  seedDatabase().catch(console.error);
}
