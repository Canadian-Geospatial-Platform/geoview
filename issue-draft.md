Title: [BUG] Map cannot pan after switching from Web Mercator to LCC when zoomed out

## Current Behavior

On the demo page `demos-navigator.html?config=./configs/navigator/demos/05-max-extent-override.json` (which starts in EPSG:3857 / Web Mercator with a custom `maxExtent` of `[-180, -50, 180, 89]`):

1. Zoom out in Web Mercator
2. Use the **navbar projection button** to switch to LCC (EPSG:3978)
3. The map switches to LCC but **panning is completely locked** — the map cannot be dragged in any direction

Using the **page-level projection dropdown selector** (above the map) to switch to LCC does not seem to reproduce the issue as consistently.

## Expected Behavior

After switching projection from Web Mercator to LCC, the user should always be able to pan the map, regardless of the zoom level they were at in the previous projection.

## Steps To Reproduce

1. Open https://canadian-geospatial-platform.github.io/geoview/public/demos-navigator.html?config=./configs/navigator/demos/05-max-extent-override.json
2. The map loads in Web Mercator (EPSG:3857)
3. Zoom out until you can see most of North America or further
4. Click the **Projection** button in the navbar (right side)
5. Click **LCC** to switch to Lambert Conformal Conic (EPSG:3978)
6. Try to pan the map — it is locked and cannot be moved

## Root Cause Analysis

In `mapController.setProjection()` (`packages/geoview-core/src/core/controllers/map-controller.ts`, line ~485), the current zoom level from the source projection is carried over directly to the target projection:

```typescript
const newView: TypeViewSettings = {
  initialView: {
    zoomAndCenter: [currentView.getZoom() as number, centerLatLng],
  },
  minZoom: currentView.getMinZoom(),
  maxZoom: currentView.getMaxZoom(),
  maxExtent: mapMaxExtent,
  projection: newProjection,
};
```

**The problem**: When the user is zoomed out far in Web Mercator (e.g., zoom level 1-2), that same zoom level is applied to the LCC projection. However, LCC at low zoom levels shows a much larger geographic area relative to its `maxExtent` constraint (`[-150, -10, -30, 90]`, from `MAX_EXTENTS_RESTRICTION[3978]`).

When the visible area at the transferred zoom level already **fills or exceeds** the LCC `maxExtent`, OpenLayers' `View` extent constraint locks the map — there is literally no room to pan because the view already covers the entire allowed extent. The `minZoom` is also carried over from Web Mercator (which can be 0), so the user can't even zoom in to unlock panning.

Additionally, `currentView.getMinZoom()` from Web Mercator (typically 0) is carried to LCC, but LCC basemaps may not support zoom level 0 — the valid zoom range for LCC is different from Web Mercator.

### Secondary issue: Page dropdown default not synced

The demos-navigator page dropdown (`<select id="switchProjection">`) defaults to `LCC (3978)` as the first `<option>`, regardless of the config's actual projection (3857 in this case). This is a minor UX issue — the dropdown should reflect the initial projection from the loaded config.

## Proposed Fix

### Fix 1 — Clamp zoom level to target projection defaults

When switching projection, clamp the zoom level to a reasonable range for the target projection instead of blindly carrying it over:

```typescript
// In setProjection(), before creating newView:
const targetDefaultZoom = MAP_ZOOM_LEVEL[newProjection]; // e.g., 4.5 for 3978
const currentZoom = currentView.getZoom() as number;
// If the current zoom would cause the view to exceed the target maxExtent, use the default
const clampedZoom = Math.max(currentZoom, targetDefaultZoom);

const newView: TypeViewSettings = {
  initialView: { zoomAndCenter: [clampedZoom, centerLatLng] },
  // Don't carry over minZoom/maxZoom from the source projection — use defaults for the target
  maxExtent: mapMaxExtent,
  projection: newProjection,
};
```

### Fix 2 — Don't carry over minZoom/maxZoom from source projection

The current code copies `currentView.getMinZoom()` and `currentView.getMaxZoom()` from the old projection. These values may not be appropriate for the target projection. Remove them so the basemap/projection defaults apply:

```typescript
const newView: TypeViewSettings = {
  initialView: { zoomAndCenter: [clampedZoom, centerLatLng] },
  // Let the target projection's basemap set appropriate min/max zoom
  maxExtent: mapMaxExtent,
  projection: newProjection,
};
```

### Fix 3 — Sync demos-navigator dropdown with config projection

In `demos-navigator.html`, after loading a config, set the dropdown value to match the map's actual projection:

```javascript
// After config loads:
switchProjectioneElem.value = mapViewer
  .getView()
  .getProjection()
  .getCode()
  .replace("EPSG:", "");
```

## Affected Files

- `packages/geoview-core/src/core/controllers/map-controller.ts` — `setProjection()` (line ~485): Zoom level and minZoom/maxZoom carry-over logic
- `packages/geoview-core/src/api/types/map-schema-types.ts` — `MAX_EXTENTS_RESTRICTION`, `MAP_ZOOM_LEVEL` constants (line ~367)
- `packages/geoview-core/src/geo/map/map-viewer.ts` — `setView()` (line ~630): View creation with extent constraint
- `packages/geoview-core/public/templates/demos-navigator.html` — Projection dropdown (line ~100): Default value not synced with loaded config
- `packages/geoview-core/public/configs/navigator/demos/05-max-extent-override.json` — Demo config that triggers the bug (3857 with wide maxExtent)

## Additional Context

- `MAX_EXTENTS_RESTRICTION` values: 3857 = `[-180, -85, 180, 85]`, 3978 = `[-150, -10, -30, 90]`, 3573 = `[-180, 45, 180, 90]`
- `MAP_ZOOM_LEVEL` defaults: 3857 = `3.5`, 3978 = `4.5`, 3573 = `4.5`
- The `GV` comment block in `setProjection()` acknowledges this class of problem: _"The extent is different between LCC and WM and switching from one to the other may introduce weird constraint"_
- The same issue could occur when switching from LCC to Web Mercator if the user is zoomed out far enough in LCC, but LCC's tighter default extent makes the 3857→3978 direction more likely to trigger it
