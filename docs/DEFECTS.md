# Defect Report and Code Review Audit — Mini Checkout and Browser Test Suite

## 1. Browser Test Execution Status: No Critical Defects Found

All automated tests (`AT-01` through `AT-07`) pass consistently with zero failures across consecutive repeat runs (`npm run test:repeat`, 35/35 passed).
Manual tests `MT-01` and `MT-02` pass with full evidence recorded in `evidence/`.

The application demonstrates:
- Integer-cents money arithmetic eliminating floating-point rounding errors
- Strict synchronous double-click protection (`orderPlaced` boolean flag)
- Safe DOM rendering using `textContent` preventing XSS
- Complete data preservation on validation failures
- In-memory state isolation between test contexts

---

## 2. Resolved Code Review Finding (CR-001)

### Finding Summary
| Attribute | Detail |
|:---|:---|
| **ID** | `CR-001` |
| **Title** | Scientific notation (`1e2`) inconsistency between `Number()` and `parseInt()` |
| **Severity / Priority** | Low / P2 (Edge Case Input Sanitization) |
| **Category** | Code Review Audit Finding |
| **Status** | **RESOLVED & VERIFIED** |

### Observation & Root Cause
In JavaScript runtime parsing:
1. `Number("1e2")` interprets scientific notation as exponential float/integer, returning `100`. `Number.isInteger(100)` evaluates to `true`.
2. `parseInt("1e2", 10)` parses strictly up to the first non-digit character (`'e'`), returning `1`.
3. Under the previous implementation:
   ```javascript
   // Previous vulnerable pattern:
   if (trimmed === '' || isNaN(trimmed) || !Number.isInteger(Number(trimmed))) {
     item.qty = item.lastValidQty;
     return;
   }
   let parsed = parseInt(trimmed, 10); // parsed became 1 instead of reverting
   ```
   This created an inconsistency where entering `1e2` was treated as quantity `1` instead of reverting to `lastValidQty` as documented in the specification and README.

### Remediation Applied
In `app.js` (`updateQuantity`):
Replaced the dual `Number()` / `parseInt()` validation with a strict pure-integer regular expression (`/^\d+$/`) prior to any parsing:
```javascript
// Clean, aligned implementation:
if (trimmed === '' || !/^\d+$/.test(trimmed)) {
  item.qty = item.lastValidQty;
  return;
}
let parsed = parseInt(trimmed, 10);
```
- Non-digit strings, including scientific notation (`1e2`, `2e1`), decimals (`1.5`), negatives (`-1`), and alphabetical characters (`abc`), fail the `/^\d+$/` test and immediately revert to `lastValidQty`.
- Input is never passed to `parseInt()` if it contains non-digit characters.

### Verification & Regression Test
Added dedicated test **`AT-07`** in `tests/checkout.spec.js`:
- Adds an item and sets a valid baseline quantity (`qty = 5`).
- Enters `"1e2"` into the quantity field.
- Asserts that the field **reverts to `5`** and line total remains `$99.95`, proving that `"1e2"` is neither parsed as `1` nor `100`.
- Also asserts `"1.5"`, `"-1"`, `"0"`, and `""` revert to `5`, while `"999"` clamps to `99`.
- Verified passing 100% across automated test suites.

---

## 3. Template for New Defect Logging

```
ID: DEF-001
Title: <short, specific>
Severity / Priority: <High, Medium, Low>
Environment: <OS, browser and version, URL, commit>
Steps to reproduce:
  1.
  2.
  3.
Expected result:
Actual result:
Evidence: <screenshot or video path, console output>
Frequency: <always, intermittent (x of y runs)>
Notes / suspected cause:
```
