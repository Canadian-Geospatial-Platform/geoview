# Understanding Test Results

This guide explains how to interpret test results from the GeoView Test Suite.

## Test Status Types

Each test can have one of the following statuses:

### ✅ Passed (Success)

The test executed successfully and all assertions passed.

```
Test Adding Esri Dynamic layer
  ✓ Result: Green checkmark
```

**What it means**:

- Test execution completed without errors
- All assertions validated successfully
- Expected behavior confirmed

### ❌ Failed (Error)

The test encountered an error or failed an assertion.

```
Test Adding Custom Layer
  ✗ Result: Red X
  Error Details:
    AssertionValueError: Expected value to equal "success" but got "pending"
```

**What it means**:

- Test execution threw an unexpected error, OR
- Assertion did not pass
- Indicates a problem with the tested functionality

### ⚠️ Skipped

The test was skipped due to unmet preconditions.

```
⊘ Test Advanced Feature - SKIPPED
  Reason: Precondition not met
```

**What it means**:

- Test could not run (e.g., required service unavailable)
- Not a failure, but functionality not verified
- May need investigation if unexpected

### 🔄 Running

The test is currently executing.

```
⟳ Test Loading Layer Data - RUNNING
  Step: Fetching metadata from service...
```

**What it means**:

- Test is in progress
- Current step is displayed
- Wait for completion

## Test Output Structure

### Basic Test Output

```
Test Name
  ✓ Result: Green checkmark (passed) or ✗ Red X (failed)
  Steps:
  • Step 1 description
  • Step 2 description
  • Step 3 description
```

**Components**:

- **Test Name**: Descriptive name of what was tested
- **Result Indicator**: ✓ Green checkmark (passed) or ✗ Red X (failed)
- **Steps**: Granular progress indicators
- **Error Details**: Shown when test fails (red X)

### Detailed Test Output

```
Test Adding Esri Dynamic Histo Flood Events on map
  ✓ Result: Green checkmark
  Steps:
  • Creating the GeoView Layer Configuration...
  • Adding layer to the map...
  • Waiting for layer to be ready...
  • Layer is ready (status: loaded)
  • Performing assertions...
    • Verifying layer exists at path...
    • Checking layer metadata...
    • Validating layer configuration...
  • Assertion passed: All checks successful
  • Removing layer from map...
  • Layer removed successfully
  • Cleanup completed
```

**Hierarchical Steps**:

- **Major steps** (bold): Top-level operations
- **Regular steps**: Detailed sub-operations
- Color coding: Green for success, orange for warnings, red for errors

## Error Test Results (True Negatives)

### Successful Error Test

```
Test Adding Esri Dynamic with bad url (Expected Error)
  ✓ Result: Green checkmark
  Steps:
  • Creating the GeoView Layer Configuration...
  • Adding layer to the map...
  • Waiting for expected error...
  • Expected error thrown: LayerServiceMetadataUnableToFetchError
  • Error message: "Failed to fetch metadata from https://bad-url.com"
  • Assertion passed: Correct error type
  • Cleanup completed
```

**What it means**:

- Test verified that an error was properly thrown
- The error type matches expectations
- Error handling works correctly
- This is a **passing test** (true negative validation)

### Failed Error Test

```
Test Adding Layer with invalid config
  ✗ Result: Red X
  Steps:
  • Creating invalid configuration...
  • Attempting to add layer...
  • No error was thrown (expected: ConfigValidationError)
  Error Details:
    AssertionNoErrorThrownError: Expected error of type ConfigValidationError but no error occurred
```

**What it means**:

- Test expected an error to be thrown
- No error occurred (bug: validation missing)
- Error handling is not working correctly
- This is a **failing test** (should catch errors but doesn't)

## Common Error Types

### Assertion Errors

#### AssertionValueError

```
Test Layer Status Check
  ✗ Result: Red X
  Error Details:
    AssertionValueError: Expected value to equal "loaded" but got "error"
      at: layer.status
```

**Cause**: Actual value doesn't match expected value
**Action**: Check if functionality changed or expectation is wrong

#### AssertionUndefinedError

```
Test Layer Metadata Check
  ✗ Result: Red X
  Error Details:
    AssertionUndefinedError: Expected value to be defined but got undefined
      at: layer.metadata
```

**Cause**: Expected property/value is undefined
**Action**: Verify property exists and is properly initialized

#### AssertionJSONObjectError

```
Test Configuration Structure
  ✗ Result: Red X
  Error Details:
    AssertionJSONObjectError: JSON object structure mismatch
      Mismatches:
      - config.layers[0].type — actual: "esriFeature", expected: "esriDynamic"
      - config.visible — actual: false, expected: true
```

**Cause**: Object structure or values don't match expected
**Action**: Review object structure and ensure all expected properties match

#### AssertionWrongInstanceError

```
Test Layer Type Check
  ✗ Result: Red X
  Error Details:
    AssertionWrongInstanceError: Expected instance of EsriDynamic but got EsriFeature
```

**Cause**: Object is wrong type/class
**Action**: Verify object creation and type casting

### Runtime Errors

#### Network Errors

```
Test Service Connection
  ✗ Result: Red X
  Error Details:
    Failed to fetch: https://services.example.com/MapServer
    Network request failed (timeout after 30s)
```

**Cause**: Service unavailable or network issue
**Action**: Check network connectivity and service status

#### Layer Errors

```
Test Layer Initialization
  ✗ Result: Red X
  Error Details:
    LayerStatusErrorError: Layer failed to initialize
      Layer status: error
      Message: Unsupported layer version
```

**Cause**: Layer initialization failed
**Action**: Review layer configuration and service capabilities

## Test Suite Summary

At the end of a test suite, you'll see a summary:

```
Config Test Suite - Completed
=====================================
Total Tests: 45
✓ Passed: 42 (93.3%)
✗ Failed: 2 (4.4%)
⊘ Skipped: 1 (2.2%)
```

**Metrics**:

- **Total Tests**: Number of tests in the suite
- **Passed**: Successfully executed tests (green checkmarks)
- **Failed**: Tests that encountered errors (red X marks)
- **Skipped**: Tests that couldn't run

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
