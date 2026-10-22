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
mapViewer.addComponent('custom-id', <CustomComponent />);
mapViewer.removeComponent('custom-id');

// Refresh, reload, delete
await mapViewer.refreshLayers();
await mapViewer.reload();
await mapViewer.delete(false);

// Wait for all layers to reach a status
const count = await mapViewer.waitAllLayersStatus('loaded');

// Create config from current state
const config = mapViewer.createMapConfigFromMapState();
```

### Saving and Restoring Map Configuration

`createMapConfigFromMapState()` captures selected current state as a reusable map configuration. It includes view/projection/rotation and basemap settings, layer order and supported layer settings such as visibility, opacity, and styles, UI configuration, and state from supported initialized packages. This is a richer persistence mechanism than the parameters supported by a shareable URL, not a serialization of the entire browser session.

The host application serializes the returned configuration as JSON and provides file download/upload or another storage mechanism. Reload the saved JSON text or a configuration URL through [`createMapFromConfig`](api.md#creating-a-map), use `data-config-url` as described in [Creating Maps](../config/create-map.md), or parse the saved JSON and pass the configuration object to [`cgpv.api.reload`](api.md#reloading-a-map) to replace an existing map. `reloadWithCurrentState` captures and recreates the map directly; it does not save a configuration file.

The configuration references data/services rather than bundling their contents. It is not a backup of query results, drawing geometries, credentials, arbitrary host/plugin state, or every live filter/interaction. The target map container supplies its identity and language. The AOI package's curated geographic destinations are separate from this API-based persistence workflow. See the [MapViewer](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/MapViewer.html) and [API](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/API.html) TypeDoc references for full method contracts and options.

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

### Visible Viewport Boundary

Use `getViewportBoundaryLonLat()` after map readiness to obtain the four corners and four
edge midpoints of the **rendered viewport**, in `[longitude, latitude]` degrees.
See [MapViewer — TypeDoc](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/MapViewer.html)
for the complete contract and errors. Boundary sampling and midpoint fitting are exposed directly on MapViewer for integrations.
Maintainers can see the [implementation notes](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/.github/ai/map-architecture.md#viewport-boundary-and-midpoint-fitting).

```typescript
const { corners, midpoints } = mapViewer.getViewportBoundaryLonLat();

// Midpoint WENS order: [west, east, north, south].
const wens = [midpoints.w[0], midpoints.e[0], midpoints.n[1], midpoints.s[1]];
// Standard bbox order is different: [west, south, east, north].
const midpointBox = [
  midpoints.w[0],
  midpoints.s[1],
  midpoints.e[0],
  midpoints.n[1],
];
```

In LCC (EPSG:3978), straight viewport edges become curves in lon/lat. Corner latitudes
therefore do not describe the latitude at an edge midpoint. This API returns both sets
of points so integrators can choose their own representative-box policy, including
combining corners and midpoints at the far east/west of Canada. It does **not** return
a bounding envelope or guarantee that a midpoint-derived box contains the whole viewport.
`convertExtentMapProjToLonLat()` remains the separate, densified envelope conversion.

The rectangle excludes all OpenLayers View padding. In dynamic mode its bottom edge
is the top of the map-info bar; in static mode the bar does not overlay the canvas and
the bottom edge is the canvas bottom. Arbitrary panels and other overlays are not subtracted.
Pixels are CSS viewport pixels, independent of device pixel ratio.

Labels are **screen-relative**: `nw/ne/se/sw` mean top-left/top-right/bottom-right/bottom-left,
and `n/e/s/w` mean top/right/bottom/left. Rotation is respected, but after rotation these
labels need not correspond to geographic directions. Consequently, the example box
is a representative policy for suitable views, not a guaranteed ordered geographic extent.
Longitudes are not wrapped or clamped; antimeridian-crossing and polar views require
an integration-specific policy before using a box in another projection.

Results are fresh snapshots with no store or event payload changes. Recompute on
“Search this Area”, or use existing move-end and size-change events:

```typescript
mapViewer.onMapMoveEnd((sender, event) => {
  const boundary = sender.getViewportBoundaryLonLat();
  // Pass boundary to the integration's area-selection logic.
});
```

After programmatic projection, rotation, padding, or size changes, wait for rendering
before sampling. A missing/zero-sized viewport, invalid padding, unavailable pixel
transform, or non-finite boundary throws `MapViewportUnavailableError` rather than
returning partial coordinates.

#### Fitting the Viewport to Captured Midpoints

`midpointWSENCoords` contains **four coordinate pairs** in west, south, east, north
screen-edge order. It is not the four-number `[west, south, east, north]` bbox.
Pass it directly to `fitViewportToMidpointsLonLat()` on the viewer:

```typescript
const { midpointWSENCoords } = mapViewer.getViewportBoundaryLonLat();

// Later, restore the view from the captured coordinates.
await mapViewer.fitViewportToMidpointsLonLat(midpointWSENCoords);

// Without animation:
await mapViewer.fitViewportToMidpointsLonLat(midpointWSENCoords, true, false);

// Preserve the current rotation while fitting (animation remains enabled):
await mapViewer.fitViewportToMidpointsLonLat(midpointWSENCoords, false);
```

The second argument, `useRotation`, defaults to `true`; set it to `false` to preserve the
current map rotation. The third argument, `useAnimation`, also defaults to `true`.
Calls that previously passed an animation flag in second position must move it to third.

With rotation enabled, the method aligns the west/east direction with the left/right
edges and the south/north direction with the bottom/top edges, then fits **the four
points themselves**, not their axis-aligned extent.

For coordinates from the same projection and viewport aspect ratio, this restores
the original center, resolution, and rotation (subject to existing view constraints).
After a projection or aspect-ratio change, it chooses the closest matching orientation
and keeps all four points inside the padded visible rectangle when constraints permit;
they need not all land exactly on the edge midpoints or cover the original viewport corners.

No additional zoom margin is added. Current View padding (including the dynamic map-info
bar), zoom limits, extent constraints, and rotation constraints apply. Longitudes are
used as supplied, without antimeridian wrapping; preserve the unwrapped longitudes
returned by the boundary API when using Web Mercator across the antimeridian. The input
array is not modified.

Animation defaults to enabled. When enabled, rotation completes before fitting, and the
promise resolves after rendering completes. Interrupted animation rejects; already-applied
movement is not rolled back. Invalid coordinates, an unusable viewport, or midpoint pairs
that cannot define an orientation reject with the errors documented in TypeDoc.

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
