# [BUG] "Toggle all" legend classes does not update `layerFilterClass` in store — data table shows stale filter

## Current Behavior

When a user toggles individual legend classes off and then uses "toggle all" to re-enable all classes:
- The **map renders correctly** — all features reappear on the map
- But the **`layerFilterClass` in the Zustand store is NOT updated** — it retains the stale filter expression (e.g., `NOT (Province = 'Quebec' OR Province = 'Alberta')`)
- The data table's **"Active Filters"** still shows the old class filter
- The **data table feature count and rows** remain filtered by the stale expression

Manually toggling individual classes works correctly — the store's `layerFilterClass` updates as expected and "Active Filters" shows "No active filters" when all classes are re-enabled.

## Expected Behavior

After using "toggle all" to enable all legend classes, the `layerFilterClass` in the store should be cleared to `undefined` (since `getFilterFromStyle()` returns `undefined` when all classes are visible). The data table should show the full feature count and "No active filters."

## Steps To Reproduce

1. Load a map with a GeoJSON layer that has a unique value or class breaks renderer (e.g., a layer with Province-based classes)
2. Open the data table — note the feature count (e.g., "5 features")
3. Navigate to the legend panel
4. Uncheck 2 of 3 legend classes — map correctly hides features, data table correctly shows fewer rows
5. Click "toggle all" (the eye icon that enables all classes at once)
6. Navigate back to the data table
7. "Active Filters" still shows `NOT (Province = 'Quebec' OR Province = 'Alberta')` instead of "No active filters"
8. Feature count is still filtered instead of showing all 5 features

## Root Cause Analysis

The bug is in `LayerController.setAllItemsVisibility()` in `packages/geoview-core/src/core/controllers/layer-controller.ts`.

### The batch flow (lines 1420-1487):

1. **Line 1438**: `#isBatchingLayerItemsVisibility = true` — prevents individual item visibility events from being handled by `#handleDomainLayerItemVisibilityChanged`
2. **Lines 1441-1461**: For each item, calls `setItemVisibility()` → `setStyleItemVisibility()` which:
   - Updates `styleInfo.visible` on the OL style config
   - Calls `this.getLayerFilters()?.setClassFilter(this.getFilterFromStyle())` — updates the **domain** layer's filter object correctly
3. **Line 1463**: `#isBatchingLayerItemsVisibility = false`
4. **Line 1470**: `applyLayerFilters(layerPath)` — reads the fresh filter from `layer.getFilterFromStyle()` and applies it to the **OL layer** (visual rendering works correctly)
5. **Line 1473**: `setStoreLegendLayersDirectly()` — updates the legend layers store with the new `items` array (visibility flags are correct)

### What's missing:

**Nobody updates `layerFilterClass` in the layer state store after the batch.** The only function that sets `layerFilterClass` in the store is `setStoreLayerItemVisibility()`, called inside `#handleDomainLayerItemVisibilityChanged()` (line 2252). But this handler is **skipped during batching** (lines 2235-2237):

```typescript
#handleDomainLayerItemVisibilityChanged(sender, event): void {
    if (this.#isBatchingLayerItemsVisibility) {
      return; // ← skipped during "toggle all"
    }
    // ...only this path updates the store:
    setStoreLayerItemVisibility(this.getMapId(), layerPath, item, visible,
      event.layer.getLayerFilters().getClassFilter()  // ← sets layerFilterClass in store
    );
}
```

### Why individual toggling works:

When toggling a single item, `#isBatchingLayerItemsVisibility` is `false`, so `#handleDomainLayerItemVisibilityChanged` fires normally and calls `setStoreLayerItemVisibility` which updates `layerFilterClass` in the store.

## Proposed Fix

After `applyLayerFilters()` in `setAllItemsVisibility()`, update the store's `layerFilterClass` with the current class filter from the domain. Add after line 1470:

```typescript
// Update the class filter in the store (skipped by individual item handlers during batch mode)
const classFilter = layer.getFilterFromStyle();
setStoreLayerClassFilter(this.getMapId(), layerPath, classFilter);
```

This requires either:
- **Option A**: A new store setter `setStoreLayerClassFilter(mapId, layerPath, classFilter)` that only updates `layerFilterClass`
- **Option B**: Update `layerFilterClass` on each legend layer entry inside the `curLayers` object before the existing `setStoreLegendLayersDirectly` call
- **Option C**: After the batch, loop through items and call `setStoreLayerItemVisibility` for each toggled item (mirrors what `#handleDomainLayerItemVisibilityChanged` would have done, but may cause unnecessary re-renders)

## Affected Files

- `packages/geoview-core/src/core/controllers/layer-controller.ts` — `setAllItemsVisibility()` missing store update for `layerFilterClass`
- `packages/geoview-core/src/core/stores/store-interface-and-intial-values/layer-state.ts` — May need a new setter for `layerFilterClass`

## Additional Context

- The OL layer rendering is always correct — `applyLayerFilters()` reads the fresh filter from the domain and applies it directly. The bug is **only** in the Zustand store synchronization.
- The data table's `memoRows` in `data-table.tsx` reads `layerClassFilter` from the store via `useStoreLayerFilterClass`, so stale store = stale table rows.
- Any other UI component reading `layerFilterClass` from the store (e.g., "Active Filters" display) is also affected.
