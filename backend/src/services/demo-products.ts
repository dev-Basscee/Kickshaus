import { Product } from '../types';

/**
 * Demo/sample products used as fallback when database is unavailable
 * or when there are no products in the database
 */
export const demoProducts: Product[] = [
  {
    id: 'demo-001',
    merchant_id: 'demo-merchant',
    name: 'Nike Air Max 270',
    description: 'The Nike Air Max 270 delivers unrivaled, all-day comfort. The design draws inspiration from Air Max icons, combining the ideas of big Air in the heel with a lifestyle look.',
    category: 'Sneakers',
    base_price: 55000,
    stock: 50,
    images: {
      main: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
      top: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
      left: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
      right: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
    },
    status: 'live',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-002',
    merchant_id: 'demo-merchant',
    name: 'Adidas Ultraboost 22',
    description: 'Experience incredible energy return with the Adidas Ultraboost 22. Featuring responsive cushioning and a snug fit that moves with you.',
    category: 'Running',
    base_price: 68000,
    stock: 35,
    images: {
      main: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500',
      top: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500',
      left: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500',
      right: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500',
    },
    status: 'live',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-003',
    merchant_id: 'demo-merchant',
    name: 'Jordan 1 Retro High',
    description: 'The Air Jordan 1 Retro High OG remakes the classic sneaker with premium leather and colorway that pays homage to the original.',
    category: 'Basketball',
    base_price: 85000,
    stock: 20,
    images: {
      main: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=500',
      top: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=500',
      left: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=500',
      right: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=500',
    },
    status: 'live',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-004',
    merchant_id: 'demo-merchant',
    name: 'New Balance 550',
    description: 'Classic basketball silhouette meets modern streetwear. The New Balance 550 delivers timeless style with premium materials.',
    category: 'Lifestyle',
    base_price: 45000,
    stock: 45,
    images: {
      main: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500',
      top: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500',
      left: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500',
      right: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500',
    },
    status: 'live',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-005',
    merchant_id: 'demo-merchant',
    name: 'Puma RS-X',
    description: 'Bold, chunky, and unapologetically loud. The Puma RS-X features a retro-inspired design with modern cushioning technology.',
    category: 'Sneakers',
    base_price: 38000,
    stock: 60,
    images: {
      main: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500',
      top: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500',
      left: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500',
      right: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500',
    },
    status: 'live',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-006',
    merchant_id: 'demo-merchant',
    name: 'Converse Chuck 70',
    description: 'The Converse Chuck 70 takes the iconic silhouette and gives it premium upgrades with better cushioning and higher-quality materials.',
    category: 'Classic',
    base_price: 32000,
    stock: 80,
    images: {
      main: 'https://images.unsplash.com/photo-1463100099107-aa0980c362e6?w=500',
      top: 'https://images.unsplash.com/photo-1463100099107-aa0980c362e6?w=500',
      left: 'https://images.unsplash.com/photo-1463100099107-aa0980c362e6?w=500',
      right: 'https://images.unsplash.com/photo-1463100099107-aa0980c362e6?w=500',
    },
    status: 'live',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Check if a product ID is a demo product
 */
export function isDemoProduct(id: string): boolean {
  return id.startsWith('demo-');
}

/**
 * Get demo product by ID
 */
export function getDemoProductById(id: string): Product | undefined {
  return demoProducts.find(p => p.id === id);
}
