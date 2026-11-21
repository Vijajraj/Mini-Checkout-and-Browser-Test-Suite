/* ============================================================
   Mini Checkout – app.js
   Vanilla JS, integer-cents money, no framework, no build step.
   ============================================================ */

'use strict';

// ── Product catalogue (prices in integer cents) ──
const PRODUCTS = [
  { id: 'tee', name: 'Classic Tee', priceCents: 1999 },
  { id: 'mug', name: 'Ceramic Mug', priceCents: 750 },
];

// ── State (in-memory only) ──
const cart = {}; // { [productId]: { qty: number, lastValidQty: number } }
let orderPlaced = false;

// ── Currency formatter ──
const formatCents = (cents) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(cents / 100);

// ── DOM references ──
const cartLinesEl    = document.getElementById('cart-lines');
const orderTotalEl   = document.querySelector('[data-testid="order-total"]');
const checkoutForm   = document.getElementById('checkout-form');
const nameInput      = document.getElementById('name-input');
const nameErrorEl    = document.querySelector('[data-testid="name-error"]');
const cartErrorEl    = document.querySelector('[data-testid="cart-error"]');
const placeOrderBtn  = document.querySelector('[data-testid="place-order"]');
const confirmationEl = document.getElementById('confirmation-container');

// ── Helpers ──
function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id);
}

function cartIsEmpty() {
  return Object.keys(cart).length === 0;
}

function computeOrderTotalCents() {
  return Object.entries(cart).reduce((sum, [id, item]) => {
    const product = getProduct(id);
    return sum + product.priceCents * item.qty;
  }, 0);
}

function generateOrderRef() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let ref = 'ORD-';
  for (let i = 0; i < 8; i++) {
    ref += chars[bytes[i] % chars.length];
  }
  return ref;
}

// ── Render cart ──
function renderCart() {
  cartLinesEl.innerHTML = '';

  for (const [id, item] of Object.entries(cart)) {
    const product = getProduct(id);
    const lineTotalCents = product.priceCents * item.qty;

    const lineEl = document.createElement('div');
    lineEl.className = 'cart-line';
    lineEl.dataset.testid = `line-${id}`;

    // Name
    const nameSpan = document.createElement('span');
    nameSpan.className = 'line-name';
    nameSpan.textContent = product.name;
    lineEl.appendChild(nameSpan);

    // Unit price
    const priceSpan = document.createElement('span');
    priceSpan.className = 'line-price';
    priceSpan.textContent = formatCents(product.priceCents);
    lineEl.appendChild(priceSpan);

    // Quantity input
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.min = '1';
    qtyInput.max = '99';
    qtyInput.value = String(item.qty);
    qtyInput.dataset.testid = `qty-${id}`;
    qtyInput.dataset.productId = id;
    qtyInput.disabled = orderPlaced;
    qtyInput.setAttribute('aria-label', `Quantity for ${product.name}`);
    lineEl.appendChild(qtyInput);

    // Line total
    const totalSpan = document.createElement('span');
    totalSpan.className = 'line-total';
    totalSpan.dataset.testid = `line-total-${id}`;
    totalSpan.textContent = formatCents(lineTotalCents);
    lineEl.appendChild(totalSpan);

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.dataset.testid = `remove-${id}`;
    removeBtn.dataset.productId = id;
    removeBtn.textContent = 'Remove';
    removeBtn.disabled = orderPlaced;
    lineEl.appendChild(removeBtn);

    cartLinesEl.appendChild(lineEl);
  }

  orderTotalEl.textContent = formatCents(computeOrderTotalCents());
}

// ── Quantity validation ──
function validateAndApplyQty(productId, rawValue) {
  const item = cart[productId];
  if (!item) return;

  const trimmed = String(rawValue).trim();

  // Blank, non-numeric, or not an integer → revert
  if (trimmed === '' || isNaN(trimmed) || !Number.isInteger(Number(trimmed))) {
    item.qty = item.lastValidQty;
    renderCart();
    return;
  }

  let n = parseInt(trimmed, 10);

  // Zero, negative → revert
  if (n <= 0) {
    item.qty = item.lastValidQty;
    renderCart();
    return;
  }

  // Clamp to 99
  if (n > 99) {
    n = 99;
  }

  item.qty = n;
  item.lastValidQty = n;
  renderCart();
}

// ── Event: Add to cart ──
document.querySelectorAll('[data-product-id]').forEach((btn) => {
  if (btn.tagName !== 'BUTTON' || btn.classList.contains('remove-btn')) return;

  btn.addEventListener('click', () => {
    if (orderPlaced) return;
    const id = btn.dataset.productId;
    if (cart[id]) {
      if (cart[id].qty < 99) {
        cart[id].qty += 1;
        cart[id].lastValidQty = cart[id].qty;
      }
    } else {
      cart[id] = { qty: 1, lastValidQty: 1 };
    }
    // Clear cart error when adding an item
    cartErrorEl.hidden = true;
    cartErrorEl.textContent = '';
    renderCart();
  });
});

// ── Event: Quantity change (delegated) ──
cartLinesEl.addEventListener('input', (e) => {
  if (e.target.type === 'number' && e.target.dataset.productId) {
    const id = e.target.dataset.productId;
    validateAndApplyQty(id, e.target.value);
  }
});

// ── Event: Quantity blur – also validate on blur for safety ──
cartLinesEl.addEventListener('change', (e) => {
  if (e.target.type === 'number' && e.target.dataset.productId) {
    const id = e.target.dataset.productId;
    validateAndApplyQty(id, e.target.value);
  }
});

// ── Event: Remove from cart (delegated) ──
cartLinesEl.addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-btn') && e.target.dataset.productId) {
    if (orderPlaced) return;
    const id = e.target.dataset.productId;
    delete cart[id];
    renderCart();
  }
});

// ── Event: Place order ──
checkoutForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Double-click guard: synchronous boolean check FIRST
  if (orderPlaced) return;

  // Clear previous errors
  let hasError = false;

  // Validate name
  const customerName = nameInput.value.trim();
  if (customerName === '') {
    nameErrorEl.textContent = 'Please enter your name.';
    nameErrorEl.hidden = false;
    nameInput.setAttribute('aria-invalid', 'true');
    nameInput.focus();
    hasError = true;
  } else {
    nameErrorEl.textContent = '';
    nameErrorEl.hidden = true;
    nameInput.removeAttribute('aria-invalid');
  }

  // Validate cart
  if (cartIsEmpty()) {
    cartErrorEl.textContent = 'Your cart is empty. Add at least one item to check out.';
    cartErrorEl.hidden = false;
    hasError = true;
  } else {
    cartErrorEl.textContent = '';
    cartErrorEl.hidden = true;
  }

  if (hasError) return;

  // ─── ORDER PLACED ───
  // Set the guard synchronously BEFORE any DOM rendering
  orderPlaced = true;
  placeOrderBtn.disabled = true;

  // Disable all interactive elements
  nameInput.disabled = true;
  document.querySelectorAll('[data-product-id]').forEach((el) => {
    if (el.tagName === 'BUTTON') el.disabled = true;
  });
  document.querySelectorAll('#cart-lines input[type="number"]').forEach((el) => {
    el.disabled = true;
  });
  document.querySelectorAll('.remove-btn').forEach((el) => {
    el.disabled = true;
  });

  // Build confirmation
  const ref = generateOrderRef();
  const totalText = formatCents(computeOrderTotalCents());

  const panel = document.createElement('div');
  panel.className = 'confirmation-panel';
  panel.setAttribute('role', 'status');
  panel.dataset.testid = 'confirmation';

  const heading = document.createElement('h3');
  heading.textContent = 'Order confirmed';
  panel.appendChild(heading);

  const refP = document.createElement('p');
  refP.textContent = 'Reference: ';
  const refSpan = document.createElement('span');
  refSpan.dataset.testid = 'order-ref';
  refSpan.textContent = ref;
  refP.appendChild(refSpan);
  panel.appendChild(refP);

  const nameP = document.createElement('p');
  nameP.textContent = `Customer: ${customerName}`;
  panel.appendChild(nameP);

  const amountP = document.createElement('p');
  amountP.textContent = `Amount: ${totalText}`;
  panel.appendChild(amountP);

  confirmationEl.appendChild(panel);
});
