# Layer Sets in GeoView

GeoView uses the concept of Layer Sets to manage and synchronize groups of layers and their associated data, events, and UI updates. Each Layer Set is responsible for a specific aspect of layer management and interacts with the store and event processors to keep the application state in sync.

## Overview
A Layer Set is a class that manages a collection of layers for a particular purpose, such as querying feature info, handling all features, or managing legends. Layer Sets listen to events, update the store, and provide APIs for querying or updating their managed layers.

The main Layer Sets in GeoView are:
- AllFeatureInfoLayerSet
- FeatureInfoLayerSet
- LegendsLayerSet

## How Layer Sets Work
Each Layer Set extends AbstractLayerSet and is constructed with a reference to the LayerApi.
They maintain a resultSet object keyed by layer path, holding the relevant data (features, legend info, etc.).
Layer Sets listen to map or layer events (e.g., clicks, style changes) and update their result sets accordingly.

They propagate changes to the store, triggering UI updates in React components.

### Understanding `resultSet` and `getRegisteredLayerPaths`

All Layer Sets in GeoView (`AllFeatureInfoLayerSet`, `FeatureInfoLayerSet`, `LegendsLayerSet`) maintain a **`resultSet`** object. This object holds the current data for each registered layer, keyed by the layer's path.

### What is `resultSet`?

- `resultSet` is an object where **each key is a layer path** (a unique string identifying a layer), and **each value is the data** relevant to that Layer Set.
    - For `AllFeatureInfoLayerSet`, the value is all features for that layer.
    - For `FeatureInfoLayerSet`, the value is features found at the last queried location.
    - For `LegendsLayerSet`, the value is the legend/symbology info for that layer.

**Example structure:**
```js
{
  "layer1/path": { ...data for layer 1... },
  "layer2/path": { ...data for layer 2... }
}
```

You can always access the current state of all managed layers through the resultSet property of a Layer Set.

## AllFeatureInfoLayerSet
Handles querying and storing information about all features in a layer. This is used when you want to retrieve all records/features from a layer, for example, to populate a data table.

Key Features:
- Manages a result set for all features in each registered layer.
- Handles queries for all features, disables UI buttons during queries to prevent concurrent requests.
- Propagates results and status to the store for UI updates.
- Used by the Data Table and other components that need access to all features in a layer.

```ts
// Query all features for a layer
allFeatureInfoLayerSet.queryLayer('layerPath').then((features) => {
  // features is an array of all features in the layer
});
```

## FeatureInfoLayerSet
Handles querying and storing information about features at a specific location (e.g., when a user clicks on the map).

Key Features:
- Listens for map click events and queries all registered layers at the clicked location.
- Stores the result set for each layer, including feature info and query status.
- Updates the store so UI components (like details panels) can display feature info for the selected location.
- Handles metadata patching if feature info fields are missing in the layer config.

```ts
// Query features at a specific coordinate
featureInfoLayerSet.queryLayers([longitude, latitude]).then((resultSet) => {
  // resultSet contains features for all layers at the clicked location
});
```

## LegendsLayerSet
Manages the legend information for all registered layers, including symbology, icons, and legend status.

Key Features:
- Synchronizes legend data for all layers and updates the store for UI rendering.
- Handles legend querying and status updates as layers are loaded or styles change.
- Provides APIs to retrieve legend icons, symbology, and collapsed/expanded state for each layer.

```ts
// Listen for legend updates
mapViewer.layer.legendsLayerSet.onLayerSetUpdated((sender, payload) => {
  // payload.resultSet contains legend info for all layers
});
```

When to Use Each Layer Set
| Layer Set               | Use Case                                      |
|-------------------------|-----------------------------------------------|
| AllFeatureInfoLayerSet  | Data Table, export, or any "all features" UI  |
| FeatureInfoLayerSet     | Map click, popups, details for a location     |
| LegendsLayerSet         | Displaying layer symbology/legend in the UI   |
