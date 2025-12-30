let subtotal = 19500;
let tax = 500;
let discountAmount = 0;

function applyCoupon() {
  const coupon = document.getElementById("couponInput").value.trim();
  const msg = document.getElementById("couponMsg");

  if (coupon === "SAVE500") {
    discountAmount = 500;
    document.getElementById("discountRow").classList.remove("hidden");
    msg.textContent = "Coupon applied successfully!";
    msg.className = "text-sm mt-2 text-green-600";
  } else {
    discountAmount = 0;
    document.getElementById("discountRow").classList.add("hidden");
    msg.textContent = "Invalid coupon code";
    msg.className = "text-sm mt-2 text-red-600";
  }

  updateTotal();
}

function updateTotal() {
  const total = subtotal + tax - discountAmount;
  document.getElementById("total").textContent = `$${total.toLocaleString()}`;
}
