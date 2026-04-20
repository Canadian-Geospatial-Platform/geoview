# MapViewer API

> **Full API Reference:** [MapViewer — TypeDoc](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/MapViewer.html)
>
> TypeDoc is auto-generated from source code and always reflects the current method signatures, parameters, return types, and thrown errors.

The `MapViewer` class represents a single map instance. It provides methods for controlling map state, handling events, coordinate transformations, and managing interactions.

## Accessing the MapViewer

```typescript
// Synchronous — throws if not found
const mapViewer = cgpv.api.getMapViewer("mapId");

// Asynchronous — waits until available
const mapViewer = await cgpv.api.getMapViewerAsync("mapId");
```

---

## Common Usage Patterns

### Map State

```typescript
// Language, theme, projection
mapViewer.getDisplayLanguage(); // 'en' | 'fr'
mapViewer.getDisplayTheme(); // 'light' | 'dark'
mapViewer.getProjection(); // OL Projection object
mapViewer.getMapState(); // Full state (projection, zoom, center, etc.)
mapViewer.getView(); // OL View object

// Center and size (async — waits for render)
const center = await mapViewer.getCenter();
const size = await mapViewer.getMapSize();

// Set state
mapViewer.setCenter([-75.6972, 45.4215]);
mapViewer.setMapZoomLevel(10);
mapViewer.setExtent([-76.1, 45.1, -75.2, 45.7]);
mapViewer.setView({
  projection: 3857,
  initialView: { zoomAndCenter: [10, [-75.6972, 45.4215]] },
  minZoom: 2,
  maxZoom: 19,
});

// Language, projection, theme
await mapViewer.setLanguage("fr", true); // true = reload layers
await mapViewer.setProjection(3857);
mapViewer.setTheme("dark");
```

### Map Actions

```typescript
// Zoom
await mapViewer.zoomToExtent([-76.1, 45.1, -75.2, 45.7], {
  padding: [100, 100, 100, 100],
  maxZoom: 11,
});
await mapViewer.zoomToLonLatExtentOrCoordinate([-75.6972, 45.4215]);

// Custom components
mapViewer.addComponent("custom-id", <CustomComponent />);
mapViewer.removeComponent("custom-id");

// Refresh, reload, delete
await mapViewer.refreshLayers();
await mapViewer.reload();
await mapViewer.delete(false);

// Wait for all layers to reach a status
const count = await mapViewer.waitAllLayersStatus("loaded");

// Create config from current state
const config = mapViewer.createMapConfigFromMapState();
```

### Coordinate Transformations

```typescript
// LonLat ↔ Map projection
const mapCoord = mapViewer.convertCoordinateLonLatToMapProj([
  -75.6972, 45.4215,
]);
const lonLat = mapViewer.convertCoordinateMapProjToLonLat(mapCoord);

// Extent transforms
const mapExtent = mapViewer.convertExtentLonLatToMapProj([
  -76.1, 45.1, -75.2, 45.7,
]);
const lonLatExtent = mapViewer.convertExtentMapProjToLonLat(mapExtent);

// North arrow
const angle = mapViewer.getNorthArrowAngle();
```

### Map Interactions

```typescript
const select = mapViewer.initSelectInteractions();
const extent = mapViewer.initExtentInteractions();
const draw = mapViewer.initDrawInteractions("my-geometries", "Polygon", {
  strokeColor: "blue",
  fillColor: "rgba(0, 0, 255, 0.2)",
});
const modify = mapViewer.initModifyInteractions("my-geometries", {
  strokeColor: "red",
});
const snap = mapViewer.initSnapInteractions("my-geometries");
```

---

## Event Handling

Events use the [EventHelper delegate pattern](programming/event-helper.md). Each event has `onXxx()` / `offXxx()` pairs.

### Lifecycle Events

```typescript
mapViewer.onMapInit((sender) => {
  console.log("Map initialized:", sender.mapId);
});

mapViewer.onMapReady((sender) => {
  console.log("Map ready:", sender.mapId);
});

mapViewer.onMapLayersProcessed((sender) => {
  console.log("All layers processed");
});

mapViewer.onMapLayersLoaded((sender) => {
  console.log("All layers loaded");
});
```

### Interaction Events

```typescript
mapViewer.onMapSingleClick((sender, payload) => {
  console.log("Clicked at:", payload.lonlat, "Pixel:", payload.pixel);
});

mapViewer.onMapMoveEnd((sender, payload) => {
  console.log("Map moved to:", payload.lonlat);
});

mapViewer.onMapPointerMove((sender, payload) => {
  console.log("Pointer at:", payload.lonlat);
});

mapViewer.onMapPointerStop((sender, payload) => {
  console.log("Pointer stopped at:", payload.lonlat);
});

mapViewer.onMapZoomEnd((sender, payload) => {
  console.log("Zoom level:", payload.zoom);
});

mapViewer.onMapRotation((sender, payload) => {
  console.log("Rotation:", payload.rotation);
});

mapViewer.onMapChangeSize((sender, payload) => {
  console.log("New size:", payload.size);
});
```

### State Change Events

```typescript
mapViewer.onMapProjectionChanged((sender, payload) => {
  console.log("Projection:", payload.projection.getCode());
});

mapViewer.onMapLanguageChanged((sender, payload) => {
  console.log("Language:", payload.language);
});

mapViewer.onMapComponentAdded((sender, payload) => {
  console.log("Component added:", payload.mapComponentId);
});

mapViewer.onMapComponentRemoved((sender, payload) => {
  console.log("Component removed:", payload.mapComponentId);
});
```

---

## Best Practices

1. **Access after initialization** — Always access MapViewer methods after the map has been initialized
2. **Error handling** — Include error handling when using methods that may throw
3. **Performance** — Be mindful when calling methods that trigger redraws
4. **Cleanup** — Call `cgpv.api.deleteMapViewer(mapId)` when dynamically destroying maps

---

## See Also

- **[MapViewer — TypeDoc](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/MapViewer.html)** — Complete method reference
- [API Reference](api.md) — Main API entry points
- [Layer API](layer-api.md) — Layer management
- [Geometry API](geometry-api.md) — Vector geometry operations
- [Controllers](app/events/controllers.md) — Controllers API documentation
