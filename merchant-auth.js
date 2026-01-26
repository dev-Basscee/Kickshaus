// ==========================================
// MERCHANT AUTHENTICATION SYSTEM
// ==========================================

const MerchantAuth = {
  // Check if merchant is authenticated
  isAuthenticated() {
    // First check API token
    if (typeof KickshausAPI !== 'undefined' && KickshausAPI.isAuthenticated()) {
      const user = KickshausAPI.getUser();
      if (user && user.type === 'merchant') {
        return true;
      }
    }
    
    // Fallback to local session check
    const session = localStorage.getItem('kickshaus_merchant_session');
    if (!session) return false;
    
    try {
      const data = JSON.parse(session);
      const now = new Date().getTime();
      
      // Check if session expired (24 hours)
      if (now > data.expires) {
        this.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  },
  
  // Logout merchant
  logout() {
    localStorage.removeItem('kickshaus_merchant_session');
    sessionStorage.removeItem('merchantNeedsPasswordChange');
    // Also logout from API if available
    if (typeof KickshausAPI !== 'undefined') {
      KickshausAPI.logout();
    }
  },
  
  // Get current merchant
  getCurrentMerchant() {
    // First try to get from API
    if (typeof KickshausAPI !== 'undefined') {
      const user = KickshausAPI.getUser();
      if (user && user.type === 'merchant') {
        return user;
      }
    }
    
    // Fallback to local session
    const session = localStorage.getItem('kickshaus_merchant_session');
    if (!session) return null;
    
    try {
      const data = JSON.parse(session);
      return data;
    } catch (error) {
      return null;
    }
  },
  
  // Protect merchant pages
  protectPage() {
    if (!this.isAuthenticated()) {
      sessionStorage.setItem('redirectAfterLogin', window.location.href);
      window.location.href = 'merchant-login.html';
    }
  }
};

// Auto-protect merchant dashboard
if (window.location.pathname.includes('merchant-dashboard.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    MerchantAuth.protectPage();
  });
}