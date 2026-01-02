// ==========================================
// ADMIN AUTHENTICATION SYSTEM
// ==========================================

const AdminAuth = {
  // Admin credentials (in production, these should be hashed and stored securely)
  credentials: {
    email: 'admin@kickshaus.com',
    password: 'Kickshaus2025!' // Strong password with uppercase, lowercase, number, special char
  },

  // Check if user is logged in
  isAuthenticated() {
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

  // Login admin
  login(email, password) {
    if (email === this.credentials.email && password === this.credentials.password) {
      // Create session (expires in 24 hours)
      const session = {
        authenticated: true,
        email: email,
        loginTime: Date.now(),
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };

      localStorage.setItem('kickshaus_admin_session', JSON.stringify(session));
      return { success: true, message: 'Login successful!' };
    } else {
      return { success: false, message: 'Invalid email or password' };
    }
  },

  // Logout admin
  logout() {
    localStorage.removeItem('kickshaus_admin_session');
  },

  // Get current admin info
  getCurrentAdmin() {
    if (!this.isAuthenticated()) return null;

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