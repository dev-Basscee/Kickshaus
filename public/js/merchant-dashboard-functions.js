/**
 * MERCHANT DASHBOARD FUNCTIONS
 */
const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
  checkMerchantAuth();
  loadMyProducts();
});

function checkMerchantAuth() {
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType'); // 'merchant'
  
  if (!token || userType !== 'merchant') {
    window.location.href = 'merchant-login.html';
  }
}

async function loadMyProducts() {
  try {
    const token = localStorage.getItem('token');
    // NOTE: Updated to correct endpoint in merchant.routes.ts
    const response = await fetch(`${API_BASE}/merchants/products`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 403) {
       console.error('Forbidden: Not a merchant');
       window.location.href = 'merchant-login.html';
       return;
    }

    if (!response.ok) {
       throw new Error('Failed to fetch products');
    }
    
    const { data } = await response.json();
    const products = data || []; // The controller returns array directly or {data: []} depending on implementation

    // Update Stats
    const totalProdEl = document.getElementById('totalProducts');
    if(totalProdEl) totalProdEl.textContent = products.length;
    
    // Render Table
    const table = document.getElementById('productsTable');
    if (table) {
      if(products.length === 0) {
        table.innerHTML = '<tr><td colspan="5" style="text-align:center;">No products found. Add one!</td></tr>';
        return;
      }
      table.innerHTML = products.map(p => `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:10px;">
              <img src="${p.images?.main || p.images?.primary || 'https://via.placeholder.com/40'}" width="40" height="40" style="border-radius:4px; object-fit:cover;"> 
              <span>${p.name}</span>
            </div>
          </td>
          <td>₦${p.base_price.toLocaleString()}</td>
          <td>${p.stock}</td>
          <td><span class="status-badge ${p.status}">${p.status.replace('_', ' ')}</span></td>
          <td>
            <button onclick="deleteProduct('${p.id}')" style="color:#F44336; border:none; background:none; cursor:pointer; font-size:1.1rem;" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (e) {
    console.error('Error loading products', e);
  }
}

// Add Product Logic
const addProductForm = document.getElementById('addProductForm');
if (addProductForm) {
  addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = addProductForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';

    const token = localStorage.getItem('token');
    
    const formData = {
      name: document.getElementById('pName').value,
      base_price: parseFloat(document.getElementById('pPrice').value),
      category: document.getElementById('pCategory').value,
      stock: parseInt(document.getElementById('pStock').value),
      description: document.getElementById('pDesc').value,
      images: { 
        main: document.getElementById('pImage').value,
        // Fill other required image fields with the same URL for now to satisfy schema
        top: document.getElementById('pImage').value,
        left: document.getElementById('pImage').value,
        right: document.getElementById('pImage').value
      } 
    };

    try {
      const res = await fetch(`${API_BASE}/merchants/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (res.ok) {
        alert('Product Added Successfully!');
        addProductForm.reset();
        loadMyProducts(); // Refresh list
        // Switch to list view
        document.querySelector('[data-section="my-products"]').click();
      } else {
        alert('Failed to add product: ' + (result.error || result.message));
      }
    } catch (err) {
      console.error(err);
      alert('Network error occurred');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

window.deleteProduct = async (id) => {
  if(!confirm('Are you sure you want to delete this product?')) return;
  const token = localStorage.getItem('token');
  
  try {
    const res = await fetch(`${API_BASE}/merchants/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      alert('Product deleted');
      loadMyProducts();
    } else {
      alert('Failed to delete product');
    }
  } catch (e) {
    console.error(e);
    alert('Error deleting product');
  }
};