# Geometry API

> **Full API Reference:** [GeometryApi — TypeDoc](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/GeometryApi.html)
>
> TypeDoc is auto-generated from source code and always reflects the current method signatures, parameters, return types, and thrown errors.

The Geometry API provides methods for creating, managing, and manipulating vector geometries (polylines, polygons, circles, and markers) on the GeoView map.

## Accessing the Geometry API

```typescript
const mapViewer = cgpv.api.getMapViewer("mapId");

// Preferred access
const geometryApi = mapViewer.geometry;

// Legacy access (still works, but will be removed in a future release)
const geometryApi = mapViewer.layer.geometry;
```

## Geometry Types Supported

- **Polyline** — Multi-point lines
- **Polygon** — Closed shapes with fill
- **Circle** — Circular shapes with radius
- **Marker** — Icon-based point markers

---

## Common Usage Patterns

### Geometry Groups

Groups organize geometries together. Each group has its own vector layer with independent visibility and z-index.

```typescript
// Create a group
const group = mapViewer.geometry.createGeometryGroup("annotations", {
  vectorLayerOptions: { zIndex: 1000, opacity: 0.8 },
});

// Set as active (new geometries go here by default)
mapViewer.geometry.setActiveGeometryGroup("annotations");

// Reset to default group
mapViewer.geometry.setActiveGeometryGroup();
```

### Adding Geometries

```typescript
// Polyline
const line = mapViewer.geometry.addPolyline(
  [[-75.6972, 45.4215], [-79.3832, 43.6532], [-73.5673, 45.5017]],
  { projection: 4326, style: { strokeColor: "#0000ff", strokeWidth: 3 } },
  "routeLine",
  "routesGroup"
);

// Polygon
const polygon = mapViewer.geometry.addPolygon(
  [[[-75.7, 45.4], [-75.6, 45.4], [-75.6, 45.5], [-75.7, 45.5], [-75.7, 45.4]]],
  { projection: 4326, style: { fillColor: "#ff0000", fillOpacity: 0.3 } },
  "searchArea"
);

// Circle
const circle = mapViewer.geometry.addCircle(
  [-75.6972, 45.4215],
  { projection: 4326, style: { radius: 50, fillColor: "#ffff00", fillOpacity: 0.2 } },
  "searchRadius"
);

// Marker
const marker = mapViewer.geometry.addMarkerIcon(
  [-75.6972, 45.4215],
  { projection: 4326, style: { src: "/img/marker.png", scale: 0.5 } },
  "locationMarker"
);
```

### Retrieving and Modifying Geometries

```typescript
// Get by ID
const geometry = mapViewer.geometry.getGeometry("myMarker");

// Get coordinates (optionally in a different projection)
const coords = mapViewer.geometry.getFeatureCoords("myPolygon", 4326);

// Move a marker
mapViewer.geometry.setFeatureCoords("myMarker", [-79.3832, 43.6532], 4326);

// Delete
mapViewer.geometry.deleteGeometry("myMarker");
```

### Managing Groups

```typescript
// Visibility
mapViewer.geometry.setGeometryGroupAsVisible("annotations");
mapViewer.geometry.setGeometryGroupAsInvisible("annotations");

// Z-index
mapViewer.geometry.setGeometryGroupZIndex("annotations", 100);

// Add/remove from groups
mapViewer.geometry.addToGeometryGroup(feature, "importantPoints");
mapViewer.geometry.deleteGeometryFromGroup("myMarker", "annotations");
mapViewer.geometry.deleteGeometryFromGroups("myMarker"); // Remove from all groups

// Clear all geometries from a group (keep the group)
mapViewer.geometry.deleteGeometriesFromGroup("annotations");

// Delete entire group
mapViewer.geometry.deleteGeometryGroup("temporaryMarkers");
```

### Group Queries

```typescript
const allGroups = mapViewer.geometry.getGeometryGroups();
const activeGroup = mapViewer.geometry.getActiveGeometryGroup();
const exists = mapViewer.geometry.hasGeometryGroup("annotations");
const groups = mapViewer.geometry.getGeometryGroupsByFeatureId("myMarker");
```

---

## Styling

### Lines and Polygons (`TypeFeatureStyle`)

```typescript
const style = {
  strokeColor: "#0000ff",
  strokeWidth: 3,
  strokeOpacity: 0.8,
  fillColor: "#00ffff",
  fillOpacity: 0.3,
};
```

### Circles (`TypeFeatureCircleStyle`)

Extends `TypeFeatureStyle` with a `radius` property (in kilometers).

```typescript
const circleStyle = { radius: 25, fillColor: "#ffff00", fillOpacity: 0.2 };
```

### Icons (`TypeIconStyle`)

```typescript
const iconStyle = {
  src: "/img/marker-red.png",
  scale: 0.75,
  anchor: [0.5, 1],
  anchorXUnits: "fraction",
  anchorYUnits: "fraction",
};
```

---

## Events

```typescript
// Geometry added
mapViewer.geometry.onGeometryAdded((sender, feature) => {
  console.log("Geometry added:", feature.get("featureId"));
});

// Clean up
mapViewer.geometry.offGeometryAdded(handler);
```

---

## Static Utility Methods

```typescript
import { GeometryApi } from "@/geo/layer/geometry/geometry";

// Create OL geometry from type + coordinates
const polygon = GeometryApi.createGeometryFromType("Polygon", [
  [[-75.7, 45.4], [-75.6, 45.4], [-75.6, 45.5], [-75.7, 45.5], [-75.7, 45.4]],
]);

// Type guards
GeometryApi.isCoordinates(coords);
GeometryApi.isArrayOfCoordinates(coords);
GeometryApi.isArrayOfArrayOfCoordinates(coords);
```

---

## See Also

- **[GeometryApi — TypeDoc](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/GeometryApi.html)** — Complete method reference
- [Layer API](layer-api.md) — Layer management
- [Map Viewer API](map-viewer-api.md) — MapViewer instance methods
