# Understanding Test Results

This content has been consolidated into [Using the Test Suite — Understanding Results](./using-test-suite.md#understanding-results).

## Interpreting Results

### All Tests Passed ✓

```
✓✓✓✓✓ All tests passed! (100%)
```

**Meaning**: All functionality tested is working as expected
**Action**: None required, system is healthy

### Some Tests Failed ✗

```
✓✓✓✗✓✗ 4/6 tests passed (66.7%)
```

**Meaning**: Some functionality is broken
**Action**: Review failed test details and fix issues

### Tests Skipped ⊘

```
✓✓⊘✓✓ 4/5 tests passed, 1 skipped (80% + 20% skipped)
```

**Meaning**: Some tests couldn't run
**Action**: Investigate why tests were skipped (preconditions, services down)

## Common Failure Scenarios

### Service Unavailable

```
✗ Multiple tests failed with "Failed to fetch"
```

**Likely Cause**: External service down or unreachable
**Action**: Check service status, verify network connectivity

### Configuration Change

```
✗ Tests failing with "Property not found: xyz"
```

**Likely Cause**: Configuration schema changed
**Action**: Update test expectations to match new schema

### API Change

```
✗ Tests failing with "Method not found" or "Wrong parameter count"
```

**Likely Cause**: API method signature changed
**Action**: Update test code to use new API

### Timing Issue

```
✗ Test fails intermittently with "Timeout waiting for event"
```

**Likely Cause**: Async operation taking longer than expected
**Action**: Review timeouts, check for race conditions

## Debugging Failed Tests

### Step 1: Review Test Steps

Look at which step failed:

```
Test Adding Layer
  ✗ Result: Red X
  Steps:
  • Creating configuration...
  • Adding layer to map...
  • Waiting for layer to be ready... [FAILED HERE]
```

**Focus**: The operation that failed (waiting for layer ready)

### Step 2: Check Error Details

```
  Error Details:
    LayerStatusErrorError: Layer status changed to 'error'
      Details: Metadata fetch failed (404 Not Found)
```

**Information**: Specific reason for failure (404 error)

### Step 3: Verify Preconditions

- Is the service URL still valid?
- Are credentials required?
- Has the service structure changed?

### Step 4: Reproduce Manually

Try the operation manually in the viewer:

1. Load the same configuration
2. Add the same layer
3. Observe behavior

### Step 5: Check Recent Changes

- Did code change recently?
- Did service provider update?
- Did configuration schema change?

## Best Practices

### Monitoring Test Results

#### During Development

- Run relevant test suites after code changes
- Fix failures before committing
- Don't ignore skipped tests

#### In CI/CD

- Run all test suites on every build
- Block merges if tests fail
- Track test execution time trends

#### In Production

- Run smoke tests after deployments
- Monitor for regression
- Alert on consistent failures

### Handling Failures

#### Temporary Failures

External service issues, network problems
**Action**: Re-run tests, investigate if persistent

#### Real Failures

Code bugs, broken functionality
**Action**: Fix immediately, add regression tests

#### Expected Failures

Known issues, work in progress
**Action**: Document, track in issue tracker

## Example Interpretations

### Scenario 1: Single Layer Test Fails

```
Suite: Layer Test Suite
Test Esri Dynamic layer: ✓
Test Esri Feature layer: ✓
Test WMS layer: ✗ (Service unavailable)
Test GeoJSON layer: ✓
```

**Interpretation**: WMS service is down, other layer types work fine
**Action**: Check WMS service status, may not be code issue

### Scenario 2: All Config Tests Fail

```
Suite: Config Test Suite
Test Esri Dynamic config: ✗
Test WMS config: ✗
Test GeoJSON config: ✗
```

**Interpretation**: Configuration system is broken
**Action**: Review recent configuration changes, likely code issue

### Scenario 3: Intermittent Failures

```
Run 1: Test: ✓
Run 2: Test: ✗ (timeout)
Run 3: Test: ✓
```

**Interpretation**: Timing/race condition issue
**Action**: Review async operations, add proper waits

## Next Steps

- Learn how to [create custom tests](app/testing/creating-tests.md)
- Review [available test suites](app/testing/available-suites.md)
- Read [test architecture documentation](app/testing/test-architecture.md)
