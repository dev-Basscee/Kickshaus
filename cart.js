function updateCartTotal() {
  let total = 0;

  document.querySelectorAll(".cart-item").forEach(item => {
    const price = Number(item.dataset.price);
    const qty = Number(item.querySelector(".qty").textContent);
    const subtotal = price * qty;

    item.querySelector(".subtotal").textContent = `$${subtotal}`;
    total += subtotal;
  });

  document.getElementById("cartTotal").textContent = `$${total}`;
}

// Quantity buttons
document.querySelectorAll(".cart-item").forEach(item => {
  const qtyEl = item.querySelector(".qty");

  item.querySelector(".qty-plus").addEventListener("click", () => {
    qtyEl.textContent = Number(qtyEl.textContent) + 1;
    updateCartTotal();
  });

  item.querySelector(".qty-minus").addEventListener("click", () => {
    if (Number(qtyEl.textContent) > 1) {
      qtyEl.textContent = Number(qtyEl.textContent) - 1;
      updateCartTotal();
    }
  });

  // Remove item
  item.querySelector(".remove").addEventListener("click", () => {
    item.remove();
    updateCartTotal();
  });
});

updateCartTotal();
