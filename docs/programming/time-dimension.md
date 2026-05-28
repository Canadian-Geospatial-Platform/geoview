# Time Dimension Architecture

This document explains how GeoView handles temporal data from OGC (WMS) and ESRI services, how time dimensions are parsed into a unified internal model, and how the time slider UI is configured from that model.

## Table of Contents

- [Service Standards](#service-standards)
  - [OGC WMS Time Dimension](#ogc-wms-time-dimension)
  - [ESRI Time Dimension](#esri-time-dimension)
  - [Comparison Table](#comparison-table)
- [Internal Model](#internal-model)
  - [TimeDimension Type](#timedimension-type)
  - [RangeItems Type](#rangeitems-type)
- [Range Types](#range-types)
  - [Discrete Range](#discrete-range)
  - [Absolute Range](#absolute-range)
  - [Relative Range](#relative-range)
  - [Detection Logic](#detection-logic)
- [Data Flow Pipeline](#data-flow-pipeline)
  - [OGC WMS Path](#ogc-wms-path)
  - [ESRI Path](#esri-path)
  - [Pipeline Diagram](#pipeline-diagram)
- [Slider Handle Modes](#slider-handle-modes)
  - [Single Handle vs Dual Handle](#single-handle-vs-dual-handle)
  - [Handle Resolution Priority](#handle-resolution-priority)
  - [Default Values](#default-values)
- [Filter Generation](#filter-generation)
  - [WMS TIME Parameter](#wms-time-parameter)
  - [ESRI Image](#esri-image)
  - [ESRI Dynamic / Vector](#esri-dynamic--vector)
- [Nearest Values Modes](#nearest-values-modes)
  - [Discrete Mode](#discrete-mode)
  - [Continuous Mode](#continuous-mode)
- [Plugin Config Override](#plugin-config-override)

---

## Service Standards

### OGC WMS Time Dimension

The WMS specification (OGC WMS 1.1.1 / 1.3.0) defines temporal extent via the `<Dimension>` element in GetCapabilities responses.

**GetCapabilities example:**

```xml
<Dimension name="time" units="ISO8601" default="2025-01-01T05:00:00.000Z">
  1696-01-01T05:00:00.000Z/2025-01-01T05:00:00.000Z/P1Y
</Dimension>
```

**Parsed metadata fields:**

| Field            | Description                                                                                   | Example                                                   |
| ---------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `name`           | Dimension name (always `"time"` for temporal)                                                 | `"time"`                                                  |
| `units`          | Unit system                                                                                   | `"ISO8601"`                                               |
| `default`        | Default value the server uses when TIME is omitted                                            | `"2025-01-01T05:00:00.000Z"`                              |
| `multipleValues` | Whether the server accepts multiple values in a single TIME request (`"1"` = yes, `"0"` = no) | `"1"`                                                     |
| `nearestValue`   | Whether the server snaps to the nearest available value (`"1"` = yes, `"0"` = no)             | `"0"`                                                     |
| `values`         | The dimension extent — defines available time points                                          | `"1696-01-01T05:00:00.000Z/2025-01-01T05:00:00.000Z/P1Y"` |

The `values` string determines the range type and follows three possible formats (see [Range Types](#range-types)).

> **Note on `multipleValues`:** The OGC attribute `multipleValues="1"` indicates the server accepts comma-separated values (e.g., `TIME=date1,date2,date3`) or ranges in a single request. GeoView uses this attribute, together with the `default` attribute, as a signal for determining the slider handle count — see [Default Values and Handle Count](#default-values-and-handle-count).

**WMS TIME request parameter:**

The WMS `GetMap` / `GetFeatureInfo` request includes temporal filtering via the `TIME` parameter:

```
TIME=2020-01-01T00:00:00Z           (single value)
TIME=2020-01-01T00:00:00Z/2025-01-01T00:00:00Z  (range)
```

### ESRI Time Dimension

ESRI services (MapServer, ImageServer, FeatureServer) expose temporal metadata via the `timeInfo` object in the service's JSON metadata endpoint.

**Service metadata example:**

```json
{
  "timeInfo": {
    "startTimeField": "event_date",
    "endTimeField": "end_date",
    "timeExtent": [1609459200000, 1672531200000],
    "timeInterval": 1,
    "timeIntervalUnits": "esriTimeUnitsYears",
    "hasLiveData": false
  }
}
```

**Metadata fields:**

| Field               | Description                                 | Example                          |
| ------------------- | ------------------------------------------- | -------------------------------- |
| `startTimeField`    | Field name for the start date               | `"event_date"`                   |
| `endTimeField`      | Optional field name for the end date        | `"end_date"`                     |
| `trackIdField`      | Optional field for tracking unique entities | `"station_id"`                   |
| `timeExtent`        | `[startEpoch, endEpoch]` in milliseconds    | `[1609459200000, 1672531200000]` |
| `timeInterval`      | Numeric interval between time steps         | `1`                              |
| `timeIntervalUnits` | Unit for the interval                       | `"esriTimeUnitsYears"`           |
| `hasLiveData`       | Whether the service has live/streaming data | `false`                          |

**ESRI time interval units mapping:**

| ESRI Unit             | ISO 8601 Duration |
| --------------------- | ----------------- |
| `esriTimeUnitsHours`  | `PTnH`            |
| `esriTimeUnitsDays`   | `PnD`             |
| `esriTimeUnitsWeeks`  | `PnW`             |
| `esriTimeUnitsMonths` | `PnM`             |
| `esriTimeUnitsYears`  | `PnY`             |

### Comparison Table

| Aspect                 | OGC WMS                                      | ESRI                                            |
| ---------------------- | -------------------------------------------- | ----------------------------------------------- |
| **Metadata source**    | GetCapabilities XML `<Dimension>`            | Service JSON `/MapServer?f=json` → `timeInfo`   |
| **Date format**        | ISO 8601 strings                             | Epoch milliseconds                              |
| **Extent definition**  | `values` string (3 formats)                  | `timeExtent: [start, end]`                      |
| **Step/interval**      | ISO 8601 duration in values (`/P1Y`)         | `timeInterval` + `timeIntervalUnits`            |
| **Field name**         | `name` (generic, e.g. `"time"`)              | `startTimeField` (actual DB field name)         |
| **Default value**      | `default` attribute on `<Dimension>`         | Not provided (uses full extent)                 |
| **Range support**      | `TIME=start/end` in request                  | `time=epoch1,epoch2` in request                 |
| **Discrete dates**     | Comma-separated in `values`                  | Not natively supported (computed from interval) |
| **Single/dual handle** | Inferred from `default` and `multipleValues` | No metadata indicator                           |

**Key difference:** OGC WMS provides indirect signals for single vs dual handle via the `default` attribute (present → single handle) and `multipleValues` attribute (`"0"` → single handle). ESRI has no equivalent metadata. GeoView defaults to **dual handle** when no signal is present and allows plugin config override.

---

## Internal Model

### TimeDimension Type

Both OGC and ESRI metadata are normalized into a single `TimeDimension` type defined in `date-mgt.ts`:

```typescript
type TimeDimension = {
  field: string; // Field name for filtering
  default: string[]; // Default value(s) — 1 element (single) or 2 (range)
  unitSymbol?: string; // Unit symbol (e.g. "ISO8601")
  rangeItems: RangeItems; // Parsed range data
  nearestValues: "discrete" | "continuous"; // Slider snap behavior
  singleHandle: boolean; // Single or dual handle mode
  displayDateFormat?: TypeDisplayDateFormat;
  displayDateFormatShort?: TypeDisplayDateFormat;
  serviceDateTemporalMode?: TemporalMode;
  displayDateTimezone?: TimeIANA;
  isValid: boolean; // Whether the dimension has a usable range
};
```

### RangeItems Type

```typescript
type RangeItems = {
  type: string; // 'discrete' | 'relative' | 'none'
  range: string[]; // Array of ISO 8601 date strings
};
```

Note: Absolute ranges are converted to discrete arrays during parsing, so `type` is `'discrete'` for both discrete and absolute inputs.

---

## Range Types

The OGC `values` string (and the ESRI-to-OGC converted string) follows three possible patterns. Detection is based on string structure:

### Discrete Range

**Format:** Comma-separated individual dates.

```
1696,1701,1734,1741,1760
2020-01-01T00:00:00Z,2021-01-01T00:00:00Z,2022-01-01T00:00:00Z
```

**Behavior:**

- Each value is an explicit, known time point
- No computation needed — values are used directly
- Slider snaps to these exact values (`nearestValues: 'discrete'`)
- `RangeItems.type = 'discrete'`

**Use case:** Layers with sparse, irregular time points (e.g., specific survey dates).

### Absolute Range

**Format:** `start/end/period` — three slash-separated segments.

```
2002-09-01T00:00:00Z/2025-01-01T00:00:00Z/P1Y
1696-01-01T05:00:00.000Z/2025-01-01T05:00:00.000Z/P1Y
```

**Behavior:**

- `start` and `end` are ISO 8601 dates
- `period` is an ISO 8601 duration (e.g., `P1Y`, `P1M`, `P1D`, `PT1H`)
- GeoView expands this into a discrete array by iterating from start to end, adding the duration at each step
- Has a 10,000-iteration safety guard to prevent infinite loops from malformed durations
- `nearestValues: 'discrete'` (the expanded array acts like discrete points)
- `RangeItems.type = 'discrete'`

**Use case:** Most common for WMS/ESRI — regular intervals over a date range (yearly, monthly, daily data).

### Relative Range

**Format:** `start/end` or `start/duration` — two slash-separated segments.

```
2022-04-27T14:50:00Z/2022-04-27T17:50:00Z
2022-04-27T14:50:00Z/PT10M
```

**Behavior:**

- If the second segment is a valid ISO date → range is `[start, end]`
- If the second segment is an ISO 8601 duration → end is computed as `start + duration`
- Only produces a two-element array `[start, end]`
- Slider allows free movement between min and max (`nearestValues: 'continuous'`)
- GeoView computes an estimated step via `guessEstimatedStep()` based on the total interval length
- `RangeItems.type = 'relative'`

**Use case:** Near-real-time or live data with dense temporal coverage (e.g., weather radar updated every 10 minutes).

### Detection Logic

Detection is ordered and mutually exclusive:

```typescript
// 1. Discrete: comma-separated values
if (values.split(',').length > 1) → discrete

// 2. Relative: exactly 2 slash-separated segments (start/end OR start/duration)
else if (values.split('/').length === 2) → relative

// 3. Absolute: exactly 3 slash-separated segments (start/end/period)
else if (values.split('/').length === 3) → absolute
```

---

## Data Flow Pipeline

### OGC WMS Path

```
WMS GetCapabilities
  → XML <Dimension name="time" values="start/end/P1Y" default="...">
  → Parsed into TypeMetadataWMSCapabilityLayerDimension { name, values, default, units }
  → DateMgt.createDimensionFromOGC(dimensionObject)
    → createRangeOGC(dimensionObject.values)
      → Detects range type (discrete/relative/absolute)
      → Returns RangeItems { type, range[] }
    → Builds TimeDimension { singleHandle: false, nearestValues, default, ... }
  → layerConfig.setTimeDimension(timeDimension)
```

### ESRI Path

```
ESRI Service JSON
  → timeInfo: { startTimeField, timeExtent: [epoch1, epoch2], timeInterval, timeIntervalUnits }
  → EsriLayerCommon.#commonProcessTimeDimension(layerConfig, timeInfo)
    → DateMgt.createDimensionFromESRI(timeInfo, displayDateMode, singleHandle=false)
      → Converts ESRI epochs to ISO dates + ESRI units to ISO duration
      → Builds OGC-style string: "2020-01-01T00:00:00Z/2025-01-01T00:00:00Z/P1Y"
      → createRangeOGC(dimensionValues)  ← Same parser as OGC
      → Returns RangeItems { type, range[] }
    → Builds TimeDimension { singleHandle: false, nearestValues, default, ... }
  → layerConfig.setTimeDimension(timeDimension)
```

**Key design:** ESRI metadata is converted to OGC-style strings so that `createRangeOGC()` is the single shared parser for both standards.

### Pipeline Diagram

```
┌─────────────────────┐    ┌──────────────────────┐
│  WMS GetCapabilities │    │  ESRI Service JSON   │
│  <Dimension> XML     │    │  timeInfo object     │
└────────┬────────────┘    └──────────┬───────────┘
         │                            │
         ▼                            ▼
  createDimensionFromOGC()    createDimensionFromESRI()
         │                            │
         │                  ┌─────────┘
         │                  │ Convert epochs + units
         │                  │ to OGC-style string
         │                  ▼
         └──────►  createRangeOGC()  ◄──────┘
                       │
                 ┌─────┼─────┐
                 ▼     ▼     ▼
            discrete  abs  relative
                 │     │     │
                 └─────┼─────┘
                       ▼
                  TimeDimension
                       │
                       ▼
          TimeSliderController
          #getInitialTimeSliderValues()
                       │
                       ▼
            TypeTimeSliderValues
                       │
                       ▼
              Zustand Store
          (addStoreTimeSliderLayer)
                       │
                       ▼
           TimeSlider Component
            (MUI Slider UI)
```

---

## Slider Handle Modes

### Single Handle vs Dual Handle

| Mode              | Handles | Default Values          | Filter Output                 | UI                        |
| ----------------- | ------- | ----------------------- | ----------------------------- | ------------------------- |
| **Single handle** | 1       | `[lastDate]`            | Single point or narrow window | One thumb, no lock button |
| **Dual handle**   | 2       | `[firstDate, lastDate]` | Date range between two values | Two thumbs, lock button   |

The MUI `<Slider>` component automatically shows the correct number of thumbs based on whether `value` is a single-element or two-element array.

### Handle Resolution Priority

The `singleHandle` value is resolved in `TimeSliderController.#getInitialTimeSliderValues()` with the following priority:

```typescript
const singleHandle =
  configTimeDimension?.singleHandle ?? // 1. Plugin config (highest)
  layerTimeDimensionInfo?.singleHandle ?? // 2. Layer metadata
  false; // 3. Default (dual handle)
```

1. **Plugin config** (`corePackagesConfig → time-slider → sliders[n].timeDimension.singleHandle`) — Explicit override per slider
2. **Layer metadata** (`TimeDimension.singleHandle`) — Set during metadata parsing
3. **Default** — `false` (dual handle)

Both OGC and ESRI default to `singleHandle: false` (dual handle). ESRI has no metadata that distinguishes single vs dual. OGC WMS provides two indirect signals: `default` and `multipleValues`.

### Default Values and Handle Count

**The number of slider thumbs is driven by the `default` array length**, not by `singleHandle` alone. The MUI `<Slider>` component renders one thumb when `value` is a single-element array and two thumbs when it is a two-element array.

For **OGC WMS**, two attributes on `<Dimension>` act as signals:

1. **`default` attribute** — The strongest signal:
   - **Present** → `defaultValues = [default]` (1 element) → **1 thumb** (single handle)
   - **Absent** → `defaultValues = [range[0], range[last]]` (2 elements) → **2 thumbs** (dual handle)

2. **`multipleValues` attribute** — A secondary signal:
   - **`multipleValues="0"`** → The server only accepts a single `TIME=date` value → **1 thumb** (single handle)
   - **`multipleValues="1"`** → The server accepts multiple values or ranges → dual handle is appropriate
   - **Absent** → No additional signal, fall back to the `default`-based heuristic

**Resolution logic:** When `default` is present, it always wins (single handle). When `default` is absent and `multipleValues="0"`, the slider uses single handle because the server cannot accept a range. When both are absent, GeoView defaults to dual handle (best guess for interval selection).

| `default` present? | `multipleValues` | Result       | Reasoning                             |
| ------------------ | ---------------- | ------------ | ------------------------------------- |
| Yes                | Any / absent     | **1 thumb**  | `default` is the definitive signal    |
| No                 | `"0"`            | **1 thumb**  | Server only accepts single value      |
| No                 | `"1"` / absent   | **2 thumbs** | Best guess — server can handle ranges |

Examples from real services:

```xml
<!-- default present → 1 handle (near-real-time weather radar, 3-hour window) -->
<Dimension name="time" default="2026-05-27T14:12:00Z">
  2026-05-27T11:12:00Z/2026-05-27T14:12:00Z/PT6M
</Dimension>

<!-- default absent, multipleValues=1 → 2 handles (historical flood imagery) -->
<Dimension name="time" units="ISO8601" multipleValues="1" nearestValue="0">
  2005-05-01T10:25:07.000,2008-05-03T22:12:50.000,...
</Dimension>

<!-- default absent, multipleValues absent → 2 handles (historical data) -->
<Dimension name="time">
  1696-01-01T05:00:00.000Z/2025-01-01T05:00:00.000Z/P1Y
</Dimension>

<!-- default absent, multipleValues=0 → 1 handle (server only accepts single date) -->
<Dimension name="time" multipleValues="0">
  2020-01-01T00:00:00Z,2021-01-01T00:00:00Z,2022-01-01T00:00:00Z
</Dimension>
```

For **ESRI**, `default` is always `[range[0], range[last]]` (2 elements, dual handle) since ESRI metadata does not provide a default time value or a `multipleValues` equivalent.

| Source      | Condition                                    | Default Values            | Thumbs |
| ----------- | -------------------------------------------- | ------------------------- | ------ |
| **OGC WMS** | `default` present                            | `[default]`               | 1      |
| **OGC WMS** | No `default`, `multipleValues="0"`           | `[range[last]]`           | 1      |
| **OGC WMS** | No `default`, `multipleValues="1"` or absent | `[range[0], range[last]]` | 2      |
| **ESRI**    | Always                                       | `[range[0], range[last]]` | 2      |

---

## Filter Generation

Filter strings are generated by `TimeSliderController.#generateFilterString()` and differ by layer type:

### WMS TIME Parameter

```
Single:  field = date 'YYYY-MM-DDTHH:mm:ssZ'
Dual:    field = date 'YYYY-MM-DDTHH:mm:ssZ'/date 'YYYY-MM-DDTHH:mm:ssZ'
```

This filter string is then parsed in `GVWMS.applyViewFilterOnSource()`:

1. Split on `=` to extract the date portion
2. `parseDateTimeValuesEsriImageOrWMS()` normalizes each `date '...'` occurrence to ISO format
3. Result is set as the WMS `TIME` source parameter (e.g., `TIME=2020-01-01T00:00:00Z/2025-01-01T00:00:00Z`)

### ESRI Image

```
Single:  time=epoch
Dual:    time=epoch1,epoch2
```

ESRI ImageServer uses raw epoch milliseconds with comma separator for ranges.

### ESRI Dynamic / Vector

SQL-like filter expressions using ISO date format:

```
Dual:               field >= date 'start' and field <= date 'end'
Single (discrete):  field >= date 'start' and field < date 'nextStep'
Single (continuous): field >= date 'start' and field < date 'start+step'
```

For single-handle discrete mode, `nextStep` is the next value in the `range` array after the current position. For continuous mode, the step is estimated via `guessEstimatedStep()`.

---

## Nearest Values Modes

### Discrete Mode

Set when `RangeItems.type` is `'discrete'` (from discrete or absolute range parsing).

- Slider snaps to predefined positions only
- Each position maps to an entry in the `range` array
- Step selector is hidden in the UI
- `TypeTimeSliderValues.discreteValues = true`

### Continuous Mode

Set when `RangeItems.type` is `'relative'`.

- Slider allows free movement between `min` and `max`
- Step selector is visible — controls the filter window size
- Step is estimated from the total range span via `guessEstimatedStep()`:

| Total Range | Estimated Step |
| ----------- | -------------- |
| > 2 months  | 1 day          |
| > 2 years   | 1 month        |
| > 10 years  | 1 year         |

- `TypeTimeSliderValues.discreteValues = false`

---

## Plugin Config Override

The time slider plugin config (`corePackagesConfig → time-slider`) can override any metadata-derived value:

```json
{
  "time-slider": {
    "sliders": [
      {
        "layerPaths": ["myLayer/0"],
        "timeDimension": {
          "singleHandle": true,
          "nearestValues": "discrete",
          "field": "custom_date_field",
          "default": ["2020-01-01T00:00:00Z"],
          "rangeItems": {
            "type": "discrete",
            "range": [
              "2020-01-01T00:00:00Z",
              "2021-01-01T00:00:00Z",
              "2022-01-01T00:00:00Z"
            ]
          }
        }
      }
    ]
  }
}
```

Config values take precedence over layer metadata for all `TimeDimension` properties. This allows overriding:

- Handle mode (`singleHandle`)
- Snap behavior (`nearestValues`)
- Available dates (`rangeItems.range`)
- Filter field name (`field`)
- Default position (`default`)

See [configuration-reference.md](../app/config/configuration-reference.md#time-slider-package) for the full plugin config schema.
