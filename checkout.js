// ===============================================
// CHECKOUT - KICKSHAUS E-COMMERCE
// Connected to backend API for real payments
// ===============================================

let subtotal = 0;
let tax = 0;
let discountAmount = 0;

/**
 * Initialize checkout page
 */
function initCheckout() {
  // Calculate cart totals from KickshausState
  if (typeof KickshausState !== 'undefined' && KickshausState.cart) {
    subtotal = KickshausState.getCartTotal();
    tax = Math.round(subtotal * 0.075); // 7.5% tax
  }
  updateTotal();
}

/**
 * Apply coupon code (validated via API if available)
 */
async function applyCoupon() {
  const coupon = document.getElementById("couponInput").value.trim();
  const msg = document.getElementById("couponMsg");

  if (!coupon) {
    msg.textContent = "Please enter a coupon code";
    msg.className = "text-sm mt-2 text-red-600";
    return;
  }

  // For now, keep simple validation. In production, this would call the API
  // to validate the coupon code
  if (coupon.toUpperCase() === "SAVE500") {
    discountAmount = 500;
    const discountRow = document.getElementById("discountRow");
    if (discountRow) discountRow.classList.remove("hidden");
    msg.textContent = "Coupon applied successfully!";
    msg.className = "text-sm mt-2 text-green-600";
  } else {
    discountAmount = 0;
    const discountRow = document.getElementById("discountRow");
    if (discountRow) discountRow.classList.add("hidden");
    msg.textContent = "Invalid coupon code";
    msg.className = "text-sm mt-2 text-red-600";
  }

  updateTotal();
}

/**
 * Update the total display
 */
function updateTotal() {
  const total = subtotal + tax - discountAmount;
  const totalElement = document.getElementById("total");
  if (totalElement) {
    totalElement.textContent = `₦${total.toLocaleString()}`;
  }
  
  // Update other displays if they exist
  const subtotalElement = document.getElementById("subtotal");
  if (subtotalElement) {
    subtotalElement.textContent = `₦${subtotal.toLocaleString()}`;
  }
  
  const taxElement = document.getElementById("taxAmount");
  if (taxElement) {
    taxElement.textContent = `₦${tax.toLocaleString()}`;
  }
  
  const discountElement = document.getElementById("discountAmount");
  if (discountElement) {
    discountElement.textContent = `-₦${discountAmount.toLocaleString()}`;
  }
}

/**
 * Process payment through the backend API
 */
async function processPayment() {
  const apiClient = window.api || window.KickshausAPI;
  
  // Check if user is authenticated
  if (!apiClient || !apiClient.isAuthenticated()) {
    showToast('Please login to complete your purchase', 'error');
    sessionStorage.setItem('redirectAfterLogin', window.location.href);
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }

  // Get cart from global state
  if (typeof KickshausState === 'undefined' || !KickshausState.cart || KickshausState.cart.length === 0) {
    showToast('Your cart is empty', 'error');
    return;
  }

  const cartItems = KickshausState.cart.map(item => ({
    product_id: item.id,
    quantity: item.quantity,
    size: item.size,
    color: item.color
  }));

  try {
    showToast('Processing your order...', 'success');
    
    // Create order on backend
    const orderData = await apiClient.createOrder({ 
      items: cartItems,
      discount_code: discountAmount > 0 ? 'SAVE500' : null
    });
    
    if (orderData.success && orderData.data) {
      // Store order info for the payment page
      localStorage.setItem('currentOrder', JSON.stringify(orderData.data));
      
      // Redirect to payment page
      window.location.href = 'payment.html';
    } else {
      throw new Error(orderData.error || 'Failed to create order');
    }
    
  } catch (error) {
    console.error('Payment error:', error);
    showToast(error.message || 'Failed to process payment. Please try again.', 'error');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initCheckout);

