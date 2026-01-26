// ==========================================
// ADMIN AUTHENTICATION SYSTEM
// ==========================================

const AdminAuth = {
  // Check if user is logged in (using API token or local session)
  isAuthenticated() {
    // First check API token
    if (typeof KickshausAPI !== 'undefined' && KickshausAPI.isAuthenticated()) {
      const user = KickshausAPI.getUser();
      if (user && user.role === 'admin') {
        return true;
      }
    }
    
    // Fallback to local session check
    const session = localStorage.getItem('kickshaus_admin_session');
    if (!session) return false;

    try {
      const sessionData = JSON.parse(session);
      const now = Date.now();
      
      // Check if session is expired (24 hours)
      if (now > sessionData.expires) {
        this.logout();
        return false;
      }

      return sessionData.authenticated === true;
    } catch (e) {
      return false;
    }
  },

  // Logout admin
  logout() {
    localStorage.removeItem('kickshaus_admin_session');
    // Also logout from API if available
    if (typeof KickshausAPI !== 'undefined') {
      KickshausAPI.logout();
    }
  },

  // Get current admin info
  getCurrentAdmin() {
    if (!this.isAuthenticated()) return null;

    // First try to get from API
    if (typeof KickshausAPI !== 'undefined') {
      const user = KickshausAPI.getUser();
      if (user && user.role === 'admin') {
        return {
          email: user.email,
          loginTime: new Date().toISOString()
        };
      }
    }

    // Fallback to local session
    try {
      const session = JSON.parse(localStorage.getItem('kickshaus_admin_session'));
      return {
        email: session.email,
        loginTime: session.loginTime
      };
    } catch (e) {
      return null;
    }
  },

  // Protect dashboard pages
  protectPage() {
    if (!this.isAuthenticated()) {
      // Store intended destination
      sessionStorage.setItem('redirectAfterLogin', window.location.href);
      
      // Redirect to login
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }
};

// Auto-protect dashboard page if this script is included
if (window.location.pathname.includes('dashboard.html')) {
  document.addEventListener('DOMContentLoaded', function() {
    AdminAuth.protectPage();
  });
}