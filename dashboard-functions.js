/**
 * ADMIN DASHBOARD FUNCTIONS
 * Fetches real data and handles dashboard interactivity.
 */

const API_BASE = '/api';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  // Only execute on the dashboard page
  if (document.querySelector('.dashboard-container')) {
    checkAdminAuth();
    setupNavigation();
    setupLogout();
    loadDashboardStats();
    loadAllMerchants(); // Load merchants for the dedicated section
  }
});

// --- AUTHENTICATION ---
function checkAdminAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Use 'type' for role checking to be consistent with login logic
  if (!token || user.type !== 'admin') {
    showToast('Unauthorized access. Redirecting to login.', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
  }
}

// --- NAVIGATION ---
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.dashboard-section');
  const pageTitle = document.getElementById('pageTitle');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const sectionName = item.dataset.section;

      // Update active nav item
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Update active section
      sections.forEach(sec => sec.classList.remove('active'));
      const activeSection = document.getElementById(`${sectionName}-section`);
      if (activeSection) {
        activeSection.classList.add('active');
      }

      // Update page title
      pageTitle.textContent = item.querySelector('span').textContent;
    });
  });
}

function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      showConfirmationModal('Are you sure you want to logout?', () => {
        // Clear all session-related storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
        localStorage.removeItem('kickshaus_auth_token');
        localStorage.removeItem('kickshaus_user');
        
        showToast('Logged out successfully.', 'success');
        
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1000);
      });
    });
  }
}

// --- DATA LOADING & RENDERING ---
async function loadDashboardStats() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to fetch stats');

    const result = await response.json();
    const data = result.data;

    if (data) {
      updateElement('totalRevenue', `₦${(data.total_revenue || 0).toLocaleString()}`);
      updateElement('totalOrders', (data.recent_orders || []).length);
      updateElement('totalCustomers', data.total_users || 0);
      updateElement('totalMerchants', data.total_merchants || 0);
      
      renderRecentOrders(data.recent_orders || []);
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
    showToast(error.message, 'error');
  }
}

async function loadAllMerchants() {
  try {
    const token = localStorage.getItem('token');
    // Fetch all merchants, not just pending ones
    const response = await fetch(`${API_BASE}/admin/merchants`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to fetch merchants');

    const result = await response.json();
    const merchants = result.data.merchants || [];
    
    const container = document.getElementById('merchantsTable');
    if (!container) return;

    if (merchants.length === 0) {
      container.innerHTML = '<tr><td colspan="4" style="text-align: center;">No merchants found.</td></tr>';
      return;
    }
    
    container.innerHTML = merchants.map(merchant => `
      <tr>
        <td>${merchant.business_name || 'N/A'}</td>
        <td>${merchant.email}</td>
        <td>
          <span class="status-badge ${merchant.status || 'unknown'}">
            ${(merchant.status || 'unknown').charAt(0).toUpperCase() + (merchant.status || 'unknown').slice(1)}
          </span>
        </td>
        <td>
          ${merchant.status === 'pending' ? `
            <button onclick="approveMerchant('${merchant.id}')" class="btn btn-secondary" style="font-size: 12px; padding: 6px 10px;">Approve</button>
            <button onclick="rejectMerchant('${merchant.id}')" class="btn btn-secondary" style="font-size: 12px; padding: 6px 10px;">Reject</button>
          ` : `
            <button class="btn btn-secondary" style="font-size: 12px; padding: 6px 10px;" disabled>Handled</button>
          `}
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Failed to load merchants:', error);
    showToast(error.message, 'error');
  }
}

function renderRecentOrders(orders) {
  const container = document.getElementById('recentOrdersTable');
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = '<tr><td colspan="4" style="text-align: center;">No recent orders.</td></tr>';
    return;
  }

  container.innerHTML = orders.slice(0, 5).map(order => `
    <tr>
      <td>#${(order.id || 'N/A').slice(0, 8)}</td>
      <td>Guest User</td>
      <td>₦${(Number(order.total_amount_fiat) || 0).toLocaleString()}</td>
      <td>
        <span class="status-badge ${order.payment_status || 'unknown'}">
          ${(order.payment_status || 'unknown').charAt(0).toUpperCase() + (order.payment_status || 'unknown').slice(1)}
        </span>
      </td>
    </tr>
  `).join('');
}


// --- UTILITY FUNCTIONS ---
function updateElement(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}


// --- GLOBAL ACTIONS (for onclick events) ---
window.approveMerchant = async (id) => {
  showConfirmationModal('Are you sure you want to approve this merchant?', async () => {
    await updateMerchantStatus(id, 'approved');
  });
};

window.rejectMerchant = async (id) => {
  showConfirmationModal('Are you sure you want to reject this merchant?', async () => {
    await updateMerchantStatus(id, 'rejected');
  });
};

async function updateMerchantStatus(id, status) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/admin/merchants/${id}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) throw new Error(`Failed to update status to ${status}`);
    
    showToast(`Merchant ${status} successfully!`, 'success');
    loadAllMerchants(); // Refresh the list
  } catch (error) {
    console.error('Failed to update merchant status:', error);
    showToast(error.message, 'error');
  }
}