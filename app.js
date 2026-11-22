/**
 * Mini Checkout Application
 * 
 * Architecture:
 * - Pure Vanilla JavaScript (ES6+), zero frameworks, zero build step
 * - Integer-cents financial arithmetic for zero-floating-point rounding errors
 * - In-memory state management (no localStorage, no cookies)
 * - Synchronous double-click race condition prevention
 * - XSS-safe textContent rendering
 */

'use strict';

// ============================================================================
// 1. CONFIGURATION & CONSTANTS
// ============================================================================

const CONFIG = Object.freeze({
  MIN_QTY: 1,
  MAX_QTY: 99,
  REF_PREFIX: 'ORD-',
  REF_LENGTH: 8,
  REF_CHARSET: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  PRODUCTS: Object.freeze([
    { id: 'tee', name: 'Classic Tee', priceCents: 1999 },
    { id: 'mug', name: 'Ceramic Mug', priceCents: 750 },
  ]),
});

const CurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function formatCents(cents) {
  return CurrencyFormatter.format(cents / 100);
}

// ============================================================================
// 2. STATE MANAGEMENT (IN-MEMORY ONLY)
// ============================================================================

class CartStore {
  constructor() {
    /** @type {Record<string, { qty: number, lastValidQty: number }>} */
    this.items = {};
    this.orderPlaced = false;
  }

  getProduct(productId) {
    return CONFIG.PRODUCTS.find((p) => p.id === productId);
  }

  addItem(productId) {
    if (this.orderPlaced) return;
    const existing = this.items[productId];
    if (existing) {
      if (existing.qty < CONFIG.MAX_QTY) {
        existing.qty += 1;
        existing.lastValidQty = existing.qty;
      }
    } else {
      this.items[productId] = { qty: 1, lastValidQty: 1 };
    }
  }

  updateQuantity(productId, rawValue) {
    const item = this.items[productId];
    if (!item) return;

    const trimmed = String(rawValue).trim();

    // Revert on blank, non-numeric, decimal, or NaN
    if (trimmed === '' || isNaN(trimmed) || !Number.isInteger(Number(trimmed))) {
      item.qty = item.lastValidQty;
      return;
    }

    let parsed = parseInt(trimmed, 10);

    // Revert on zero or negative
    if (parsed < CONFIG.MIN_QTY) {
      item.qty = item.lastValidQty;
      return;
    }

    // Clamp values above maximum
    if (parsed > CONFIG.MAX_QTY) {
      parsed = CONFIG.MAX_QTY;
    }

    item.qty = parsed;
    item.lastValidQty = parsed;
  }

  removeItem(productId) {
    if (this.orderPlaced) return;
    delete this.items[productId];
  }

  isEmpty() {
    return Object.keys(this.items).length === 0;
  }

  computeLineTotalCents(productId) {
    const product = this.getProduct(productId);
    const item = this.items[productId];
    if (!product || !item) return 0;
    return product.priceCents * item.qty;
  }

  computeOrderTotalCents() {
    return Object.entries(this.items).reduce((total, [id, item]) => {
      const product = this.getProduct(id);
      return total + (product ? product.priceCents * item.qty : 0);
    }, 0);
  }
}

// ============================================================================
// 3. CRYPTO ORDER REFERENCE GENERATOR
// ============================================================================

function generateSecureOrderRef() {
  const bytes = new Uint8Array(CONFIG.REF_LENGTH);
  crypto.getRandomValues(bytes);
  let refSuffix = '';
  for (let i = 0; i < CONFIG.REF_LENGTH; i++) {
    refSuffix += CONFIG.REF_CHARSET[bytes[i] % CONFIG.REF_CHARSET.length];
  }
  return `${CONFIG.REF_PREFIX}${refSuffix}`;
}

// ============================================================================
// 4. UI RENDERER & DOM BINDINGS
// ============================================================================

class CheckoutView {
  constructor() {
    this.cartLinesEl    = document.getElementById('cart-lines');
    this.orderTotalEl   = document.querySelector('[data-testid="order-total"]');
    this.checkoutForm   = document.getElementById('checkout-form');
    this.nameInput      = document.getElementById('name-input');
    this.nameErrorEl    = document.querySelector('[data-testid="name-error"]');
    this.cartErrorEl    = document.querySelector('[data-testid="cart-error"]');
    this.placeOrderBtn  = document.querySelector('[data-testid="place-order"]');
    this.confirmationEl = document.getElementById('confirmation-container');
  }

  renderCart(store) {
    this.cartLinesEl.innerHTML = '';

    for (const [id, item] of Object.entries(store.items)) {
      const product = store.getProduct(id);
      if (!product) continue;

      const lineTotalCents = store.computeLineTotalCents(id);

      const lineEl = document.createElement('div');
      lineEl.className = 'cart-line';
      lineEl.dataset.testid = `line-${id}`;

      // Item Name
      const nameSpan = document.createElement('span');
      nameSpan.className = 'line-name';
      nameSpan.textContent = product.name;
      lineEl.appendChild(nameSpan);

      // Item Price
      const priceSpan = document.createElement('span');
      priceSpan.className = 'line-price';
      priceSpan.textContent = formatCents(product.priceCents);
      lineEl.appendChild(priceSpan);

      // Quantity Input
      const qtyInput = document.createElement('input');
      qtyInput.type = 'number';
      qtyInput.min = String(CONFIG.MIN_QTY);
      qtyInput.max = String(CONFIG.MAX_QTY);
      qtyInput.value = String(item.qty);
      qtyInput.dataset.testid = `qty-${id}`;
      qtyInput.dataset.productId = id;
      qtyInput.disabled = store.orderPlaced;
      qtyInput.setAttribute('aria-label', `Quantity for ${product.name}`);
      lineEl.appendChild(qtyInput);

      // Line Total
      const totalSpan = document.createElement('span');
      totalSpan.className = 'line-total';
      totalSpan.dataset.testid = `line-total-${id}`;
      totalSpan.textContent = formatCents(lineTotalCents);
      lineEl.appendChild(totalSpan);

      // Remove Button
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.dataset.testid = `remove-${id}`;
      removeBtn.dataset.productId = id;
      removeBtn.textContent = 'Remove';
      removeBtn.disabled = store.orderPlaced;
      lineEl.appendChild(removeBtn);

      this.cartLinesEl.appendChild(lineEl);
    }

    this.orderTotalEl.textContent = formatCents(store.computeOrderTotalCents());
  }

  setNameError(message) {
    if (message) {
      this.nameErrorEl.textContent = message;
      this.nameErrorEl.hidden = false;
      this.nameInput.setAttribute('aria-invalid', 'true');
      this.nameInput.setAttribute('aria-describedby', 'name-error');
      this.nameInput.focus();
    } else {
      this.nameErrorEl.textContent = '';
      this.nameErrorEl.hidden = true;
      this.nameInput.removeAttribute('aria-invalid');
      this.nameInput.removeAttribute('aria-describedby');
    }
  }

  setCartError(message) {
    if (message) {
      this.cartErrorEl.textContent = message;
      this.cartErrorEl.hidden = false;
    } else {
      this.cartErrorEl.textContent = '';
      this.cartErrorEl.hidden = true;
    }
  }

  lockAllControls() {
    this.nameInput.disabled = true;
    this.placeOrderBtn.disabled = true;

    document.querySelectorAll('[data-product-id]').forEach((el) => {
      if (el.tagName === 'BUTTON') el.disabled = true;
    });
    document.querySelectorAll('#cart-lines input[type="number"]').forEach((el) => {
      el.disabled = true;
    });
    document.querySelectorAll('.remove-btn').forEach((el) => {
      el.disabled = true;
    });
  }

  renderConfirmation(reference, customerName, totalFormatted) {
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
    refSpan.textContent = reference;
    refP.appendChild(refSpan);
    panel.appendChild(refP);

    // XSS defense: strict textContent usage
    const nameP = document.createElement('p');
    nameP.textContent = `Customer: ${customerName}`;
    panel.appendChild(nameP);

    const amountP = document.createElement('p');
    amountP.textContent = `Amount: ${totalFormatted}`;
    panel.appendChild(amountP);

    this.confirmationEl.appendChild(panel);
  }
}

// ============================================================================
// 5. APPLICATION CONTROLLER
// ============================================================================

class CheckoutApp {
  constructor() {
    this.store = new CartStore();
    this.view = new CheckoutView();
    this.initEvents();
  }

  initEvents() {
    // 1. Add to cart delegation
    document.querySelectorAll('[data-product-id]').forEach((btn) => {
      if (btn.tagName !== 'BUTTON' || btn.classList.contains('remove-btn')) return;
      btn.addEventListener('click', () => {
        const productId = btn.dataset.productId;
        this.store.addItem(productId);
        this.view.setCartError('');
        this.view.renderCart(this.store);
      });
    });

    // 2. Quantity input and change event delegation
    const handleQtyEvent = (e) => {
      if (e.target.type === 'number' && e.target.dataset.productId) {
        this.store.updateQuantity(e.target.dataset.productId, e.target.value);
        this.view.renderCart(this.store);
      }
    };
    this.view.cartLinesEl.addEventListener('input', handleQtyEvent);
    this.view.cartLinesEl.addEventListener('change', handleQtyEvent);

    // 3. Remove item delegation
    this.view.cartLinesEl.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-btn') && e.target.dataset.productId) {
        this.store.removeItem(e.target.dataset.productId);
        this.view.renderCart(this.store);
      }
    });

    // 4. Form submission with validation and double-click guard
    this.view.checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleOrderSubmission();
    });
  }

  handleOrderSubmission() {
    // Synchronous guard check: if order already placed, reject immediately
    if (this.store.orderPlaced) return;

    const rawName = this.view.nameInput.value;
    const trimmedName = rawName.trim();
    let hasValidationError = false;

    // Validate Name
    if (trimmedName === '') {
      this.view.setNameError('Please enter your name.');
      hasValidationError = true;
    } else {
      this.view.setNameError('');
    }

    // Validate Cart
    if (this.store.isEmpty()) {
      this.view.setCartError('Your cart is empty. Add at least one item to check out.');
      hasValidationError = true;
    } else {
      this.view.setCartError('');
    }

    // If validation fails, preserve inputs and return
    if (hasValidationError) return;

    // --- Validation Passed: Commit Order ---
    // Synchronously set orderPlaced before DOM updates to block rapid clicks
    this.store.orderPlaced = true;
    this.view.lockAllControls();

    const orderRef = generateSecureOrderRef();
    const formattedTotal = formatCents(this.store.computeOrderTotalCents());

    this.view.renderConfirmation(orderRef, trimmedName, formattedTotal);
  }
}

// ============================================================================
// 6. INITIALIZATION
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
  new CheckoutApp();
});
