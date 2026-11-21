// @ts-check
const { test, expect } = require('@playwright/test');

// ── Clean state: every test starts from a fresh page load ──
test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

// ═══════════════════════════════════════════════════════════
//  AT-01 — Successful checkout produces a confirmation
//  Covers: TC-01, R6
// ═══════════════════════════════════════════════════════════
test('AT-01 successful checkout produces a confirmation', async ({ page }) => {
  // Add Classic Tee
  await page.getByTestId('add-tee').click();

  // Fill name
  await page.getByLabel('Full name').fill('Asha Test');

  // Click Place Order
  await page.getByTestId('place-order').click();

  // Confirmation is visible and contains "Order confirmed"
  const confirmation = page.getByTestId('confirmation');
  await expect(confirmation).toBeVisible();
  await expect(confirmation).toContainText('Order confirmed');

  // Reference matches ORD- plus 8 alphanumeric chars
  const orderRef = page.getByTestId('order-ref');
  await expect(orderRef).toHaveText(/^ORD-[A-Z0-9]{8}$/);

  // Confirmation shows customer name and amount
  await expect(confirmation).toContainText('Asha Test');
  await expect(confirmation).toContainText('$19.99');
});

// ═══════════════════════════════════════════════════════════
//  AT-02 — Missing name blocks checkout
//  Covers: TC-02, R3
// ═══════════════════════════════════════════════════════════
test('AT-02 missing name blocks checkout', async ({ page }) => {
  // Add Classic Tee
  await page.getByTestId('add-tee').click();

  // Leave name blank, click Place Order
  await page.getByTestId('place-order').click();

  // Name error message shown
  const nameError = page.getByTestId('name-error');
  await expect(nameError).toBeVisible();
  await expect(nameError).toHaveText('Please enter your name.');

  // No confirmation appears
  await expect(page.getByTestId('confirmation')).toHaveCount(0);

  // Cart line still visible with quantity 1
  await expect(page.getByTestId('line-tee')).toBeVisible();
  await expect(page.getByTestId('qty-tee')).toHaveValue('1');
});

// ═══════════════════════════════════════════════════════════
//  AT-03 — Quantity change updates the exact total
//  Covers: TC-05, TC-07, R1
// ═══════════════════════════════════════════════════════════
test('AT-03 quantity change updates the exact total', async ({ page }) => {
  // Add Classic Tee, set qty to 3
  await page.getByTestId('add-tee').click();
  await page.getByTestId('qty-tee').fill('3');

  // Verify line total: 3 × $19.99 = $59.97
  await expect(page.getByTestId('line-total-tee')).toHaveText('$59.97');

  // Add Ceramic Mug, set qty to 2
  await page.getByTestId('add-mug').click();
  await page.getByTestId('qty-mug').fill('2');

  // Verify line total: 2 × $7.50 = $15.00
  await expect(page.getByTestId('line-total-mug')).toHaveText('$15.00');

  // Order total: $59.97 + $15.00 = $74.97
  await expect(page.getByTestId('order-total')).toHaveText('$74.97');
});

// ═══════════════════════════════════════════════════════════
//  AT-04 — Double click on Place Order gives one confirmation
//  Covers: TC-16, R2
// ═══════════════════════════════════════════════════════════
test('AT-04 double click on Place Order gives one confirmation', async ({ page }) => {
  // Variant 1: dblclick
  await page.getByTestId('add-tee').click();
  await page.getByLabel('Full name').fill('Double Test');

  // Double-click Place Order
  await page.getByTestId('place-order').dblclick();

  // Exactly one confirmation
  await expect(page.getByTestId('confirmation')).toHaveCount(1);

  // Grab the reference
  const refText = await page.getByTestId('order-ref').textContent();

  // Verify reference stays stable (no second order overwrote it)
  await expect.poll(
    async () => page.getByTestId('order-ref').textContent(),
    { timeout: 1000 }
  ).toBe(refText);

  // Variant 2: click({ clickCount: 3 })
  await page.goto('/');
  await page.getByTestId('add-tee').click();
  await page.getByLabel('Full name').fill('Triple Test');
  await page.getByTestId('place-order').click({ clickCount: 3 });

  await expect(page.getByTestId('confirmation')).toHaveCount(1);
  const refText2 = await page.getByTestId('order-ref').textContent();
  await expect.poll(
    async () => page.getByTestId('order-ref').textContent(),
    { timeout: 1000 }
  ).toBe(refText2);
});

// ═══════════════════════════════════════════════════════════
//  AT-05 — Empty cart blocks checkout
//  Covers: TC-04, R3
// ═══════════════════════════════════════════════════════════
test('AT-05 empty cart blocks checkout', async ({ page }) => {
  // Fill name but leave cart empty
  await page.getByLabel('Full name').fill('No Cart User');

  // Click Place Order
  await page.getByTestId('place-order').click();

  // Cart error shown
  const cartError = page.getByTestId('cart-error');
  await expect(cartError).toBeVisible();
  await expect(cartError).toContainText('Your cart is empty');

  // No confirmation
  await expect(page.getByTestId('confirmation')).toHaveCount(0);

  // Name input still has the typed value
  await expect(page.getByLabel('Full name')).toHaveValue('No Cart User');
});

// ═══════════════════════════════════════════════════════════
//  AT-06 — Validation preserves entered data
//  Covers: TC-13, R4
// ═══════════════════════════════════════════════════════════
test('AT-06 validation preserves entered data', async ({ page }) => {
  // Add item, type name
  await page.getByTestId('add-tee').click();
  await page.getByLabel('Full name').fill('Preserved Name');

  // Remove the item
  await page.getByTestId('remove-tee').click();

  // Try to place order
  await page.getByTestId('place-order').click();

  // Name value is preserved
  await expect(page.getByLabel('Full name')).toHaveValue('Preserved Name');

  // Cart error shown
  await expect(page.getByTestId('cart-error')).toBeVisible();

  // No confirmation
  await expect(page.getByTestId('confirmation')).toHaveCount(0);
});
