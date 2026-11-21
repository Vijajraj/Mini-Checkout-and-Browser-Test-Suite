# Defect Report — Mini Checkout and Browser Test Suite

## Status: No Defects Found

All automated tests (AT-01 through AT-06) pass consistently across 5 consecutive runs.
Manual tests MT-01 and MT-02 pass as expected.
Exploratory testing did not reveal any defects.

The application correctly:
- Calculates totals using integer-cents arithmetic (no floating-point rounding errors)
- Validates both name and cart state before allowing checkout
- Guards against double-click / rapid-click producing duplicate confirmations
- Preserves user input after validation failures
- Renders user-supplied names safely via `textContent` (no XSS vector)
- Reverts invalid quantity inputs to the last valid value
- Clamps quantities above 99 to 99

---

_If a real defect is discovered during further testing, it should be logged below using the template:_

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
