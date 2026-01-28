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
    // NOTE: Ensure you have a route GET /api/products/my-products 
    // that uses req.user.merchantId to filter results
    const response = await fetch(`${API_BASE}/products/my-products`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const { data } = await response.json();
    const products = data.products || [];

    // Update Stats
    const totalProdEl = document.getElementById('totalProducts');
    if(totalProdEl) totalProdEl.textContent = products.length;
    
    // Render Table
    const table = document.getElementById('productsTable');
    if (table) {
      if(products.length === 0) {
        table.innerHTML = '<tr><td colspan="5">No products found. Add one!</td></tr>';
        return;
      }
      table.innerHTML = products.map(p => `
        <tr>
          <td><img src="${p.images?.main || 'https://via.placeholder.com/40'}" width="40" style="border-radius:4px"> ${p.name}</td>
          <td>₦${p.base_price.toLocaleString()}</td>
          <td>${p.stock}</td>
          <td><span class="status-badge ${p.status}">${p.status}</span></td>
          <td>
            <button onclick="deleteProduct('${p.id}')" style="color:red; border:none; background:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
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
    const token = localStorage.getItem('token');
    
    const formData = {
      name: document.getElementById('pName').value,
      base_price: parseFloat(document.getElementById('pPrice').value),
      category: document.getElementById('pCategory').value,
      stock: parseInt(document.getElementById('pStock').value),
      description: document.getElementById('pDesc').value,
      images: { main: document.getElementById('pImage').value } 
    };

    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      alert('Product Added!');
      loadMyProducts(); // Refresh list
      // Close modal logic here if applicable
    } else {
      alert('Failed to add product');
    }
  });
}

window.deleteProduct = async (id) => {
  if(!confirm('Delete this product?')) return;
  const token = localStorage.getItem('token');
  await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  loadMyProducts();
};