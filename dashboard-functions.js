

// Helper function for star ratings
function generateStars(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += `<i class="fas fa-star" style="color: ${i <= rating ? '#FFD700' : '#ddd'}; font-size: 0.9rem;"></i>`;
  }
  return stars;
}

// Dashboard Data - Will be populated from API
// Note: Backend admin API endpoints are required for full functionality
const DashboardData = {
  orders: [],
  customers: [],
  reviews: [],
  inventory: typeof PRODUCTS_DATABASE !== 'undefined' ? PRODUCTS_DATABASE.map((product, index) => ({
    ...product,
    sku: `SKU-${String(index + 1).padStart(3, '0')}`,
    lowStockThreshold: 10
  })) : [],
  isLoading: true,
  hasError: false
};

/**
 * Fetch dashboard data from API
 * This function will be called on dashboard load
 */
async function fetchDashboardData() {
  const apiClient = window.api || window.KickshausAPI;
  if (!apiClient) {
    console.warn('API client not available for dashboard');
    DashboardData.isLoading = false;
    return;
  }

  try {
    // Fetch products for inventory
    const productsResponse = await apiClient.getProducts();
    if (productsResponse.success && productsResponse.data) {
      const products = productsResponse.data.products || productsResponse.data;
      if (Array.isArray(products)) {
        DashboardData.inventory = products.map((product, index) => ({
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.final_price || product.base_price || product.price,
          stock: product.stock || 0,
          images: product.images,
          sku: `SKU-${String(index + 1).padStart(3, '0')}`,
          lowStockThreshold: 10
        }));
      }
    }
    
    DashboardData.isLoading = false;
    console.log('✨ Dashboard data loaded from API');
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    DashboardData.isLoading = false;
    DashboardData.hasError = true;
  }
}

// Initialize dashboard data on page load
document.addEventListener('DOMContentLoaded', fetchDashboardData);

// ===== NAVIGATION =====
function showSection(sectionName) {
  document.querySelectorAll('.dashboard-section').forEach(section => {
    section.classList.remove('active');
    section.style.display = 'none';
  });
  
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  
  const section = document.getElementById(`${sectionName}-section`);
  const navItem = document.querySelector(`.nav-item[data-section="${sectionName}"]`);
  
  if (section) {
    section.classList.add('active');
    section.style.display = 'block';
  }
  if (navItem) navItem.classList.add('active');
  
  const titles = { overview: 'Overview', orders: 'Orders Management', products: 'Products Management', customers: 'Customers', analytics: 'Analytics & Reports', inventory: 'Inventory Management', reviews: 'Customer Reviews', merchants: 'Merchant Applications', settings: 'Settings' };
  document.getElementById('pageTitle').textContent = titles[sectionName] || sectionName;
  
  // Render content
  const renderFunctions = { orders: renderOrdersSection, products: renderProductsSection, customers: renderCustomersSection, analytics: renderAnalyticsSection, inventory: renderInventorySection, reviews: renderReviewsSection,  merchants: renderMerchantsSection, settings: renderSettingsSection };
  if (renderFunctions[sectionName]) renderFunctions[sectionName]();
  
  document.getElementById('sidebar')?.classList.remove('active');
}

// ===== ORDERS SECTION =====
function renderOrdersSection() {
  const section = document.getElementById('orders-section');
  const hasOrders = DashboardData.orders && DashboardData.orders.length > 0;
  
  section.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <button class="btn btn-secondary" onclick="filterOrders('all')">All (${DashboardData.orders.length})</button>
        <button class="btn btn-secondary" onclick="filterOrders('pending')">Pending (${DashboardData.orders.filter(o => o.status === 'pending').length})</button>
        <button class="btn btn-secondary" onclick="filterOrders('processing')">Processing (${DashboardData.orders.filter(o => o.status === 'processing').length})</button>
        <button class="btn btn-secondary" onclick="filterOrders('completed')">Completed (${DashboardData.orders.filter(o => o.status === 'completed').length})</button>
      </div>
    </div>
    <div class="card">
      ${hasOrders ? `
      <div class="table-container">
        <table>
          <thead><tr><th>Order ID</th><th>Customer</th><th>Product</th><th>Qty</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody id="ordersTableBody">${DashboardData.orders.map(order => `
            <tr>
              <td><strong>${order.id}</strong></td>
              <td>${order.customer}<br><small style="color: var(--text-muted);">${order.email}</small></td>
              <td>${order.product}</td>
              <td>${order.quantity}</td>
              <td><strong>₦${order.amount.toLocaleString()}</strong></td>
              <td><span class="status-badge ${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></td>
              <td>${order.date}</td>
              <td>
                <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="viewOrderDetails('${order.id}')"><i class="fas fa-eye"></i></button>
                <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.85rem; margin-left: 4px;" onclick="updateOrderStatus('${order.id}')"><i class="fas fa-edit"></i></button>
              </td>
            </tr>
          `).join('')}</tbody>
        </table>
      </div>
      ` : `
      <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <i class="fas fa-shopping-bag" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
        <h3 style="margin-bottom: 8px; color: var(--text-primary);">No Orders Yet</h3>
        <p>Orders will appear here once customers make purchases through Solana Pay.</p>
      </div>
      `}
    </div>
  `;
}

function filterOrders(status) {
  const filtered = status === 'all' ? DashboardData.orders : DashboardData.orders.filter(o => o.status === status);
  document.getElementById('ordersTableBody').innerHTML = filtered.map(order => `
    <tr>
      <td><strong>${order.id}</strong></td>
      <td>${order.customer}<br><small style="color: var(--text-muted);">${order.email}</small></td>
      <td>${order.product}</td>
      <td>${order.quantity}</td>
      <td><strong>₦${order.amount.toLocaleString()}</strong></td>
      <td><span class="status-badge ${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></td>
      <td>${order.date}</td>
      <td>
        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="viewOrderDetails('${order.id}')"><i class="fas fa-eye"></i></button>
        <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.85rem; margin-left: 4px;" onclick="updateOrderStatus('${order.id}')"><i class="fas fa-edit"></i></button>
      </td>
    </tr>
  `).join('');
}

function viewOrderDetails(orderId) {
  const order = DashboardData.orders.find(o => o.id === orderId);
  if (!order) return;
  showModal(`
    <h2 style="margin-bottom: 20px; font-family: 'Playfair Display', serif;">Order Details - ${order.id}</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
      <div><h4 style="margin-bottom: 8px; color: var(--text-muted);">Customer</h4><p><strong>Name:</strong> ${order.customer}</p><p><strong>Email:</strong> ${order.email}</p><p><strong>Address:</strong> ${order.address}</p></div>
      <div><h4 style="margin-bottom: 8px; color: var(--text-muted);">Order Info</h4><p><strong>ID:</strong> ${order.id}</p><p><strong>Date:</strong> ${order.date}</p><p><strong>Status:</strong> <span class="status-badge ${order.status}">${order.status}</span></p></div>
    </div>
    <div style="background: var(--bg-primary); padding: 16px; border-radius: 8px; margin-bottom: 20px;">
      <h4 style="margin-bottom: 12px;">Product Details</h4>
      <p><strong>Product:</strong> ${order.product}</p>
      <p><strong>Quantity:</strong> ${order.quantity}</p>
      <p><strong>Total:</strong> <span style="font-size: 1.3rem; color: var(--primary); font-weight: 700;">₦${order.amount.toLocaleString()}</span></p>
    </div>
    <div style="display: flex; gap: 12px; justify-content: flex-end;">
      <button class="btn btn-secondary" onclick="closeModal()">Close</button>
      <button class="btn btn-primary" onclick="showToast('Print feature coming soon!')"><i class="fas fa-print"></i> Print</button>
    </div>
  `);
}

function updateOrderStatus(orderId) {
  const order = DashboardData.orders.find(o => o.id === orderId);
  if (!order) return;
  showModal(`
    <h2 style="margin-bottom: 20px; font-family: 'Playfair Display', serif;">Update Status</h2>
    <p style="margin-bottom: 16px;">Order ID: <strong>${order.id}</strong></p>
    <p style="margin-bottom: 20px;">Current: <span class="status-badge ${order.status}">${order.status}</span></p>
    <div style="margin-bottom: 24px;">
      <label style="display: block; margin-bottom: 8px; font-weight: 600;">New Status:</label>
      <select id="newStatusSelect" style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);">
        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
      </select>
    </div>
    <div style="display: flex; gap: 12px; justify-content: flex-end;">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveOrderStatus('${orderId}')"><i class="fas fa-save"></i> Update</button>
    </div>
  `);
}

function saveOrderStatus(orderId) {
  const newStatus = document.getElementById('newStatusSelect').value;
  const order = DashboardData.orders.find(o => o.id === orderId);
  if (order) {
    order.status = newStatus;
    showToast(`Order ${orderId} updated to ${newStatus}`);
    closeModal();
    renderOrdersSection();
  }
}

// ===== PRODUCTS SECTION =====
function renderProductsSection() {
  const products = typeof PRODUCTS_DATABASE !== 'undefined' ? PRODUCTS_DATABASE : [];
  const section = document.getElementById('products-section');
  section.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
      <div style="display: flex; gap: 12px;">
        <button class="btn btn-secondary" onclick="filterProducts('all')">All (${products.length})</button>
        <button class="btn btn-secondary" onclick="filterProducts('low-stock')">Low Stock (${products.filter(p => p.stock < 20).length})</button>
      </div>
      <button class="btn btn-primary" onclick="showToast('Add Product feature coming soon!')"><i class="fas fa-plus"></i> Add Product</button>
    </div>
    <div class="card">
      <div class="table-container">
        <table>
          <thead><tr><th>Image</th><th>Name</th><th>Brand</th><th>Category</th><th>Price</th><th>Stock</th><th>Rating</th><th>Actions</th></tr></thead>
          <tbody id="productsTableBody">${products.map(product => `
            <tr>
              <td><img src="${product.images[0]}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;"></td>
              <td><strong>${product.name}</strong></td>
              <td>${product.brand || 'N/A'}</td>
              <td>${product.category}</td>
              <td><strong>₦${product.price.toLocaleString()}</strong></td>
              <td><span style="color: ${product.stock < 20 ? 'var(--accent)' : 'var(--text-primary)'}; font-weight: 600;">${product.stock}</span></td>
              <td><div style="display: flex; align-items: center; gap: 4px;"><i class="fas fa-star" style="color: #FFD700; font-size: 0.9rem;"></i> ${product.rating || 'N/A'}</div></td>
              <td>
                <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="editProduct('${product.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.85rem; margin-left: 4px; background: var(--accent);" onclick="deleteProduct('${product.id}')"><i class="fas fa-trash"></i></button>
              </td>
            </tr>
          `).join('')}</tbody>
        </table>
      </div>
    </div>
  `;
}

function filterProducts(filter) {
  const products = typeof PRODUCTS_DATABASE !== 'undefined' ? PRODUCTS_DATABASE : [];
  const filtered = filter === 'all' ? products : products.filter(p => p.stock < 20);
  document.getElementById('productsTableBody').innerHTML = filtered.map(product => `
    <tr>
      <td><img src="${product.images[0]}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;"></td>
      <td><strong>${product.name}</strong></td>
      <td>${product.brand || 'N/A'}</td>
      <td>${product.category}</td>
      <td><strong>₦${product.price.toLocaleString()}</strong></td>
      <td><span style="color: ${product.stock < 20 ? 'var(--accent)' : 'var(--text-primary)'}; font-weight: 600;">${product.stock}</span></td>
      <td><div style="display: flex; align-items: center; gap: 4px;"><i class="fas fa-star" style="color: #FFD700; font-size: 0.9rem;"></i> ${product.rating || 'N/A'}</div></td>
      <td>
        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="editProduct('${product.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.85rem; margin-left: 4px; background: var(--accent);" onclick="deleteProduct('${product.id}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

function editProduct(productId) {
  const products = typeof PRODUCTS_DATABASE !== 'undefined' ? PRODUCTS_DATABASE : [];
  const product = products.find(p => String(p.id) === String(productId));
  if (!product) return;
  showModal(`
    <h2 style="margin-bottom: 20px; font-family: 'Playfair Display', serif;">Edit Product</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
      <div><label style="display: block; margin-bottom: 8px; font-weight: 600;">Name:</label><input type="text" id="editProductName" value="${product.name}" style="width: 100%; padding: 10px; border-radius: 8px; border: 2px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);"></div>
      <div><label style="display: block; margin-bottom: 8px; font-weight: 600;">Brand:</label><input type="text" id="editProductBrand" value="${product.brand || ''}" style="width: 100%; padding: 10px; border-radius: 8px; border: 2px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);"></div>
      <div><label style="display: block; margin-bottom: 8px; font-weight: 600;">Price (₦):</label><input type="number" id="editProductPrice" value="${product.price}" style="width: 100%; padding: 10px; border-radius: 8px; border: 2px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);"></div>
      <div><label style="display: block; margin-bottom: 8px; font-weight: 600;">Stock:</label><input type="number" id="editProductStock" value="${product.stock}" style="width: 100%; padding: 10px; border-radius: 8px; border: 2px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);"></div>
    </div>
    <div style="display: flex; gap: 12px; justify-content: flex-end;">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveProductEdit('${product.id}')"><i class="fas fa-save"></i> Save</button>
    </div>
  `);
}

function saveProductEdit(productId) {
  const products = typeof PRODUCTS_DATABASE !== 'undefined' ? PRODUCTS_DATABASE : [];
  const product = products.find(p => String(p.id) === String(productId));
  if (product) {
    product.name = document.getElementById('editProductName').value;
    product.brand = document.getElementById('editProductBrand').value;
    product.price = parseInt(document.getElementById('editProductPrice').value);
    product.stock = parseInt(document.getElementById('editProductStock').value);
    showToast('Product updated!');
    closeModal();
    renderProductsSection();
  }
}

function deleteProduct(productId) {
  if (confirm('Delete this product?')) {
    const products = typeof PRODUCTS_DATABASE !== 'undefined' ? PRODUCTS_DATABASE : [];
    const index = products.findIndex(p => String(p.id) === String(productId));
    if (index > -1) {
      products.splice(index, 1);
      showToast('Product deleted!');
      renderProductsSection();
    }
  }
}

// ===== CUSTOMERS SECTION =====
function renderCustomersSection() {
  const section = document.getElementById('customers-section');
  const hasCustomers = DashboardData.customers && DashboardData.customers.length > 0;
  
  section.innerHTML = `
    <div class="card">
      ${hasCustomers ? `
      <div class="table-container">
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Spent</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${DashboardData.customers.map(customer => `
            <tr>
              <td><strong>${customer.id}</strong></td>
              <td>${customer.name}</td>
              <td>${customer.email}</td>
              <td>${customer.phone}</td>
              <td>${customer.totalOrders}</td>
              <td><strong>₦${customer.totalSpent.toLocaleString()}</strong></td>
              <td>${customer.joinDate}</td>
              <td><span class="status-badge ${customer.status === 'active' ? 'completed' : 'pending'}">${customer.status}</span></td>
              <td><button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="viewCustomerDetails('${customer.id}')"><i class="fas fa-eye"></i></button></td>
            </tr>
          `).join('')}</tbody>
        </table>
      </div>
      ` : `
      <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
        <h3 style="margin-bottom: 8px; color: var(--text-primary);">No Customers Yet</h3>
        <p>Customer data will appear here once users register and make purchases.</p>
      </div>
      `}
    </div>
  `;
}

function viewCustomerDetails(customerId) {
  const customer = DashboardData.customers.find(c => c.id === customerId);
  if (!customer) return;
  const customerOrders = DashboardData.orders.filter(o => o.email === customer.email);
  showModal(`
    <h2 style="margin-bottom: 20px; font-family: 'Playfair Display', serif;">Customer Details</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
      <div><h4 style="margin-bottom: 8px; color: var(--text-muted);">Personal Info</h4><p><strong>Name:</strong> ${customer.name}</p><p><strong>Email:</strong> ${customer.email}</p><p><strong>Phone:</strong> ${customer.phone}</p></div>
      <div><h4 style="margin-bottom: 8px; color: var(--text-muted);">Stats</h4><p><strong>Joined:</strong> ${customer.joinDate}</p><p><strong>Orders:</strong> ${customer.totalOrders}</p><p><strong>Spent:</strong> ₦${customer.totalSpent.toLocaleString()}</p></div>
    </div>
    <h4 style="margin: 20px 0 12px;">Recent Orders</h4>
    <div style="background: var(--bg-primary); padding: 16px; border-radius: 8px; max-height: 200px; overflow-y: auto;">
      ${customerOrders.length > 0 ? customerOrders.map(order => `<div style="padding: 12px; background: var(--bg-card); margin-bottom: 8px; border-radius: 6px;"><strong>${order.id}</strong> - ${order.product} <span class="status-badge ${order.status}">${order.status}</span></div>`).join('') : '<p>No orders</p>'}
    </div>
    <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;"><button class="btn btn-secondary" onclick="closeModal()">Close</button></div>
  `);
}

// ===== ANALYTICS SECTION =====
function renderAnalyticsSection() {
  const section = document.getElementById('analytics-section');
  const products = typeof PRODUCTS_DATABASE !== 'undefined' ? PRODUCTS_DATABASE : [];
  const hasOrders = DashboardData.orders && DashboardData.orders.length > 0;
  const totalRevenue = hasOrders ? DashboardData.orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.amount, 0) : 0;
  const completedOrders = hasOrders ? DashboardData.orders.filter(o => o.status === 'completed').length : 0;
  const avgOrder = completedOrders > 0 ? totalRevenue / completedOrders : 0;
  const topProduct = products.length > 0 ? products.reduce((prev, curr) => ((prev.rating || 0) > (curr.rating || 0)) ? prev : curr) : null;
  const successRate = hasOrders ? Math.round((completedOrders / DashboardData.orders.length) * 100) : 0;
  
  section.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-chart-line"></i></div><div class="stat-value">₦${totalRevenue.toLocaleString()}</div><div class="stat-label">Total Revenue</div></div>
      <div class="stat-card"><div class="stat-icon green"><i class="fas fa-shopping-cart"></i></div><div class="stat-value">₦${Math.round(avgOrder).toLocaleString()}</div><div class="stat-label">Avg Order Value</div></div>
      <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-star"></i></div><div class="stat-value">${topProduct ? topProduct.name : 'N/A'}</div><div class="stat-label">Top Product</div></div>
      <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-percentage"></i></div><div class="stat-value">${successRate}%</div><div class="stat-label">Success Rate</div></div>
    </div>
    <div class="card"><div class="card-header"><h2 class="card-title">Sales by Status</h2></div><div style="padding: 20px; display: flex; justify-content: space-around; text-align: center;">
      <div><div style="font-size: 2rem; font-weight: 700; color: #4CAF50;">${hasOrders ? DashboardData.orders.filter(o => o.status === 'completed').length : 0}</div><div>Completed</div></div>
      <div><div style="font-size: 2rem; font-weight: 700; color: var(--primary);">${hasOrders ? DashboardData.orders.filter(o => o.status === 'processing').length : 0}</div><div>Processing</div></div>
      <div><div style="font-size: 2rem; font-weight: 700; color: #FF9800;">${hasOrders ? DashboardData.orders.filter(o => o.status === 'pending').length : 0}</div><div>Pending</div></div>
      <div><div style="font-size: 2rem; font-weight: 700; color: #F44336;">${hasOrders ? DashboardData.orders.filter(o => o.status === 'cancelled').length : 0}</div><div>Cancelled</div></div>
    </div></div>
  `;
}

// ===== INVENTORY SECTION =====
function renderInventorySection() {
  const section = document.getElementById('inventory-section');
  const lowStock = DashboardData.inventory.filter(p => p.stock < p.lowStockThreshold);
  section.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-box"></i></div><div class="stat-value">${DashboardData.inventory.length}</div><div class="stat-label">Total Products</div></div>
      <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-exclamation-triangle"></i></div><div class="stat-value">${lowStock.length}</div><div class="stat-label">Low Stock</div></div>
      <div class="stat-card"><div class="stat-icon green"><i class="fas fa-warehouse"></i></div><div class="stat-value">${DashboardData.inventory.reduce((sum, p) => sum + p.stock, 0)}</div><div class="stat-label">Total Units</div></div>
      <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-dollar-sign"></i></div><div class="stat-value">₦${(DashboardData.inventory.reduce((sum, p) => sum + (p.stock * p.price), 0)).toLocaleString()}</div><div class="stat-label">Inventory Value</div></div>
    </div>
    ${lowStock.length > 0 ? `<div class="card" style="margin-bottom: 24px; border-left: 4px solid #FF9800;"><div class="card-header"><h2 class="card-title" style="color: #FF9800;"><i class="fas fa-exclamation-triangle"></i> Low Stock Alert</h2></div><div class="table-container"><table><thead><tr><th>SKU</th><th>Product</th><th>Stock</th><th>Action</th></tr></thead><tbody>${lowStock.map(product => `<tr><td><strong>${product.sku}</strong></td><td>${product.name}</td><td><strong style="color: var(--accent);">${product.stock}</strong></td><td><button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="restockProduct('${product.id}')"><i class="fas fa-plus"></i> Restock</button></td></tr>`).join('')}</tbody></table></div></div>` : ''}
  `;
}

function restockProduct(productId) {
  const product = DashboardData.inventory.find(p => String(p.id) === String(productId));
  if (!product) return;
  showModal(`
    <h2 style="margin-bottom: 20px; font-family: 'Playfair Display', serif;">Restock Product</h2>
    <p style="margin-bottom: 16px;"><strong>Product:</strong> ${product.name}</p>
    <p style="margin-bottom: 16px;"><strong>Current Stock:</strong> <span style="color: var(--accent); font-weight: 700;">${product.stock}</span></p>
    <div style="margin-bottom: 24px;"><label style="display: block; margin-bottom: 8px; font-weight: 600;">Add Quantity:</label><input type="number" id="restockQuantity" min="1" value="10" style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);"></div>
    <div style="display: flex; gap: 12px; justify-content: flex-end;">
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveRestock('${product.id}')"><i class="fas fa-check"></i> Restock</button>
    </div>
  `);
}

function saveRestock(productId) {
  const quantity = parseInt(document.getElementById('restockQuantity').value);
  const product = DashboardData.inventory.find(p => String(p.id) === String(productId));
  if (product && quantity > 0) {
    product.stock += quantity;
    showToast(`Added ${quantity} units. New stock: ${product.stock}`);
    closeModal();
    renderInventorySection();
  }
}

// ===== REVIEWS SECTION =====
function renderReviewsSection() {
  const section = document.getElementById('reviews-section');
  const hasReviews = DashboardData.reviews && DashboardData.reviews.length > 0;
  const avgRating = hasReviews ? (DashboardData.reviews.reduce((sum, r) => sum + r.rating, 0) / DashboardData.reviews.length).toFixed(1) : '0.0';
  
  section.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-star"></i></div><div class="stat-value">${avgRating}</div><div class="stat-label">Avg Rating</div></div>
      <div class="stat-card"><div class="stat-icon green"><i class="fas fa-comments"></i></div><div class="stat-value">${DashboardData.reviews.length}</div><div class="stat-label">Total Reviews</div></div>
      <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-clock"></i></div><div class="stat-value">${DashboardData.reviews.filter(r => r.status === 'pending').length}</div><div class="stat-label">Pending</div></div>
      <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-check"></i></div><div class="stat-value">${DashboardData.reviews.filter(r => r.status === 'approved').length}</div><div class="stat-label">Approved</div></div>
    </div>
    <div style="display: flex; gap: 12px; margin-bottom: 24px;">
      <button class="btn btn-secondary" onclick="filterReviews('all')">All</button>
      <button class="btn btn-secondary" onclick="filterReviews('pending')">Pending</button>
      <button class="btn btn-secondary" onclick="filterReviews('approved')">Approved</button>
    </div>
    <div class="card">
      ${hasReviews ? `
      <div class="table-container"><table><thead><tr><th>ID</th><th>Customer</th><th>Product</th><th>Rating</th><th>Comment</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody id="reviewsTableBody">${DashboardData.reviews.map(review => `
        <tr>
          <td><strong>${review.id}</strong></td>
          <td>${review.customer}</td>
          <td>${review.product}</td>
          <td><div style="display: flex; align-items: center; gap: 4px;">${generateStars(review.rating)} <strong>${review.rating}</strong></div></td>
          <td style="max-width: 300px;">${review.comment}</td>
          <td>${review.date}</td>
          <td><span class="status-badge ${review.status === 'approved' ? 'completed' : 'pending'}">${review.status}</span></td>
          <td>
            ${review.status === 'pending' ? `<button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="approveReview('${review.id}')"><i class="fas fa-check"></i></button>` : ''}
            <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.85rem; margin-left: 4px; background: var(--accent);" onclick="deleteReview('${review.id}')"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      `).join('')}</tbody></table></div>
      ` : `
      <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <i class="fas fa-star" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
        <h3 style="margin-bottom: 8px; color: var(--text-primary);">No Reviews Yet</h3>
        <p>Customer reviews will appear here once customers submit feedback on their purchases.</p>
      </div>
      `}
    </div>
  `;
}

function filterReviews(status) {
  const filtered = status === 'all' ? DashboardData.reviews : DashboardData.reviews.filter(r => r.status === status);
  document.getElementById('reviewsTableBody').innerHTML = filtered.map(review => `
    <tr>
      <td><strong>${review.id}</strong></td>
      <td>${review.customer}</td>
      <td>${review.product}</td>
      <td><div style="display: flex; align-items: center; gap: 4px;">${generateStars(review.rating)} <strong>${review.rating}</strong></div></td>
      <td style="max-width: 300px;">${review.comment}</td>
      <td>${review.date}</td>
      <td><span class="status-badge ${review.status === 'approved' ? 'completed' : 'pending'}">${review.status}</span></td>
      <td>
        ${review.status === 'pending' ? `<button class="btn btn-primary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="approveReview('${review.id}')"><i class="fas fa-check"></i></button>` : ''}
        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.85rem; margin-left: 4px; background: var(--accent);" onclick="deleteReview('${review.id}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

function approveReview(reviewId) {
  const review = DashboardData.reviews.find(r => r.id === reviewId);
  if (review) {
    review.status = 'approved';
    showToast(`Review ${reviewId} approved!`);
    renderReviewsSection();
  }
}

function deleteReview(reviewId) {
  if (confirm('Delete this review?')) {
    const index = DashboardData.reviews.findIndex(r => r.id === reviewId);
    if (index > -1) {
      DashboardData.reviews.splice(index, 1);
      showToast('Review deleted!');
      renderReviewsSection();
    }
  }
}

// merchants section
function renderMerchantsSection() {
  const section = document.getElementById('merchants-section');
  const merchants = JSON.parse(localStorage.getItem('merchants') || '[]');

  if (merchants.length === 0) {
    section.innerHTML = `
      <div class="card">
        <p style="color: var(--text-muted);">No merchant applications yet.</p>
      </div>
    `;
    return;
  }

  section.innerHTML = `
    <div class="card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Business Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Applied On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${merchants.map(m => `
              <tr>
                <td><strong>${m.businessName}</strong></td>
                <td>${m.email}</td>
                <td>
                  <span class="status-badge ${m.status === 'approved' ? 'completed' : 'pending'}">
                    ${m.status}
                  </span>
                </td>
                <td>${m.createdAt || '—'}</td>
                <td>
                  ${m.status !== 'approved' ? `
                    <button class="btn btn-primary" onclick="approveMerchant('${m.id}')">
                      Approve
                    </button>
                  ` : '—'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ===============================
// MERCHANT ADMIN ACTIONS
// ===============================

function approveMerchant(merchantId) {
  const merchants = JSON.parse(localStorage.getItem('merchants') || '[]');
  const merchant = merchants.find(m => m.id === merchantId);

  if (!merchant) return;

  merchant.status = 'approved';
  merchant.mustChangePassword = true;

  localStorage.setItem('merchants', JSON.stringify(merchants));
  showToast('Merchant approved successfully');
  renderMerchantsSection();
}



// ===== SETTINGS SECTION =====
function renderSettingsSection() {
  const section = document.getElementById('settings-section');
  // Use the centralized API client
  const apiClient = window.api || window.KickshausAPI;
  const admin = apiClient ? apiClient.getUser() : null;
  section.innerHTML = `
    <div style="max-width: 800px;">
      <div class="card" style="margin-bottom: 24px;"><div class="card-header"><h2 class="card-title">Account Settings</h2></div><div style="padding: 20px;">
        <div style="margin-bottom: 20px;"><label style="display: block; margin-bottom: 8px; font-weight: 600;">Email:</label><input type="email" value="${admin ? admin.email : 'admin@kickshaus.com'}" disabled style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid var(--border-color); background: var(--bg-primary); color: var(--text-muted);"></div>
        <div style="margin-bottom: 20px;"><label style="display: block; margin-bottom: 8px; font-weight: 600;">Change Password:</label><input type="password" id="newPassword" placeholder="New password" style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); margin-bottom: 12px;"><input type="password" id="confirmPassword" placeholder="Confirm password" style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);"></div>
        <button class="btn btn-primary" onclick="changePassword()"><i class="fas fa-key"></i> Update Password</button>
      </div></div>
      <div class="card"><div class="card-header"><h2 class="card-title">Store Settings</h2></div><div style="padding: 20px;">
        <div style="margin-bottom: 20px;"><label style="display: block; margin-bottom: 8px; font-weight: 600;">Store Name:</label><input type="text" id="storeName" value="Kickshaus" style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);"></div>
        <div style="margin-bottom: 20px;"><label style="display: block; margin-bottom: 8px; font-weight: 600;">Tax Rate (%):</label><input type="number" id="taxRate" value="7.5" step="0.1" style="width: 100%; padding: 12px; border-radius: 8px; border: 2px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);"></div>
        <button class="btn btn-primary" onclick="saveStoreSettings()"><i class="fas fa-save"></i> Save Settings</button>
      </div></div>
    </div>
  `;
}

function changePassword() {
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  if (!newPassword || !confirmPassword) { showToast('Fill in both password fields', 'error'); return; }
  if (newPassword !== confirmPassword) { showToast('Passwords do not match', 'error'); return; }
  if (newPassword.length < 8) { showToast('Password must be 8+ characters', 'error'); return; }
  showToast('Password updated!');
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
}

function saveStoreSettings() {
  localStorage.setItem('storeSettings', JSON.stringify({
    name: document.getElementById('storeName').value,
    taxRate: document.getElementById('taxRate').value
  }));
  showToast('Settings saved!');
}

// ===== UTILITIES =====
function showModal(content) {
  const existingModal = document.getElementById('dashboard-modal');
  if (existingModal) existingModal.remove();
  const modal = document.createElement('div');
  modal.id = 'dashboard-modal';
  modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 20px; animation: fadeIn 0.3s ease;';
  modal.innerHTML = `<div style="background: var(--bg-card); border-radius: 16px; padding: 32px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-lg); animation: slideUp 0.3s ease;">${content}</div>`;
  modal.addEventListener('click', function(e) { if (e.target === modal) closeModal(); });
  document.body.appendChild(modal);
}

function closeModal() {
  const modal = document.getElementById('dashboard-modal');
  if (modal) {
    modal.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => modal.remove(), 300);
  }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
      showSection(this.getAttribute('data-section'));
    });
  });

  document.getElementById('logoutBtn')?.addEventListener('click', function() {
    if (confirm('Logout?')) {
      const apiClient = window.api || window.KickshausAPI;
      if (apiClient) apiClient.logout();
      showToast('Logged out!');
      setTimeout(() => window.location.href = 'login.html', 1000);
    }
  });

  document.getElementById('sidebarToggle')?.addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('active');
  });

  document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggle');
    if (window.innerWidth <= 768 && sidebar?.classList.contains('active')) {
      if (!sidebar.contains(e.target) && !toggle?.contains(e.target)) sidebar.classList.remove('active');
    }
  });

  console.log('✨ Dashboard loaded! Credentials: admin@kickshaus.com / Kickshaus2025!');
});

const style = document.createElement('style');
style.textContent = '@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } } @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }';
document.head.appendChild(style);