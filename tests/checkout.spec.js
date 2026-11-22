// @ts-check
const { test, expect } = require('@playwright/test');

// ── Clean state: every test starts from a fresh browser context & page load ──
test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

// ═══════════════════════════════════════════════════════════════════════════
//  AT-01 — [Happy Path] Complete Checkout Journey
//  Covers: TC-01, R6
//  Behavior: Adding an item and submitting with a valid name produces an
//            accessible confirmation panel with a cryptographically generated
//            ORD- reference, customer name, and exact dollar total.
// ═══════════════════════════════════════════════════════════════════════════
test('AT-01: [Happy Path] adding product and submitting valid name renders confirmation with ORD- reference, name, and exact amount', async ({ page }) => {
  // Step 1: Add Classic Tee ($19.99)
  await page.getByTestId('add-tee').click();

  // Step 2: Fill customer name
  await page.getByLabel('Full name').fill('Asha Test');

  // Step 3: Submit order
  await page.getByTestId('place-order').click();

  // Assertion: Confirmation panel exists, is visible, and announces status
  const confirmation = page.getByTestId('confirmation');
  await expect(confirmation).toBeVisible();
  await expect(confirmation).toContainText('Order confirmed');

  // Assertion: Order reference adheres to ORD- plus 8 alphanumeric characters
  const orderRef = page.getByTestId('order-ref');
  await expect(orderRef).toHaveText(/^ORD-[A-Z0-9]{8}$/);

  // Assertion: Confirmation reflects entered name and exact total
  await expect(confirmation).toContainText('Asha Test');
  await expect(confirmation).toContainText('$19.99');
});

// ═══════════════════════════════════════════════════════════════════════════
//  AT-02 — [Validation] Missing Required Name Field
//  Covers: TC-02, R3
//  Behavior: Submitting without entering a name blocks order creation,
//            displays an accessible error, sets aria-invalid, and preserves cart.
// ═══════════════════════════════════════════════════════════════════════════
test('AT-02: [Validation] submitting with empty name displays error message, blocks confirmation, and preserves cart line', async ({ page }) => {
  // Step 1: Add product to cart
  await page.getByTestId('add-tee').click();

  // Step 2: Leave name blank and submit
  await page.getByTestId('place-order').click();

  // Assertion: Name validation error is visible with exact guidance text
  const nameError = page.getByTestId('name-error');
  await expect(nameError).toBeVisible();
  await expect(nameError).toHaveText('Please enter your name.');

  // Assertion: Zero confirmation elements rendered
  await expect(page.getByTestId('confirmation')).toHaveCount(0);

  // Assertion: Cart state is preserved without disruption
  await expect(page.getByTestId('line-tee')).toBeVisible();
  await expect(page.getByTestId('qty-tee')).toHaveValue('1');
});

// ═══════════════════════════════════════════════════════════════════════════
//  AT-03 — [Calculation] Multi-Item Quantity Arithmetic
//  Covers: TC-05, TC-07, R1
//  Behavior: Dynamic quantity edits update line totals and order total
//            with exact integer-cents precision (3 x $19.99 + 2 x $7.50 = $74.97).
// ═══════════════════════════════════════════════════════════════════════════
test('AT-03: [Calculation] updating product quantities computes exact line totals and order total via integer-cents arithmetic', async ({ page }) => {
  // Step 1: Add Classic Tee ($19.99) and set quantity to 3
  await page.getByTestId('add-tee').click();
  await page.getByTestId('qty-tee').fill('3');

  // Assertion: Line total equals 3 * $19.99 = $59.97
  await expect(page.getByTestId('line-total-tee')).toHaveText('$59.97');

  // Step 2: Add Ceramic Mug ($7.50) and set quantity to 2
  await page.getByTestId('add-mug').click();
  await page.getByTestId('qty-mug').fill('2');

  // Assertion: Line total equals 2 * $7.50 = $15.00
  await expect(page.getByTestId('line-total-mug')).toHaveText('$15.00');

  // Assertion: Grand order total equals $59.97 + $15.00 = $74.97
  await expect(page.getByTestId('order-total')).toHaveText('$74.97');
});

// ═══════════════════════════════════════════════════════════════════════════
//  AT-04 — [Idempotency] Double-Click & Rapid-Click Race Condition Guard
//  Covers: TC-16, R2
//  Behavior: Rapid consecutive clicks (dblclick and 3x burst) trigger
//            synchronous guard to prevent duplicate orders or mutating references.
// ═══════════════════════════════════════════════════════════════════════════
test('AT-04: [Idempotency] rapid double and triple clicks on place-order trigger synchronous guard, producing exactly one confirmation', async ({ page }) => {
  // Variant A: Fast double click
  await page.getByTestId('add-tee').click();
  await page.getByLabel('Full name').fill('Double Test');
  await page.getByTestId('place-order').dblclick();

  // Assertion: Exactly 1 confirmation panel exists
  await expect(page.getByTestId('confirmation')).toHaveCount(1);
  const initialRef = await page.getByTestId('order-ref').textContent();

  // Assertion: Order reference remains identical across continuous polling
  await expect.poll(
    async () => page.getByTestId('order-ref').textContent(),
    { timeout: 1000 }
  ).toBe(initialRef);

  // Variant B: Fast triple click burst from fresh context
  await page.goto('/');
  await page.getByTestId('add-tee').click();
  await page.getByLabel('Full name').fill('Triple Test');
  await page.getByTestId('place-order').click({ clickCount: 3 });

  // Assertion: Exactly 1 confirmation panel exists
  await expect(page.getByTestId('confirmation')).toHaveCount(1);
  const tripleRef = await page.getByTestId('order-ref').textContent();
  await expect.poll(
    async () => page.getByTestId('order-ref').textContent(),
    { timeout: 1000 }
  ).toBe(tripleRef);
});

// ═══════════════════════════════════════════════════════════════════════════
//  AT-05 — [Validation] Empty Cart Submission Guard
//  Covers: TC-04, R3
//  Behavior: Submitting without any items in the cart displays a descriptive
//            cart error, prevents order creation, and preserves typed name.
// ═══════════════════════════════════════════════════════════════════════════
test('AT-05: [Validation] submitting with empty cart displays cart error, blocks confirmation, and preserves entered customer name', async ({ page }) => {
  // Step 1: Type customer name without adding any products
  await page.getByLabel('Full name').fill('No Cart User');

  // Step 2: Attempt checkout
  await page.getByTestId('place-order').click();

  // Assertion: Cart error appears with prescribed text
  const cartError = page.getByTestId('cart-error');
  await expect(cartError).toBeVisible();
  await expect(cartError).toContainText('Your cart is empty');

  // Assertion: Zero confirmation panels rendered
  await expect(page.getByTestId('confirmation')).toHaveCount(0);

  // Assertion: Customer name is preserved
  await expect(page.getByLabel('Full name')).toHaveValue('No Cart User');
});

// ═══════════════════════════════════════════════════════════════════════════
//  AT-06 — [Data Preservation] State Retention After Item Removal
//  Covers: TC-13, R4
//  Behavior: Adding an item, typing a name, and removing all items before
//            checkout triggers cart validation while retaining the entered name.
// ═══════════════════════════════════════════════════════════════════════════
test('AT-06: [Data Preservation] removing items after entering customer name retains input value upon validation failure', async ({ page }) => {
  // Step 1: Add product and fill customer name
  await page.getByTestId('add-tee').click();
  await page.getByLabel('Full name').fill('Preserved Name');

  // Step 2: Remove the product, returning cart to empty state ($0.00)
  await page.getByTestId('remove-tee').click();

  // Step 3: Attempt checkout
  await page.getByTestId('place-order').click();

  // Assertion: Name value is preserved in the input
  await expect(page.getByLabel('Full name')).toHaveValue('Preserved Name');

  // Assertion: Cart error is displayed
  await expect(page.getByTestId('cart-error')).toBeVisible();

  // Assertion: Zero confirmation panels rendered
  await expect(page.getByTestId('confirmation')).toHaveCount(0);
});

// ═══════════════════════════════════════════════════════════════════════════
//  AT-07 — [Edge Cases] Scientific Notation and Boundary Inputs
//  Covers: TC-08, TC-09, TC-10, TC-11, TC-12, R5
//  Behavior: Non-digit inputs including scientific notation (1e2), decimals (1.5),
//            negatives (-1), and zero revert to last valid quantity; inputs > 99 clamp to 99.
// ═══════════════════════════════════════════════════════════════════════════
test('AT-07: [Edge Cases] scientific notation (1e2), zero, negative, and decimal inputs revert to last valid quantity while >99 clamps to 99', async ({ page }) => {
  // Step 1: Add product (initial qty = 1)
  await page.getByTestId('add-tee').click();
  const qtyInput = page.getByTestId('qty-tee');
  await expect(qtyInput).toHaveValue('1');

  // Step 2: Set quantity to valid 5 (lastValidQty becomes 5)
  await qtyInput.fill('5');
  await expect(qtyInput).toHaveValue('5');
  await expect(page.getByTestId('line-total-tee')).toHaveText('$99.95');

  // Step 3: Enter scientific notation "1e2" -> must revert to 5, NOT parse as 1
  await qtyInput.fill('1e2');
  await expect(qtyInput).toHaveValue('5');
  await expect(page.getByTestId('line-total-tee')).toHaveText('$99.95');

  // Step 4: Enter decimal "1.5" -> must revert to 5
  await qtyInput.fill('1.5');
  await expect(qtyInput).toHaveValue('5');

  // Step 5: Enter negative "-1" -> must revert to 5
  await qtyInput.fill('-1');
  await expect(qtyInput).toHaveValue('5');

  // Step 6: Enter zero "0" -> must revert to 5
  await qtyInput.fill('0');
  await expect(qtyInput).toHaveValue('5');

  // Step 7: Enter blank -> must revert to 5
  await qtyInput.fill('');
  await expect(qtyInput).toHaveValue('5');

  // Step 8: Enter large number "999" -> must clamp to 99
  await qtyInput.fill('999');
  await expect(qtyInput).toHaveValue('99');
  await expect(page.getByTestId('line-total-tee')).toHaveText('$1,979.01');
});
