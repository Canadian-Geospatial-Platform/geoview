# Layer Set Events

> **Full API Reference:** [AbstractLayerSet — TypeDoc](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/AbstractLayerSet.html) | [FeatureInfoLayerSet](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/FeatureInfoLayerSet.html) | [AllFeatureInfoLayerSet](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/AllFeatureInfoLayerSet.html) | [HoverFeatureInfoLayerSet](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/HoverFeatureInfoLayerSet.html) | [LegendsLayerSet](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/LegendsLayerSet.html)
>
> TypeDoc is auto-generated from source code and always reflects the current method signatures, event delegates, and result set types.

Layer sets are reactive collections that track layers and synchronize query results with the Zustand store. Each layer set maintains a `resultSet` object keyed by layer path and exposes events when the set is updated.

## Accessing Layer Sets

All layer sets are properties on `LayerSetController`, accessed through the controllers registry:

```typescript
cgpv.onMapInit((mapViewer) => {
  const layerSetCtrl = mapViewer.controllers.layerSetController;

  layerSetCtrl.featureInfoLayerSet; // FeatureInfoLayerSet — map click queries
  layerSetCtrl.allFeatureInfoLayerSet; // AllFeatureInfoLayerSet — all-features queries
  layerSetCtrl.hoverFeatureInfoLayerSet; // HoverFeatureInfoLayerSet — hover queries
  layerSetCtrl.legendsLayerSet; // LegendsLayerSet — legend/symbology data
});
```

## Common Event — `onLayerSetUpdated`

All layer sets inherit `onLayerSetUpdated` from `AbstractLayerSet`. It fires whenever a layer is registered, unregistered, or its result set entry changes.

```typescript
cgpv.onMapInit((mapViewer) => {
  const { legendsLayerSet } = mapViewer.controllers.layerSetController;

  legendsLayerSet.onLayerSetUpdated((sender, event) => {
    console.log("Layer set updated for:", event.layerPath);
    console.log("Current result set:", event.resultSet);
  });
});
```

**Payload:** `{ layerPath: string; resultSet: TypeResultSet }`

## FeatureInfoLayerSet Events

Handles querying features at a specific location (map click). In addition to `onLayerSetUpdated`, it exposes:

### `onQueryEnded` / `offQueryEnded`

Fires when a click-based feature query completes across all registered layers.

```typescript
cgpv.onMapInit((mapViewer) => {
  const { featureInfoLayerSet } = mapViewer.controllers.layerSetController;

  featureInfoLayerSet.onQueryEnded((sender, event) => {
    console.log("Query completed at:", event.coordinate);
    console.log("Results:", event.resultSet);
  });
});
```

**Payload:** `{ coordinate: Coordinate; resultSet: TypeResultSet }`

## Layer Set Summary

| Layer Set                  | Purpose                              | Query Method              | Custom Events  |
| -------------------------- | ------------------------------------ | ------------------------- | -------------- |
| `FeatureInfoLayerSet`      | Features at a clicked location       | `queryLayers(coordinate)` | `onQueryEnded` |
| `AllFeatureInfoLayerSet`   | All features in a layer (data table) | `queryLayer(layerPath)`   | —              |
| `HoverFeatureInfoLayerSet` | Feature under the cursor             | `queryLayers(coordinate)` | —              |
| `LegendsLayerSet`          | Legend/symbology data                | `queryLegend(layer)`      | —              |

All four layer sets also inherit `onLayerSetUpdated` from `AbstractLayerSet`.

## Query Status Values

Each result set entry includes a `queryStatus` field tracking the query lifecycle:

- **Feature info layer sets:** `'init'` → `'processing'` → `'processed'` | `'error'`
- **Legends layer set:** `'init'` → `'querying'` → `'queried'` | `'error'` (via `legendQueryStatus`)

## Related Documentation

- [Layer Set Architecture](programming/layerset-architecture.md) — internal design and data flow
- [Event System](event-system.md) — delegate pattern overview
- [Layer Events](layer-events.md) — events on individual layers
