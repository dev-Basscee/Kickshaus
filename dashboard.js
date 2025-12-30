// ==========================================
// KICKSHAUS DASHBOARD - JAVASCRIPT
// ==========================================

// ===== THEME TOGGLE =====
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const themeIcon = themeToggle.querySelector('i');

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
  body.classList.add('dark-theme');
  themeIcon.classList.replace('fa-moon', 'fa-sun');
}

themeToggle.addEventListener('click', () => {
  body.classList.toggle('dark-theme');
  const isDark = body.classList.contains('dark-theme');
  
  if (isDark) {
    themeIcon.classList.replace('fa-moon', 'fa-sun');
    localStorage.setItem('theme', 'dark');
  } else {
    themeIcon.classList.replace('fa-sun', 'fa-moon');
    localStorage.setItem('theme', 'light');
  }
});

// ===== SIDEBAR NAVIGATION =====
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const pageTitle = document.getElementById('pageTitle');

navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Remove active from all
    navItems.forEach(nav => nav.classList.remove('active'));
    contentSections.forEach(section => section.classList.remove('active'));
    
    // Add active to clicked
    item.classList.add('active');
    const sectionId = item.dataset.section;
    document.getElementById(sectionId).classList.add('active');
    
    // Update page title
    pageTitle.textContent = item.querySelector('span').textContent;
  });
});

// ===== MOBILE MENU =====
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.getElementById('sidebar');

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });
}

// ===== SAMPLE DATA =====
const orders = [
  {id: 'KH-1845', customer: 'Chidi Okonkwo', avatar: 12, product: 'Precious Oxford', date: 'Dec 29, 2025', amount: 180000, status: 'pending', payment: 'Card'},
  {id: 'KH-1844', customer: 'Amina Hassan', avatar: 33, product: 'Imperial Brogue', date: 'Dec 29, 2025', amount: 195000, status: 'delivered', payment: 'Card'},
  {id: 'KH-1843', customer: 'Emeka Nwosu', avatar: 45, product: 'Monaco Loafer', date: 'Dec 28, 2025', amount: 210000, status: 'processing', payment: 'Transfer'},
  {id: 'KH-1842', customer: 'Fatima Bello', avatar: 67, product: 'Urban Sneaker', date: 'Dec 28, 2025', amount: 145000, status: 'delivered', payment: 'Card'},
  {id: 'KH-1841', customer: 'Tunde Adebayo', avatar: 51, product: 'Heritage Derby', date: 'Dec 27, 2025', amount: 165000, status: 'cancelled', payment: 'Card'},
  {id: 'KH-1840', customer: 'Ngozi Okeke', avatar: 20, product: 'Classic Monk', date: 'Dec 27, 2025', amount: 175000, status: 'processing', payment: 'Transfer'},
  {id: 'KH-1839', customer: 'Ibrahim Musa', avatar: 8, product: 'Windsor Loafer', date: 'Dec 26, 2025', amount: 198000, status: 'delivered', payment: 'Card'},
  {id: 'KH-1838', customer: 'Ada Obi', avatar: 15, product: 'Elite Sneaker', date: 'Dec 26, 2025', amount: 155000, status: 'pending', payment: 'Card'}
];

const customers = [
  {name: 'Chidi Okonkwo', email: 'chidi.o@email.com', avatar: 12, location: 'Lagos, Nigeria', orders: 5, spent: 890000, status: 'active'},
  {name: 'Amina Hassan', email: 'amina.h@email.com', avatar: 33, location: 'Abuja, Nigeria', orders: 3, spent: 540000, status: 'active'},
  {name: 'Emeka Nwosu', email: 'emeka.n@email.com', avatar: 45, location: 'Port Harcourt, Nigeria', orders: 7, spent: 1200000, status: 'active'},
  {name: 'Fatima Bello', email: 'fatima.b@email.com', avatar: 67, location: 'Kano, Nigeria', orders: 2, spent: 320000, status: 'active'},
  {name: 'Tunde Adebayo', email: 'tunde.a@email.com', avatar: 51, location: 'Ibadan, Nigeria', orders: 4, spent: 680000, status: 'inactive'}
];

const products = [
  {id: 1, name: 'Precious Oxford', sku: 'KH-PO-001', category: 'Dress Shoes', stock: 48, price: 180000, image: 'https://images.unsplash.com/photo-1614252232199-5d1c2e7d4a0a?w=300'},
  {id: 2, name: 'Imperial Brogue', sku: 'KH-IB-002', category: 'Dress Shoes', stock: 12, price: 195000, image: 'https://images.unsplash.com/photo-1605733513502-9e425a13d08f?w=300'},
  {id: 3, name: 'Monaco Loafer', sku: 'KH-ML-003', category: 'Loafers', stock: 31, price: 210000, image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300'},
  {id: 4, name: 'Urban Sneaker', sku: 'KH-US-004', category: 'Sneakers', stock: 8, price: 145000, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300'},
  {id: 5, name: 'Heritage Derby', sku: 'KH-HD-005', category: 'Dress Shoes', stock: 0, price: 165000, image: 'https://images.unsplash.com/photo-1605733160316-4fc7dac6d16d?w=300'},
  {id: 6, name: 'Classic Monk', sku: 'KH-CM-006', category: 'Dress Shoes', stock: 25, price: 175000, image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=300'}
];

const reviews = [
  {customer: 'Chidi Okonkwo', avatar: 12, rating: 5, product: 'Precious Oxford', text: 'Exceptional quality! These shoes are worth every naira.', date: '2 days ago'},
  {customer: 'Amina Hassan', avatar: 33, rating: 5, product: 'Imperial Brogue', text: 'Bought these for my husband. He absolutely loves them!', date: '1 week ago'},
  {customer: 'Emeka Nwosu', avatar: 45, rating: 4, product: 'Monaco Loafer', text: 'Great shoes, very comfortable. Delivery was quick too.', date: '2 weeks ago'}
];

// ===== POPULATE ORDERS TABLE =====
function populateOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = orders.map(order => `
    <tr>
      <td><input type="checkbox"></td>
      <td><strong>#${order.id}</strong></td>
      <td>
        <div class="customer-cell">
          <img src="https://i.pravatar.cc/40?img=${order.avatar}" alt="${order.customer}">
          <span>${order.customer}</span>
        </div>
      </td>
      <td>${order.product}</td>
      <td>${order.date}</td>
      <td>₦${order.amount.toLocaleString()}</td>
      <td>${order.payment}</td>
      <td><span class="status-badge ${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></td>
      <td>
        <button class="action-btn"><i class="fas fa-eye"></i></button>
      </td>
    </tr>
  `).join('');
}

// ===== POPULATE PRODUCTS GRID =====
function populateProductsGrid() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  
  grid.innerHTML = products.map(product => `
    <div class="product-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; overflow: hidden; transition: all 0.3s;">
      <div style="aspect-ratio: 1; overflow: hidden;">
        <img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <div style="padding: 16px;">
        <h4 style="margin: 0 0 8px 0; font-size: 1.1rem; color: var(--text-primary);">${product.name}</h4>
        <p style="margin: 0 0 8px 0; font-size: 0.85rem; color: var(--text-muted);">SKU: ${product.sku}</p>
        <p style="margin: 0 0 12px 0; font-size: 0.9rem; color: var(--text-secondary);">${product.category}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 1.3rem; font-weight: 700; color: var(--primary);">₦${product.price.toLocaleString()}</span>
          <span style="padding: 4px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; ${product.stock > 0 ? 'background: rgba(102,187,106,0.1); color: #66BB6A;' : 'background: rgba(255,107,107,0.1); color: #FF6B6B;'}">
            Stock: ${product.stock}
          </span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="action-btn" style="flex: 1;"><i class="fas fa-edit"></i> Edit</button>
          <button class="action-btn" style="flex: 1;"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ===== POPULATE CUSTOMERS TABLE =====
function populateCustomersTable() {
  const tbody = document.getElementById('customersTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = customers.map(customer => `
    <tr>
      <td>
        <div class="customer-cell">
          <img src="https://i.pravatar.cc/40?img=${customer.avatar}" alt="${customer.name}">
          <span>${customer.name}</span>
        </div>
      </td>
      <td>${customer.email}</td>
      <td>${customer.location}</td>
      <td>${customer.orders}</td>
      <td>₦${customer.spent.toLocaleString()}</td>
      <td><span class="status-badge ${customer.status}">${customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}</span></td>
      <td>
        <button class="action-btn"><i class="fas fa-eye"></i></button>
      </td>
    </tr>
  `).join('');
}

// ===== POPULATE INVENTORY TABLE =====
function populateInventoryTable() {
  const tbody = document.getElementById('inventoryTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = products.map(product => {
    let stockStatus = 'In Stock';
    let stockClass = 'active';
    
    if (product.stock === 0) {
      stockStatus = 'Out of Stock';
      stockClass = 'cancelled';
    } else if (product.stock < 15) {
      stockStatus = 'Low Stock';
      stockClass = 'pending';
    }
    
    return `
      <tr>
        <td>
          <div class="customer-cell">
            <img src="${product.image}" alt="${product.name}" style="border-radius: 8px;">
            <span>${product.name}</span>
          </div>
        </td>
        <td>${product.sku}</td>
        <td>${product.category}</td>
        <td><strong>${product.stock}</strong> units</td>
        <td><span class="status-badge ${stockClass}">${stockStatus}</span></td>
        <td>Dec 30, 2025</td>
        <td>
          <button class="action-btn"><i class="fas fa-plus"></i></button>
        </td>
      </tr>
    `;
  }).join('');
}

// ===== POPULATE REVIEWS =====
function populateReviews() {
  const list = document.getElementById('reviewsList');
  if (!list) return;
  
  list.innerHTML = reviews.map(review => {
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    return `
      <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px;">
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
          <img src="https://i.pravatar.cc/60?img=${review.avatar}" alt="${review.customer}" style="width: 60px; height: 60px; border-radius: 50%; border: 2px solid var(--primary);">
          <div style="flex: 1;">
            <strong style="display: block; margin-bottom: 4px; color: var(--text-primary);">${review.customer}</strong>
            <div style="color: #FFD700; font-size: 1.1rem; margin-bottom: 4px;">${stars}</div>
            <span style="font-size: 0.85rem; color: var(--text-muted);">${review.product}</span>
          </div>
          <span style="font-size: 0.85rem; color: var(--text-muted);">${review.date}</span>
        </div>
        <p style="margin: 0; color: var(--text-secondary); line-height: 1.7;">"${review.text}"</p>
      </div>
    `;
  }).join('');
}

// ===== CHARTS =====
if (typeof Chart !== 'undefined') {
  // Sales Chart
  const salesCtx = document.getElementById('salesChart');
  if (salesCtx) {
    new Chart(salesCtx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Sales',
          data: [1200000, 1900000, 800000, 2100000, 1500000, 2400000, 1800000],
          borderColor: '#00A8E8',
          backgroundColor: 'rgba(0, 168, 232, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {display: false}
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '₦' + (value / 1000000) + 'M';
              }
            }
          }
        }
      }
    });
  }

  // Category Chart
  const categoryCtx = document.getElementById('categoryChart');
  if (categoryCtx) {
    new Chart(categoryCtx, {
      type: 'doughnut',
      data: {
        labels: ['Dress Shoes', 'Sneakers', 'Loafers', 'Boots'],
        datasets: [{
          data: [45, 25, 20, 10],
          backgroundColor: ['#00A8E8', '#FFD700', '#FF6B6B', '#66BB6A']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {position: 'bottom'}
        }
      }
    });
  }

  // Customer Growth Chart
  const customerCtx = document.getElementById('customerChart');
  if (customerCtx) {
    new Chart(customerCtx, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'New Customers',
          data: [65, 78, 90, 112, 134, 156],
          backgroundColor: '#00A8E8'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {display: false}
        },
        scales: {
          y: {beginAtZero: true}
        }
      }
    });
  }
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
  populateOrdersTable();
  populateProductsGrid();
  populateCustomersTable();
  populateInventoryTable();
  populateReviews();
  
  console.log('✨ Kickshaus Dashboard Initialized');
});