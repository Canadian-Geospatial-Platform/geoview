# Layer Filter Architecture

> **TypeDoc Reference:** [AbstractGVLayer](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/AbstractBaseGVLayer.html) · [GeoviewRenderer](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/GeoviewRenderer.html) · [MapController](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/MapController.html)

## Overview

GeoView uses four independent filter sources that are combined with AND logic to control which features are visible on the map, shown in the data table, and returned from feature queries. Each filter source is a SQL-like string fragment managed by the `LayerFilters` class.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              FOUR FILTER SOURCES                                        │
├──────────────────┬──────────────────┬──────────────────────┬───────────────────────────┤
│  CLASS FILTER    │  TIME FILTER     │  DATA FILTER         │  CONFIG FILTER            │
│  (Style-based)   │  (Time Slider)   │  (Data Table)        │  (Map Config)             │
├──────────────────┼──────────────────┼──────────────────────┼───────────────────────────┤
│ Legend item      │ Time slider UI   │ Data table column    │ initialSettings.filters   │
│ toggle           │                  │ filters              │                           │
│ GeoviewRenderer  │ TimeSlider       │ DataTableController  │ Applied at layer init     │
│ .getFilterFrom   │ Controller.      │ .applyMapFilters()   │                           │
│ Style()          │ #generateFilter  │                      │                           │
│                  │ String()         │                      │                           │
├──────────────────┴──────────────────┴──────────────────────┴───────────────────────────┤
│                                                                                         │
│              LayerFilters.joinWithAnd([config, class, data, time])                       │
│                                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                              CONSUMERS                                                  │
├──────────────────────────┬──────────────────────────┬───────────────────────────────────┤
│ Data Table               │ Map Rendering            │ Feature Queries                   │
│ (client-side filter      │ (server-side for         │ (WFS GetFeature,                  │
│  using class + time)     │  WMS/ESRI; client        │  ESRI query endpoint,             │
│                          │  for vector)             │  client-side filter)              │
└──────────────────────────┴──────────────────────────┴───────────────────────────────────┘
```

**Note:** The data table is both a **consumer** (reads class + time filters to filter displayed rows) and a **producer** (generates data filters from column filters that are applied back to the map).

## LayerFilters Class

**Location:** `packages/geoview-core/src/geo/layer/gv-layers/layer-filters.ts`

Each `AbstractGVLayer` instance owns a `LayerFilters` object that aggregates the four filter fragments:

| Property         | Source      | Description                                |
| ---------------- | ----------- | ------------------------------------------ |
| `#initialFilter` | Config      | Base filter from `initialSettings.filters` |
| `#classFilter`   | Renderer    | SQL generated from style item visibility   |
| `#dataFilter`    | Data table  | User-defined data table column filter      |
| `#timeFilter`    | Time slider | Temporal range filter                      |

### Key Methods

| Method                    | Returns               | Purpose                                     |
| ------------------------- | --------------------- | ------------------------------------------- |
| `getClassFilter()`        | `string \| undefined` | Current class filter                        |
| `getTimeFilter()`         | `string \| undefined` | Current time filter                         |
| `getInitialFilter()`      | `string \| undefined` | Config filter                               |
| `getDataFilter()`         | `string \| undefined` | Data table filter                           |
| `getDataRelatedFilters()` | `string`              | `joinWithAnd([initial, class, data])`       |
| `getAllFilters()`         | `string`              | `joinWithAnd([initial, class, data, time])` |
| `getFilterEquation()`     | `FilterNodeType[]`    | Cached parsed AST of `getAllFilters()`      |
| `hasClassFilter()`        | `boolean`             | `true` if class filter is set               |
| `hasTimeFilter()`         | `boolean`             | `true` if time filter is set                |

### Filter Combination: `joinWithAnd()`

`LayerFilters.joinWithAnd()` is a static method that combines filter fragments:

```typescript
LayerFilters.joinWithAnd([undefined, "", 'status = "active"']);
// → 'status = "active"'   (single valid → returned as-is)

LayerFilters.joinWithAnd(['status = "active"', "population > 100000"]);
// → '(status = "active") AND (population > 100000)'

LayerFilters.joinWithAnd([undefined, undefined]);
// → ''   (no valid filters → empty string)
```

Rules:

- Ignores `undefined`, `null`, empty, and whitespace-only entries
- Single valid filter is returned without extra parentheses
- Multiple valid filters are each wrapped in `()` and joined with `AND`

---

## Filter Source 1: Class Filter (Style-Based)

**Store key:** `layerFilterClass`

The class filter is generated from the **visibility state of legend style items**. When a user toggles an item in the legend, the renderer recomputes a SQL filter string that includes only the visible items.

### How It Works

```
User clicks legend item checkbox
→ LayerController.setItemVisibility(layerPath, item, visible)
  → AbstractGVLayer.setStyleItemVisibility(item, visible)
    → mutates styleSettings.info[i].visible
    → calls #setLayerFiltersClass()
      → GeoviewRenderer.getFilterFromStyle(outFields, style, styleSettings)
        → returns SQL string or undefined
      → layer.getLayerFilters().setClassFilter(filter)
  → setStoreLayerItemVisibility(mapId, layerPath, item, visible, classFilter)
    → updates store: layerFilterClass = classFilter
```

### Filter Generation by Style Type

| Style Type        | `getFilterFromStyle()` Returns  | Example                                             | Can Filter Data Table? |
| ----------------- | ------------------------------- | --------------------------------------------------- | ---------------------- |
| **`uniqueValue`** | SQL OR clause of visible values | `"status" = 'active' OR "status" = 'pending'`       | ✅ Yes                 |
| **`classBreaks`** | SQL range of visible breaks     | `"population" >= 100000 AND "population" <= 500000` | ✅ Yes                 |
| **`simple`**      | `undefined`                     | —                                                   | ❌ No                  |

**When ALL items are visible**, `getFilterFromStyle()` returns `undefined` (no filter needed — show everything).

**When SOME items are visible**, it builds a SQL condition from the visible items' field values.

**When NO items are visible**, the resulting filter excludes all features.

### Unique Value Example

A layer styled by a `"status"` field with values `['active', 'pending', 'closed']`:

- All visible → `undefined` (no filter)
- Only `active` and `pending` visible → `"status" = 'active' OR "status" = 'pending'`
- Only `closed` hidden → `"status" = 'active' OR "status" = 'pending'`

### Simple Style Limitation

**When a layer has multiple geometry types** (e.g., Point + Polygon), the legend shows one item per geometry type. Toggling visibility works at the **renderer level only**:

- `processSimplePoint()` / `processSimpleLineString()` / `processSimplePolygon()` in `GeoviewRenderer` returns `undefined` (no OL style = invisible on map) when `styleSettings.info[0]?.visible === false`
- However, `getFilterFromStyle()` returns `undefined` for simple styles because **geometry type is not an attribute field** — there is no SQL equivalent of `WHERE geometryType = 'Point'`

**Consequence:** The data table cannot filter rows by geometry type. When a user hides "Point" features via the legend, they disappear from the map but remain visible in the data table.

### Style Item Identity

`setStoreLayerItemVisibility()` in `layer-state.ts` matches items by **both `name` AND `geometryType`** to disambiguate items that share the same name across different geometry types (e.g., a "Default" point style vs a "Default" polygon style on the same layer).

---

## Filter Source 2: Time Filter (Time Slider)

**Store key:** `layerFilterTime` (in time slider store state)

The time filter is generated when the user interacts with the time slider component. It encodes a temporal range that restricts which features are displayed.

### How It Works

```
User moves time slider thumb(s)
→ TimeSliderController.updateTimeSliderValues(layerPath, values)
  → #generateFilterString(layer, timeSliderValues, field, filtering, values)
    → returns filter string based on layer type
  → layer.setLayerFiltersTime(filter)
  → setStoreTimeSliderFilter(mapId, layerPath, filter)
```

### Filter Format by Layer Type

| Layer Type              | Format             | Example                                                             |
| ----------------------- | ------------------ | ------------------------------------------------------------------- |
| **WMS** (single handle) | `TIME=date`        | `date_field = date '2023-01-01T00:00:00Z'`                          |
| **WMS** (dual handle)   | `TIME=date1/date2` | `date_field = date '2023-01-01'/date '2023-12-31'`                  |
| **ESRI Image**          | Epoch milliseconds | `time=1672531200000,1704067200000`                                  |
| **ESRI Dynamic/Vector** | SQL date range     | `timestamp >= date '2023-01-01' AND timestamp <= date '2023-12-31'` |

### Enable/Disable Filtering

The time slider UI has a filtering toggle. When filtering is disabled:

- `#generateFilterString()` returns an empty string
- The time slider still displays the current range but no filter is applied
- `hasTimeFilter()` returns `false`

See [time-dimension.md](time-dimension.md) for the full time slider architecture.

---

## Filter Source 3: Config Filter (Initial Settings)

**Store key:** Maps to `#initialFilter` in `LayerFilters`

The config filter comes from the map configuration and is applied when the layer is created.

### How It's Set

In the map config JSON:

```json
{
  "geoviewLayerType": "esriFeature",
  "geoviewLayerId": "myLayer",
  "listOfLayerEntryConfig": [
    {
      "layerId": "0",
      "initialSettings": {
        "filters": "status = 'active' AND year >= 2020"
      }
    }
  ]
}
```

During layer initialization, `initialSettings.filters` is passed to the `LayerFilters` constructor as `initialFilter`:

```typescript
new LayerFilters(
  configLayerFilter, // initialFilter — from config
  styleFilter, // classFilter — from renderer
  undefined, // dataFilter — none at init
  undefined, // timeFilter — none at init
);
```

### Runtime Access

- **Get:** `layer.getLayerConfig().getLayerFilter()` or `layer.getLayerFilters().getInitialFilter()`
- **Set:** `layer.getLayerFilters().setInitialFilter(newFilter)` — can be changed at runtime
- **Clear:** `layer.getLayerFilters().setInitialFilter(undefined)`

---

## Filter Source 4: Data Filter (Data Table Column Filters)

**Store key:** `tableFilters[layerPath]` in data table state

The data filter is generated when the user applies column filters in the data table UI. It flows back to the map to filter rendered features — making the data table both a filter **consumer** (reads class + time filters) and a filter **producer** (generates data filters applied to the map).

### How It Works

```
User types in data table column filter
→ MRT onChange event fires with column filter state
→ buildFilterList() converts each column filter to a SQL-like string
→ filterMap() joins strings with ' and '
→ DataTableController.applyMapFilters(filterString)
  → layer.setLayerFiltersData(filterString)
    → LayerFilters.setDataFilter(filterString)
    → emits LayerFilterChangedEvent (category: 'data')
  → LayerController catches event
    → setStoreDataTableFilter(mapId, layerPath, filter)
  → applyViewFilterOnSource() applies filter to OL source
```

### Filter String Generation

`buildFilterList()` in `data-table.tsx` converts MRT column filter state into SQL-like strings based on column type:

| Column Type    | Filter Function      | Output Example                                                  |
| -------------- | -------------------- | --------------------------------------------------------------- |
| **String**     | `contains`           | `name contains 'Ottawa'`                                        |
| **String**     | `equals`             | `status = 'active'`                                             |
| **Numeric**    | `betweenInclusive`   | `population >= 100000 and population <= 500000`                 |
| **Numeric**    | `greaterThan`        | `age > 25`                                                      |
| **Date**       | `equals`             | `timestamp = date '2023-01-01T00:00:00Z'`                       |
| **Date range** | `betweenInclusive`   | `created >= date '2023-01-01' and created <= date '2023-12-31'` |
| **Null check** | `empty` / `notEmpty` | `field is null` / `field is not null`                           |

Multiple column filters are joined with `and` into a single filter string.

### Map Filtering Toggle

The data table has a "Filter Map" toggle per layer (`mapFilteredRecord`). When disabled:

- `applyMapFilters()` passes an empty string, clearing the data filter
- Column filters remain visible in the data table but do not affect the map
- `hasDataFilter()` returns `false`

### Filter to Extent

The data table also supports a "Filter to Extent" mode (`filterDataToExtent`) that limits data table rows to features within the current map viewport. This is independent of the four filter sources.

### Runtime API

```typescript
// Apply column filter string to the map
dataTableController.applyMapFilters(filterString);

// Enable/disable map filtering for a layer
dataTableController.setMapFilteredRecord(layerPath, true); // Enable
dataTableController.setMapFilteredRecord(layerPath, false); // Disable (clears filter)

// Clear: pass empty string
layer.setLayerFiltersData("");
```

### How the Data Filter Is Consumed on the Map

The data filter is included in `getDataRelatedFilters()` which returns `joinWithAnd([initial, class, data])`. This combined string is applied to WMS/ESRI sources:

- **WMS:** Converted to OGC Filter XML → `FILTER` parameter
- **ESRI Dynamic:** Applied as `layerDefs` SQL WHERE clause
- **Vector layers:** Evaluated client-side via `featureRespectsFilterEquation()`

---

## Filter Consumers

### Data Table

**File:** `packages/geoview-core/src/core/components/data-table/data-table.tsx`

The data table consumes **class filter** and **time filter** from the store:

```typescript
const layerClassFilter = useStoreLayerFilterClass(layerPath);
const layerTimeFilter = useStoreTimeSliderFilter(layerPath);

const memoFilteredFeatures = useMemo(() => {
  // Combine class + time filters
  const combined = LayerFilters.joinWithAnd([
    layerClassFilter,
    layerTimeFilter,
  ]);

  // Parse SQL string into AST nodes
  const filterEquation = GeoviewRenderer.createFilterNodeFromFilter(combined);

  // Evaluate each feature against the filter
  return features.filter(
    (entry) =>
      entry.feature &&
      GeoviewRenderer.featureRespectsFilterEquation(
        entry.feature,
        filterEquation,
      ),
  );
}, [layerClassFilter, layerTimeFilter, features]);
```

**Key methods:**

| Method                                                          | Purpose                                                          |
| --------------------------------------------------------------- | ---------------------------------------------------------------- |
| `GeoviewRenderer.createFilterNodeFromFilter(filter)`            | Parses a SQL-like filter string into an AST (`FilterNodeType[]`) |
| `GeoviewRenderer.featureRespectsFilterEquation(feature, nodes)` | Evaluates a feature's attributes against the parsed AST          |

**What the data table does NOT filter:**

- Geometry type (simple style toggle) — no SQL filter generated
- Config filter — not directly consumed by data table (applied at query/source level)

### Map Rendering

Filters are applied differently depending on the layer type:

**Server-side filtering (WMS, ESRI):**

| Layer Type       | How Filters Are Applied                                          |
| ---------------- | ---------------------------------------------------------------- |
| **WMS**          | Time filter → `TIME` param; data filter → OGC `FILTER` XML param |
| **ESRI Dynamic** | Filters → `layerDefs` param as SQL WHERE clause                  |
| **ESRI Image**   | Time filter → `time` param as epoch range                        |

Each GV layer class has an `applyViewFilterOnSource()` method that reads from its `LayerFilters` instance and applies the appropriate parameters to the OL source.

**Client-side filtering (Vector layers):**

For vector layers (GeoJSON, CSV, GeoPackage, etc.), filters are applied through the OL style function:

```typescript
// In the style function callback:
if (!GeoviewRenderer.featureRespectsFilterEquation(feature, filterEquation)) {
  return undefined; // No style = invisible
}
return computedStyle;
```

**Orchestration:** `MapController.applyLayerFilters(layerPath)` is the single entry point that:

1. Gathers all active filters from the three sources
2. Creates a `LayerFilters` instance
3. Calls `layer.setLayerFilters(filters, true)` to apply to the source
4. The `true` parameter triggers an OL layer change event (re-render)

### Feature Queries

**File:** `packages/geoview-core/src/geo/layer/layer-sets/abstract-layer-set.ts`

Before querying, the layer set checks visibility guards:

```typescript
if (!layer.getVisibleIncludingParents() || !layer.isInVisibleRange(...)) {
  return { results: [] };  // Short-circuit — no query
}
```

Filters are applied differently per query type:

- **WFS:** Class filter converted to OGC Filter XML in GetFeature request
- **ESRI Feature:** Initial + class filters as SQL WHERE clause in query endpoint
- **Client-side (vector):** Features evaluated against `featureRespectsFilterEquation()`

---

## Store Access Patterns

### For React Components (Selector Hooks — Re-Render on Change)

```typescript
import { useStoreLayerFilterClass } from "@/core/stores/states/layer-state";

const classFilter = useStoreLayerFilterClass(layerPath);
// → string | undefined — re-renders when class filter changes
```

### For Controllers (Getters — Point-in-Time Snapshot)

```typescript
import { getStoreLayerFilterClass } from "@/core/stores/states/layer-state";

const classFilter = getStoreLayerFilterClass(mapId, layerPath);
// → string | undefined — no re-render
```

### For Controllers (Setters — Mutations)

```typescript
import { setStoreLayerItemVisibility } from "@/core/stores/states/layer-state";

// Updates item visibility AND class filter in one call
setStoreLayerItemVisibility(mapId, layerPath, item, visible, classFilter);
```

### Layer API

```typescript
// Get the LayerFilters object
const filters = layer.getLayerFilters();

// Read individual filters
filters.getClassFilter(); // string | undefined
filters.getTimeFilter(); // string | undefined
filters.getInitialFilter(); // string | undefined
filters.getDataFilter(); // string | undefined

// Get combined filter
filters.getAllFilters(); // string (all joined with AND)

// Set individual filters
layer.setLayerFiltersTime(filterString);
layer.setLayerFiltersData(filterString);

// Apply all filters to the OL source
mapController.applyLayerFilters(layerPath);
```

---

## Batch Operations and Filter Synchronization

When controllers perform batch operations (e.g., "Toggle All" in the legend), individual event handlers are suppressed to avoid redundant processing. **After the batch completes, the store must be manually synchronized:**

```typescript
try {
  this.#isBatchingLayerItemsVisibility = true;
  // ... batch toggles (store NOT updated per item)
} finally {
  this.#isBatchingLayerItemsVisibility = false;
}

// CRITICAL: Manually sync store after batch
items.forEach((item) => {
  setStoreLayerItemVisibility(
    mapId,
    layerPath,
    item,
    item.isVisible,
    classFilter,
  );
});
```

Without this sync, the data table and "Active Filters" UI display stale data. See Issue #3447.

---

## Summary Table

| Filter     | Store Key                 | Producer                                                      | Consumers                                                   | Clearing                                                 |
| ---------- | ------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------- |
| **Class**  | `layerFilterClass`        | `GeoviewRenderer.getFilterFromStyle()`                        | Data table, map rendering, feature queries                  | Set all style items visible → filter becomes `undefined` |
| **Time**   | `layerFilterTime`         | `TimeSliderController.#generateFilterString()`                | Data table, map rendering (TIME param)                      | Disable filtering toggle in time slider UI               |
| **Config** | `#initialFilter`          | `initialSettings.filters` in map config                       | Feature queries, map rendering (source params)              | `layer.getLayerFilters().setInitialFilter(undefined)`    |
| **Data**   | `tableFilters[layerPath]` | `buildFilterList()` → `DataTableController.applyMapFilters()` | Map rendering (source params via `getDataRelatedFilters()`) | Disable "Filter Map" toggle or clear column filters      |

### Filter Combination Groups

| Method                            | Includes                      | Used By                                                                          |
| --------------------------------- | ----------------------------- | -------------------------------------------------------------------------------- |
| `getDataRelatedFilters()`         | initial + class + data        | `applyViewFilterOnSource()` for WMS/ESRI source params                           |
| `getAllFilters()`                 | initial + class + data + time | Cached filter equation for client-side evaluation                                |
| Data table `memoFilteredFeatures` | class + time (from store)     | Data table row filtering (does NOT include data filter — that would be circular) |
