# Test Plan — Mini Checkout and Browser Test Suite

## 1. Scope and Objective

**What is tested:**
- The checkout page journey of a vanilla HTML/CSS/JS mini e-commerce application
- Cart management (add, update quantity, remove items)
- Order total calculation using integer-cents arithmetic
- Checkout form validation (name required, cart non-empty)
- Order confirmation with reference generation
- Double-click / rapid-click guard on Place Order
- Input preservation after validation failures

**What is not tested:**
- Backend, API, database, or server-side logic (none exists)
- Payment processing, authentication, shipping, tax, or discounts
- Cross-browser testing (Chromium only)
- Mobile device testing
- Formal accessibility audit (only basic keyboard-flow check)
- Performance or load testing

## 2. Environment

| Component         | Version / Detail                     |
|-------------------|--------------------------------------|
| OS                | Windows 11                           |
| Node.js           | 18+ (LTS)                            |
| Playwright        | ^1.52.0                              |
| Browser           | Chromium (Playwright bundled)        |
| Application URL   | http://localhost:4173                |
| Server            | http-server (npm `start` script)     |

## 3. Risk-Based Priorities

| Rank | Risk                                                 | Impact | Likelihood | Covered By        |
|------|------------------------------------------------------|--------|------------|-------------------|
| R1   | Wrong total or line total (rounding, stale update)   | High   | Medium     | AT-03, TC-05–TC-07 |
| R2   | Duplicate order / double confirmation on rapid clicks| High   | Medium     | AT-04, MT-02      |
| R3   | Invalid order accepted (empty cart or blank name)    | High   | Medium     | AT-02, AT-05, MT-01|
| R4   | Customer input lost after a validation error         | Medium | Medium     | AT-06             |
| R5   | Quantity edge cases (0, negative, decimal, huge, blank)| Medium| High       | TC-08–TC-12       |
| R6   | Confirmation unclear or missing reference            | Medium | Low        | AT-01             |
| R7   | Name rendered unsafely (script/HTML injection)       | Medium | Low        | TC-14             |
| R8   | Keyboard-only use broken                             | Low    | Medium     | TC-15             |

## 4. Test Cases

| ID    | Description                                              | Priority | Type               |
|-------|----------------------------------------------------------|----------|--------------------|
| TC-01 | Successful checkout shows confirmation with reference    | P1       | Auto (AT-01)       |
| TC-02 | Blank name blocks checkout with message                  | P1       | Auto (AT-02)       |
| TC-03 | Whitespace-only name blocks checkout                     | P1       | Manual or auto     |
| TC-04 | Empty cart blocks checkout                               | P1       | Auto (AT-05), Manual (MT-01) |
| TC-05 | Qty change updates line and order totals exactly         | P1       | Auto (AT-03)       |
| TC-06 | Remove item updates total                                | P2       | Manual             |
| TC-07 | Mixed cart total is exact (3 × $19.99 + 2 × $7.50 = $74.97) | P1 | Auto (AT-03)       |
| TC-08 | Qty 0 reverts to last valid                              | P2       | Auto (AT-07), Manual |
| TC-09 | Qty negative reverts                                     | P2       | Auto (AT-07), Manual |
| TC-10 | Qty decimal (1.5) reverts                                | P2       | Auto (AT-07), Manual |
| TC-11 | Qty 999 clamps to 99                                     | P2       | Auto (AT-07), Manual |
| TC-12 | Qty blank, text, or scientific notation (1e2) reverts   | P2       | Auto (AT-07), Manual |
| TC-13 | Entered name preserved after validation failure          | P1       | Auto (AT-06)       |
| TC-14 | Name `<img src=x onerror=alert(1)>` renders as plain text| P2      | Manual             |
| TC-15 | Full flow works by keyboard only                         | P3       | Manual             |
| TC-16 | After success, controls are locked, second Place Order does nothing | P1 | Auto (AT-04) |
| TC-17 | Refresh after success returns to a clean empty cart      | P3       | Manual             |

## 5. Entry and Exit Criteria

**Entry criteria:**
- Application loads at http://localhost:4173
- All `data-testid` selectors are present in the DOM
- Playwright and Chromium are installed

**Exit criteria:**
- All P1 test cases executed
- All 6 automated checks (AT-01 to AT-06) pass green
- Automated suite passes 5 consecutive runs (`--repeat-each=5`)
- All real defects are logged in `docs/DEFECTS.md`
- Manual tests MT-01 and MT-02 executed with evidence

## 6. Manual Tests

### MT-01 — Empty Cart
Open the page, leave the cart empty, type a name, click Place Order.
**Expected:** Cart error shown ("Your cart is empty…"), no confirmation, name preserved.

### MT-02 — Rapid Double Click
Add an item, type a name, then double-click Place Order as fast as possible. Repeat with triple click, and with pressing Enter twice in the name field. Optionally set CPU throttling to 6× slowdown in DevTools and repeat.
**Expected:** Exactly one confirmation and one reference.

## 7. Exploratory Checklist (15 minutes)
- Whitespace-only name
- Very long name (300 characters)
- Name with emoji or accents
- Quantity fields with `1e2`, `-1`, `0`, `1.5`, `999`, blank
- Add item then remove it then Place Order
- Change quantity after a failed submit
- Browser Back and Refresh
- Tab order and Enter key submission
- Zoomed layout at 200%

## 8. Assumptions and Known Gaps
- State is in-memory only; page refresh clears the cart
- Single currency (USD), no tax, shipping, or discounts
- Chromium only; no cross-browser or mobile testing
- Order reference is random and client-generated, not unique across sessions
- No formal accessibility audit; only keyboard-flow check
- No performance or load testing; no backend exists to test
