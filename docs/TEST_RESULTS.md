# Test Results — Mini Checkout and Browser Test Suite

## 1. Automated Test Results

### Environment
| Component         | Version / Detail                     |
|-------------------|--------------------------------------|
| OS                | Windows 11                           |
| Node.js           | v24.13.0                             |
| Playwright        | ^1.52.0                              |
| Browser           | Chromium (Playwright bundled v1255)  |
| Application URL   | http://localhost:4173                |

### Single Run Summary

| ID    | Test Name                                          | Result | Duration | Notes |
|-------|----------------------------------------------------|--------|----------|-------|
| AT-01 | Successful checkout produces a confirmation        | ✅ Pass | 844ms    | Full happy path, reference matches regex |
| AT-02 | Missing name blocks checkout                       | ✅ Pass | 266ms    | Validation error, 0 confirmations, cart preserved |
| AT-03 | Quantity change updates the exact total             | ✅ Pass | 298ms    | 3×$19.99 + 2×$7.50 = $74.97 verified |
| AT-04 | Double click on Place Order gives one confirmation | ✅ Pass | 639ms    | Synchronous boolean guard verified |
| AT-05 | Empty cart blocks checkout                         | ✅ Pass | 208ms    | Cart error displayed, name preserved |
| AT-06 | Validation preserves entered data                  | ✅ Pass | 302ms    | Name input retained across cart clear and submit |

**Total: 6 passed, 0 failed, 0 skipped (5.0s)**

### Repeat Run (`--repeat-each=5`)

All 6 tests × 5 repetitions = **30 runs, 30 passed, 0 failed (18.9s)**.

No flakiness detected. Full terminal output saved to [`evidence/test-run.txt`](../evidence/test-run.txt).

## 2. Manual Test Results

| Run     | Date/Time               | Browser/Version     | Steps                                                                        | Expected                                            | Actual                                                                     | Result  | Evidence File          |
|---------|-------------------------|---------------------|------------------------------------------------------------------------------|-----------------------------------------------------|----------------------------------------------------------------------------|---------|------------------------|
| MT-01-a | 2026-11-21 19:32 IST    | Chromium 159.0.8154 | Open page → leave cart empty → type name "Manual Tester" → click Place Order | Cart error shown, no confirmation, name preserved   | Cart error shown, 0 confirmation elements, "Manual Tester" remained in input | ✅ Pass | `evidence/mt-01.png`   |
| MT-02-a | 2026-11-21 19:32 IST    | Chromium 159.0.8154 | Add Classic Tee → type name "Double Clicker" → rapid double-click Place Order | Exactly one confirmation and one reference generated | Exactly 1 confirmation panel, single reference ORD-XXXXXXXX, inputs locked | ✅ Pass | `evidence/mt-02.png`   |

## 3. HTML Report

After running `npm test`, view the full interactive HTML report with:
```bash
npm run report
```

The HTML report is generated at `playwright-report/index.html`.
