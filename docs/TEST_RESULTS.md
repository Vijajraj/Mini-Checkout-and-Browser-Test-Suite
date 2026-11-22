# Test Results — Mini Checkout and Browser Test Suite

## 1. Automated Test Results

### Environment
| Component         | Version / Detail                     |
|-------------------|--------------------------------------|
| OS                | Windows 11                           |
| Node.js           | v24.13.0                             |
| Playwright        | ^1.52.0                              |
| Browser           | Chromium (Playwright bundled v1255)  |
| Application URL   | http://127.0.0.1:4173                |

### Single Run Summary (`npm test`)

| ID | Test Name | Result | Duration | Notes |
|:---|:---|:---:|:---:|:---|
| **AT-01** | `[Happy Path] adding product and submitting valid name renders confirmation with ORD- reference, name, and exact amount` | Pass | 801ms | Happy path verified, crypto reference matches `/^ORD-[A-Z0-9]{8}$/` |
| **AT-02** | `[Validation] submitting with empty name displays error message, blocks confirmation, and preserves cart line` | Pass | 352ms | Name validation error displayed, 0 confirmations, cart preserved |
| **AT-03** | `[Calculation] updating product quantities computes exact line totals and order total via integer-cents arithmetic` | Pass | 365ms | 3 x $19.99 ($59.97) + 2 x $7.50 ($15.00) = $74.97 exact total |
| **AT-04** | `[Idempotency] rapid double and triple clicks on place-order trigger synchronous guard, producing exactly one confirmation` | Pass | 519ms | Synchronous boolean guard verified with polling assertion |
| **AT-05** | `[Validation] submitting with empty cart displays cart error, blocks confirmation, and preserves entered customer name` | Pass | 327ms | Cart error displayed, customer name preserved |
| **AT-06** | `[Data Preservation] removing items after entering customer name retains input value upon validation failure` | Pass | 475ms | Input value preserved across cart item removal |

**Total: 6 passed, 0 failed, 0 skipped (4.4s)**

### Reliability Repeat Run (`npm run test:repeat` / `--repeat-each=5`)

All 6 tests × 5 repetitions = **30 runs, 30 passed, 0 failed (19.3s)**.

Zero flakiness detected. Full terminal output saved to [`evidence/test-run.txt`](../evidence/test-run.txt).

---

## 2. Machine-Readable Test Artifacts

The test harness produces standard machine-readable reports on every run:

1. **JSON Test Report:** [`test-results/report.json`](../test-results/report.json)
2. **JUnit XML Report:** [`test-results/results.xml`](../test-results/results.xml)
3. **Interactive HTML Report:** Generated at `playwright-report/index.html` (view via `npm run report`)

---

## 3. Manual Test Results

| Run | Date/Time | Browser/Version | Steps | Expected | Actual | Result | Evidence File |
|:---|:---|:---|:---|:---|:---|:---:|:---|
| **MT-01-a** | 2026-11-21 19:32 IST | Chromium 159.0.8154 | Open page -> leave cart empty -> type name "Manual Tester" -> click Place Order | Cart error shown, no confirmation, name preserved | Cart error shown, 0 confirmation elements, "Manual Tester" retained | Pass | [`evidence/mt-01.png`](../evidence/mt-01.png) |
| **MT-02-a** | 2026-11-21 19:32 IST | Chromium 159.0.8154 | Add Classic Tee -> type name "Double Clicker" -> rapid double-click Place Order | Exactly one confirmation and one reference generated | Exactly 1 confirmation panel, single reference ORD-XXXXXXXX, inputs locked | Pass | [`evidence/mt-02.png`](../evidence/mt-02.png) |

---

## 4. Code Quality & Linting Audit (`npm run lint`)

- **Tool:** ESLint 9 (Strict Flat Configuration)
- **Rules Enforced:** `no-console`, `no-unused-vars`, `eqeqeq`, `no-var`, `prefer-const`, `semi`
- **Result:** **0 errors, 0 warnings**
- **Dead Code Audit:** 0 unused functions, 0 dead code paths, 0 console.log clutter.
