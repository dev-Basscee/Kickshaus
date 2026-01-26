// ===============================================
// GLOBAL STATE MANAGEMENT - KICKSHAUS E-COMMERCE
// ===============================================

// ===== GLOBAL STATE =====
const KickshausState = {
  favorites: JSON.parse(localStorage.getItem('kickshaus_favorites')) || [],
  cart: JSON.parse(localStorage.getItem('kickshaus_cart')) || [],
  
  // Save state to localStorage
  saveFavorites() {
    localStorage.setItem('kickshaus_favorites', JSON.stringify(this.favorites));
  },
  
  saveCart() {
    localStorage.setItem('kickshaus_cart', JSON.stringify(this.cart));
  },
  
  // Add to favorites
  addFavorite(product) {
    const exists = this.favorites.find(item => item.id === product.id);
    if (!exists) {
      this.favorites.push(product);
      this.saveFavorites();
      this.updateBadges();
      return true;
    }
    return false;
  },
  
  // Remove from favorites
  removeFavorite(productId) {
    this.favorites = this.favorites.filter(item => item.id !== productId);
    this.saveFavorites();
    this.updateBadges();
  },
  
  // Toggle favorite
  toggleFavorite(product) {
    const exists = this.favorites.find(item => item.id === product.id);
    if (exists) {
      this.removeFavorite(product.id);
      return false;
    } else {
      this.addFavorite(product);
      return true;
    }
  },
  
  // Check if product is favorited
  isFavorited(productId) {
    return this.favorites.some(item => item.id === productId);
  },
  
  // Add to cart
  addToCart(product) {
    const existingItem = this.cart.find(item => 
      item.id === product.id && 
      item.size === product.size && 
      item.color === product.color
    );
    
    if (existingItem) {
      existingItem.quantity++;
    } else {
      this.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image || (product.images && product.images[0]) || '',
        size: product.size || 'N/A',
        color: product.color || 'N/A',
        quantity: 1
      });
    }
    
    this.saveCart();
    this.updateBadges();
  },
  
  // Remove from cart
  removeFromCart(index) {
    this.cart.splice(index, 1);
    this.saveCart();
    this.updateBadges();
  },
  
  // Update cart item quantity
  updateCartQuantity(index, quantity) {
    if (quantity <= 0) {
      this.removeFromCart(index);
    } else {
      this.cart[index].quantity = quantity;
      this.saveCart();
    }
  },
  
  // Clear cart
  clearCart() {
    this.cart = [];
    this.saveCart();
    this.updateBadges();
  },
  
  // Get cart total
  getCartTotal() {
    return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  },
  
  // Get cart item count
  getCartItemCount() {
    return this.cart.reduce((count, item) => count + item.quantity, 0);
  },
  
  // Update all badges on the page
  updateBadges() {
    // Update favorite badges
    const favBadges = document.querySelectorAll('.badge-favorites, #favoriteBadge, .heart-btn .badge');
    favBadges.forEach(badge => {
      badge.textContent = this.favorites.length;
      badge.style.display = this.favorites.length > 0 ? 'flex' : 'none';
    });
    
    // Update cart badges
    const cartBadges = document.querySelectorAll('.badge-cart, #cartBadge, .cart-btn .badge');
    cartBadges.forEach(badge => {
      badge.textContent = this.getCartItemCount();
      badge.style.display = this.getCartItemCount() > 0 ? 'flex' : 'none';
    });
  }
};

// ===== PRODUCT DATABASE =====
const PRODUCTS_DATABASE = [
  {
    id: 'precious-001',
    name: 'Precious Footwear',
    brand: 'Kickshaus',
    category: 'dress',
    price: 180000,
    description: 'NIGERIAN LUXURY SHOES - Premium handcrafted footwear made with the finest materials.',
    images: [
      'https://images.unsplash.com/photo-1614252232199-5d1c2e7d4a0a?w=1200&q=90',
      'https://images.unsplash.com/photo-1605733513502-9e425a13d08f?w=1200&q=90',
      'https://images.unsplash.com/photo-1605733160316-4fc7dac6d16d?w=1200&q=90'
    ],
    badge: 'new',
    stock: 48,
    rating: 5.0,
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: ['brown', 'black', 'oxblood']
  },
  {
    id: 1,
    name: 'Nike Sneakers',
    brand: 'Nike',
    category: 'Fashion',
    price: 1550,
    description: 'Classic Nike sneakers with superior comfort and style.',
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&q=80',
      'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=500&q=80'
    ],
    badge: 'new',
    stock: 25,
    rating: 4.5,
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['white', 'black', 'blue']
  },
  {
    id: 2,
    name: 'Adforce Pumps',
    brand: 'Adidas',
    category: 'Fashion',
    price: 2250,
    description: 'Elegant pumps perfect for any formal occasion.',
    images: [
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&q=80',
      'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&q=80',
      'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=500&q=80'
    ],
    badge: null,
    stock: 15,
    rating: 4.8,
    sizes: ['39', '40', '41', '42'],
    colors: ['red', 'black', 'nude']
  },
  {
    id: 3,
    name: "Puma's Revenge",
    brand: 'Puma',
    category: 'Fashion',
    price: 1850,
    description: 'Sporty and stylish Puma shoes for everyday wear.',
    images: [
      'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=500&q=80',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&q=80',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80'
    ],
    badge: 'bestseller',
    stock: 30,
    rating: 4.7,
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: ['white', 'black', 'grey']
  }
];

// Get product by ID
function getProductById(id) {
  // Convert id to string for comparison since some IDs might be numbers or strings
  return PRODUCTS_DATABASE.find(p => String(p.id) === String(id));
}

// ===== UTILITY FUNCTIONS =====

// Show toast notification
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `kickshaus-toast toast-${type}`;
  toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: ${type === 'error' ? '#FF4444' : '#00A8E8'};
    color: white;
    padding: 16px 32px;
    border-radius: 50px;
    font-weight: 600;
    font-family: 'Poppins', sans-serif;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    transition: transform 0.3s ease;
    max-width: 90%;
    text-align: center;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
  }, 100);
  
  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(100px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Show confirmation modal
function showConfirmationModal(message, onConfirm) {
  const modal = document.createElement('div');
  modal.className = 'kickshaus-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
    padding: 20px;
  `;
  
  modal.innerHTML = `
    <div style="background: white; padding: 32px; border-radius: 16px; max-width: 400px; width: 100%;">
      <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 16px; color: #1A1A1A;">Confirm Action</h3>
      <p style="color: #666; margin-bottom: 24px; line-height: 1.6;">${message}</p>
      <div style="display: flex; gap: 12px;">
        <button class="modal-cancel" style="flex: 1; padding: 12px; border: 2px solid #E5E5E5; border-radius: 8px; background: white; color: #666; font-weight: 600; cursor: pointer;">Cancel</button>
        <button class="modal-confirm" style="flex: 1; padding: 12px; border: none; border-radius: 8px; background: #FF4444; color: white; font-weight: 600; cursor: pointer;">Confirm</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector('.modal-cancel').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.querySelector('.modal-confirm').addEventListener('click', () => {
    onConfirm();
    modal.remove();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Generate star rating HTML
function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 !== 0;
  let stars = '';
  
  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star"></i>';
  }
  
  if (hasHalf) {
    stars += '<i class="fas fa-star-half-alt"></i>';
  }
  
  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="far fa-star"></i>';
  }
  
  return stars;
}

// Format currency
function formatCurrency(amount) {
  return `₦${amount.toLocaleString()}`;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Update all badges
  KickshausState.updateBadges();
  
  // Setup user icon click handler
  const userIcons = document.querySelectorAll('.account-btn, .icon-btn[aria-label="Account"]');
  userIcons.forEach(icon => {
    icon.addEventListener('click', (e) => {
      e.preventDefault();
      // Check if KickshausAPI is available and user is authenticated
      if (typeof KickshausAPI !== 'undefined' && KickshausAPI.isAuthenticated()) {
        const user = KickshausAPI.getUser();
        if (user && user.type === 'merchant') {
          window.location.href = 'merchant-dashboard.html';
        } else if (user && (user.type === 'admin' || user.role === 'admin')) {
          window.location.href = 'dashboard.html';
        } else {
          // Regular user - show profile or redirect to account page
          window.location.href = 'index.html';
        }
      } else {
        window.location.href = 'login.html';
      }
    });
  });
  
  console.log('✨ Kickshaus Global State Initialized');
  console.log('Favorites:', KickshausState.favorites.length);
  console.log('Cart Items:', KickshausState.getCartItemCount());
});