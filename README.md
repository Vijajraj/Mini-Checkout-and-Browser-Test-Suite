---
project: "Mini Checkout and Browser Test Suite"
assessment: "FyndHacks SDET Intern Selection Round"
candidate: "Vijayraj"
repository: "https://github.com/Vijajraj/Mini-Checkout-and-Browser-Test-Suite"
stack:
  runtime: "Node.js >= 18.0.0"
  frontend: "Vanilla HTML5, CSS3, ES6+ (Zero Build Step, No Frameworks)"
  test_framework: "Playwright Test (^1.52.0)"
  browser: "Chromium Only"
  server: "http-server (^14.1.1)"
  linter: "ESLint (^9.20.1, Flat Config)"
  port: 4173
  base_url: "http://127.0.0.1:4173"
state_management: "In-memory only (zero localStorage, zero cookies)"
financial_arithmetic: "Integer-cents (zero floating-point rounding errors)"
anti_race_guard: "Synchronous orderPlaced boolean flag"
xss_prevention: "Strict textContent DOM binding"
---

# Mini Checkout and Browser Test Suite

[![Playwright Tests](https://img.shields.io/badge/playwright-30%2F30%20passed-brightgreen.svg)](#test-suite-coverage--matrix)
[![Strict Linting](https://img.shields.io/badge/eslint-strict%20pass-blue.svg)](#100-automated-execution-scripts)
[![Zero Dead Code](https://img.shields.io/badge/code%20quality-zero%20dead%20code-success.svg)](#zero-dead-code--code-quality-guarantees)
[![Test Reports](https://img.shields.io/badge/reports-JSON%20%7C%20JUnit%20%7C%20HTML-orange.svg)](#machine-readable-test-reports)

A production-grade, zero-framework e-commerce checkout interface paired with an automated Playwright end-to-end browser test suite. Engineered strictly against the **FyndHacks SDET Intern Build and Test Specification**.

![Mini Checkout Preview](evidence/screenshot.png)

---

## 1. Quick Start & 100% Automated Execution

Reviewers and automated CI pipelines can execute everything using standard single-line `npm` scripts:

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browser engine
npx playwright install chromium

# 3. Run all automated checks and tests in one command
npm run verify
```

### Complete npm Script Directory

| Script | Command | Purpose |
|:---|:---|:---|
| `npm start` | `http-server . -p 4173 -c-1` | Serves the web app on `http://127.0.0.1:4173` |
| `npm test` | `playwright test` | Runs the 6 automated browser tests via Playwright |
| `npm run test:repeat` | `playwright test --repeat-each=5` | Executes 30-run flakiness verification suite |
| `npm run test:headed` | `playwright test --headed` | Executes tests with a visible Chromium browser window |
| `npm run report` | `playwright show-report` | Opens the interactive visual HTML test report |
| `npm run lint` | `eslint .` | Runs strict ESLint checks (zero console.log, zero dead code) |
| `npm run verify` | `npm run lint && npm test` | Runs linting followed by the full automated test suite |
| `npm run ci` | `npm run lint && playwright test --repeat-each=5` | Full CI validation gate (lint + 5x repeat run) |

---

## 2. System Architecture & Decisions

```
mini-checkout/
├── index.html               # Semantic HTML5 single-page application
├── styles.css               # Accessible, modern CSS with custom properties
├── app.js                   # Modular vanilla JS (Store, View, App Controller)
├── eslint.config.mjs        # Strict ESLint 9 flat configuration
├── package.json             # 100% automated lifecycle scripts
├── playwright.config.js     # Playwright harness with multi-reporter support
├── tests/
│   └── checkout.spec.js     # Self-documenting, web-first test specifications
├── docs/
│   ├── TEST_PLAN.md         # 2-page risk-based quality assurance test plan
│   ├── TEST_RESULTS.md      # Automated pass rates & manual test execution log
│   └── DEFECTS.md           # Formal defect log (explicit "No defects found")
├── evidence/
│   ├── screenshot.png       # Application UI overview screenshot
│   ├── mt-01.png            # Manual test MT-01 evidence (empty cart validation)
│   ├── mt-02.png            # Manual test MT-02 evidence (double-click guard)
│   └── test-run.txt         # Terminal output from 30/30 repeat execution
└── test-results/
    ├── report.json          # Machine-readable JSON test execution report
    └── results.xml          # Machine-readable JUnit XML test report
```

### Technical Design Choices

1. **Integer-Cents Financial Math**:
   - `Classic Tee`: `1999` cents ($19.99)
   - `Ceramic Mug`: `750` cents ($7.50)
   - Calculations use integer math: `(3 * 1999) + (2 * 750) = 7497` cents ($74.97). Currency formatting is deferred strictly to display time via `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`.
2. **Synchronous Race-Condition Guard**:
   - Double-click and burst-click protection is enforced by setting `this.store.orderPlaced = true` synchronously at the entry of the submit handler *before* any DOM manipulation.
   - All input fields and buttons are disabled immediately upon order confirmation.
3. **In-Memory State**:
   - State is stored exclusively in runtime memory. Zero usage of `localStorage` or `document.cookie`, guaranteeing every automated test starts with a clean slate.
4. **Strict XSS Defense**:
   - Customer-supplied name input is bound strictly via `element.textContent`, preventing HTML/script injection attacks.

---

## 3. Selector Contract (`data-testid`)

All interactive elements and assertions adhere strictly to the specification contract:

| DOM Element | Selector (`data-testid`) | Role / Accessible Label |
|:---|:---|:---|
| Add Classic Tee Button | `add-tee` | `button[type="button"]` |
| Add Ceramic Mug Button | `add-mug` | `button[type="button"]` |
| Cart Line Container | `line-tee`, `line-mug` | Container for cart item row |
| Quantity Input Field | `qty-tee`, `qty-mug` | `input[type="number"][aria-label="..."]` |
| Line Total Text | `line-total-tee`, `line-total-mug` | Display element for line subtotal |
| Remove Item Button | `remove-tee`, `remove-mug` | `button.remove-btn` |
| Order Total Text | `order-total` | Display element for grand total |
| Full Name Input | `name-input` | `input[type="text"][autocomplete="name"]` |
| Name Error Message | `name-error` | `span.error[role="alert"]` |
| Cart Error Message | `cart-error` | `span.error[role="alert"]` |
| Place Order Button | `place-order` | `button[type="submit"]` |
| Confirmation Panel | `confirmation` | `div.confirmation-panel[role="status"]` |
| Order Reference Text | `order-ref` | Alphanumeric span matching `/^ORD-[A-Z0-9]{8}$/` |

---

## 4. Test Suite Coverage & Matrix

Every test uses **web-first assertions** (`toBeVisible`, `toHaveText`, `toHaveValue`, `expect.poll`) with zero fixed sleeps (`no waitForTimeout`):

| Test ID | Category | Behavioral Description | Risk Addressed | Spec Gate |
|:---|:---|:---|:---|:---:|
| **AT-01** | `[Happy Path]` | Adding product and submitting valid name renders confirmation with `ORD-` reference, customer name, and exact amount. | R6 (Unclear/missing confirmation) | ✅ PASS |
| **AT-02** | `[Validation]` | Submitting with empty name displays error message, blocks confirmation, and preserves cart items and quantity. | R3 (Invalid order accepted) | ✅ PASS |
| **AT-03** | `[Calculation]` | Updating product quantities computes exact line totals and order total via integer-cents arithmetic (`3×$19.99 + 2×$7.50 = $74.97`). | R1 (Rounding/stale totals) | ✅ PASS |
| **AT-04** | `[Idempotency]` | Rapid double and triple clicks on place-order trigger synchronous guard, producing exactly one confirmation. | R2 (Duplicate order creation) | ✅ PASS |
| **AT-05** | `[Validation]` | Submitting with empty cart displays cart error, blocks confirmation, and preserves entered customer name. | R3 (Empty cart order accepted) | ✅ PASS |
| **AT-06** | `[Data Preservation]` | Removing items after entering customer name retains input value upon validation failure. | R4 (Lost customer input) | ✅ PASS |

---

## 5. Machine-Readable Test Reports

Automated test runs generate machine-readable artifacts for CI/CD pipelines and programmatic verification:

- **JSON Report:** [`test-results/report.json`](test-results/report.json)
  - Detailed suite metadata, duration, per-test assertions, worker assignment, and status.
- **JUnit XML Report:** [`test-results/results.xml`](test-results/results.xml)
  - Standard JUnit XML format compatible with Jenkins, GitHub Actions, GitLab CI, and CircleCI.
- **Interactive HTML Report:** `playwright-report/index.html` (view with `npm run report`)
- **Reliability Log:** [`evidence/test-run.txt`](evidence/test-run.txt) (terminal log of 30/30 passed repetitions).

---

## 6. Zero Dead Code & Code Quality Guarantees

- **No `console.log` Clutter:** The codebase contains 0 `console.log`, `console.debug`, or leftover debugging statements.
- **Strict Linting Enforcement:** Configured with ESLint 9 enforcing `no-console`, `no-unused-vars`, `eqeqeq`, `no-var`, `prefer-const`, and `semi`.
- **Zero Dead Code:** All declared constants, classes, and helper methods are actively utilized.
- **Defensive Quantity Edge Cases:**
  - Blank, decimal (e.g. `1.5`), negative (e.g. `-1`), zero (`0`), or non-numeric (`abc`, `1e2`) inputs instantly revert to `lastValidQty`.
  - Quantities greater than 99 automatically clamp to `99`.

---

## 7. Assumptions and Scope Boundaries

- **In-Memory Persistence:** State is reset on page refresh by design.
- **Single Currency:** USD ($) only; no taxes, discounts, or shipping calculations.
- **Client-Side Generation:** Order references are generated securely on the client (`crypto.getRandomValues`).
- **Target Browser:** Chromium (per specification locked decision).
- **Out of Scope:** Server-side backend, database, payment gateway processing, authentication, cross-browser matrix.

---

## 8. Verification Evidence & Documentation Links

- 📋 [Risk-Based Test Plan (`docs/TEST_PLAN.md`)](docs/TEST_PLAN.md)
- 📊 [Detailed Test Execution Results (`docs/TEST_RESULTS.md`)](docs/TEST_RESULTS.md)
- 🔍 [Formal Defect Log (`docs/DEFECTS.md`)](docs/DEFECTS.md)
- 📁 [Evidence Directory (`evidence/`)](evidence/)
  - [Reliability Repeat Log (`evidence/test-run.txt`)](evidence/test-run.txt)
  - [Manual Test MT-01 Screenshot (`evidence/mt-01.png`)](evidence/mt-01.png)
  - [Manual Test MT-02 Screenshot (`evidence/mt-02.png`)](evidence/mt-02.png)
