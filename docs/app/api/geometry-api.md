# Geometry API Reference

The Geometry API provides comprehensive methods for creating, managing, and manipulating vector geometries (polylines, polygons, circles, and markers) on the GeoView map. It handles geometry groups, styling, coordinate transformations, and event handling.

## Accessing the Geometry API

The Geometry API is available through the MapViewer instance:

```typescript
// Get the map viewer
const mapViewer = cgpv.api.getMapViewer("mapId");

// Access the geometry API
const geometryApi = mapViewer.layer.geometry;
```

## Geometry Types Supported

- **Polyline** - Multi-point lines
- **Polygon** - Closed shapes with fill
- **Circle** - Circular shapes with radius
- **Marker** - Icon-based point markers

---

## Core Concepts

### Geometry Groups

Geometry groups allow you to organize and manage multiple geometries together. Each group has its own vector layer and can be shown/hidden and z-index set independently.

```typescript
// Create a geometry group (by deafult z-index is infinity)
const group = mapViewer.layer.geometry.createGeometryGroup("myGroup");

// Set as active (new geometries will be added to this group)
mapViewer.layer.geometry.setActiveGeometryGroup("myGroup");
```

### Feature IDs

Every geometry can have a unique identifier for easy retrieval and manipulation:

```typescript
// Add with auto-generated ID
const feature1 = mapViewer.layer.geometry.addMarkerIcon([lng, lat]);

// Add with custom ID
const feature2 = mapViewer.layer.geometry.addMarkerIcon(
  [lng, lat],
  undefined,
  "myMarker"
);

// Retrieve by ID
const geometry = mapViewer.layer.geometry.getGeometry("myMarker");
```

---

## Adding Geometries

### addPolyline()

Creates a polyline (multi-point line) on the map.

```typescript
addPolyline(
  points: Coordinate,
  options?: {
    projection?: number;
    geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
    style?: TypeFeatureStyle;
  },
  id?: string,
  groupId?: string
): Feature
```

**Parameters:**

- `points` - Array of coordinate pairs `[[lng1, lat1], [lng2, lat2], ...]`
- `options.projection` - Source projection EPSG code (default: 4326)
- `options.geometryLayout` - Coordinate layout (default: 'XY')
- `options.style` - Styling options (see [Styling](#styling))
- `id` - Optional unique identifier
- `groupId` - Optional group to add the geometry to

**Returns:** OpenLayers Feature object

**Example:**

```typescript
const polyline = mapViewer.layer.geometry.addPolyline(
  [
    [-75.6972, 45.4215], // Ottawa
    [-79.3832, 43.6532], // Toronto
    [-73.5673, 45.5017], // Montreal
  ],
  {
    projection: 4326,
    style: {
      strokeColor: "#0000ff",
      strokeWidth: 3,
      strokeOpacity: 0.8,
    },
  },
  "routeLine",
  "routesGroup"
);
```

---

### addPolygon()

Creates a polygon (closed shape with fill) on the map.

```typescript
addPolygon(
  points: number[] | Coordinate[][],
  options?: {
    projection?: number;
    geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
    style?: TypeFeatureStyle;
  },
  id?: string,
  groupId?: string
): Feature
```

**Parameters:**

- `points` - Array of coordinate arrays for polygon rings `[[[lng1, lat1], [lng2, lat2], ...]]`
- `options.projection` - Source projection EPSG code (default: 4326)
- `options.geometryLayout` - Coordinate layout (default: 'XY')
- `options.style` - Styling options (see [Styling](#styling))
- `id` - Optional unique identifier
- `groupId` - Optional group to add the geometry to

**Returns:** OpenLayers Feature object

**Example:**

```typescript
const polygon = mapViewer.layer.geometry.addPolygon(
  [
    [
      [-75.7, 45.4],
      [-75.6, 45.4],
      [-75.6, 45.5],
      [-75.7, 45.5],
      [-75.7, 45.4], // Close the ring
    ],
  ],
  {
    projection: 4326,
    style: {
      fillColor: "#ff0000",
      fillOpacity: 0.3,
      strokeColor: "#ff0000",
      strokeWidth: 2,
      strokeOpacity: 1,
    },
  },
  "searchArea"
);
```

**Polygon with Holes:**

```typescript
const polygonWithHole = mapViewer.layer.geometry.addPolygon(
  [
    // Outer ring
    [
      [-75.8, 45.3],
      [-75.5, 45.3],
      [-75.5, 45.6],
      [-75.8, 45.6],
      [-75.8, 45.3],
    ],
    // Inner ring (hole)
    [
      [-75.7, 45.4],
      [-75.6, 45.4],
      [-75.6, 45.5],
      [-75.7, 45.5],
      [-75.7, 45.4],
    ],
  ],
  {
    style: {
      fillColor: "#00ff00",
      fillOpacity: 0.4,
    },
  }
);
```

---

### addCircle()

Creates a circle on the map.

```typescript
addCircle(
  coordinate: Coordinate,
  options?: {
    projection?: number;
    geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
    style?: TypeFeatureCircleStyle;
  },
  id?: string,
  groupId?: string
): Feature
```

**Parameters:**

- `coordinate` - Center point `[lng, lat]`
- `options.projection` - Source projection EPSG code (default: 4326)
- `options.geometryLayout` - Coordinate layout (default: 'XY')
- `options.style` - Circle styling including radius (see [Circle Styling](#circle-styling))
- `id` - Optional unique identifier
- `groupId` - Optional group to add the geometry to

**Returns:** OpenLayers Feature object

**Example:**

```typescript
const circle = mapViewer.layer.geometry.addCircle(
  [-75.6972, 45.4215], // Ottawa
  {
    projection: 4326,
    style: {
      radius: 50, // Radius in kilometers (multiplied by 10000 internally)
      fillColor: "#ffff00",
      fillOpacity: 0.2,
      strokeColor: "#ff8800",
      strokeWidth: 2,
      strokeOpacity: 1,
    },
  },
  "searchRadius"
);
```

---

### addMarkerIcon()

Creates an icon marker at a specific location.

```typescript
addMarkerIcon(
  coordinate: Coordinate,
  options?: {
    projection?: number;
    geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
    style?: TypeIconStyle;
  },
  id?: string,
  groupId?: string
): Feature
```

**Parameters:**

- `coordinate` - Marker position `[lng, lat]`
- `options.projection` - Source projection EPSG code (default: 4326)
- `options.geometryLayout` - Coordinate layout (default: 'XY')
- `options.style` - Icon styling (see [Icon Styling](#icon-styling))
- `id` - Optional unique identifier
- `groupId` - Optional group to add the geometry to

**Returns:** OpenLayers Feature object

**Example:**

```typescript
const marker = mapViewer.layer.geometry.addMarkerIcon(
  [-75.6972, 45.4215],
  {
    projection: 4326,
    style: {
      src: "/img/custom-marker.png",
      scale: 0.5,
      anchor: [0.5, 1], // Center bottom
      anchorXUnits: "fraction",
      anchorYUnits: "fraction",
    },
  },
  "locationMarker"
);
```

---

## Managing Geometries

### getGeometry()

Retrieves a geometry by its feature ID.

```typescript
getGeometry(featureId: string): Feature
```

**Parameters:**

- `featureId` - The unique identifier of the geometry

**Returns:** OpenLayers Feature object

**Example:**

```typescript
const geometry = mapViewer.layer.geometry.getGeometry("myMarker");
console.log("Geometry found:", geometry);
```

---

### deleteGeometry()

Deletes a geometry from all groups and the map.

```typescript
deleteGeometry(featureId: string): void
```

**Parameters:**

- `featureId` - The unique identifier of the geometry to delete

**Example:**

```typescript
mapViewer.layer.geometry.deleteGeometry("myMarker");
```

---

### getFeatureCoords()

Gets the coordinates of a specific geometry, optionally transformed to a different projection.

```typescript
getFeatureCoords(
  featureId: string,
  projection?: number
): Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][] | undefined
```

**Parameters:**

- `featureId` - The unique identifier of the geometry
- `projection` - Optional EPSG code to transform coordinates to

**Returns:** Coordinates in the requested format

**Example:**

```typescript
// Get coordinates in map projection
const coords = mapViewer.layer.geometry.getFeatureCoords("myPolygon");

// Get coordinates in WGS84
const wgs84Coords = mapViewer.layer.geometry.getFeatureCoords(
  "myPolygon",
  4326
);
console.log("Polygon coordinates:", wgs84Coords);
```

---

### setFeatureCoords()

Updates the coordinates of an existing geometry.

```typescript
setFeatureCoords(
  featureId: string,
  coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][],
  projection?: number
): void
```

**Parameters:**

- `featureId` - The unique identifier of the geometry
- `coordinates` - New coordinates for the geometry
- `projection` - Optional EPSG code of the input coordinates (default: 4326)

**Example:**

```typescript
// Move a marker to a new location
mapViewer.layer.geometry.setFeatureCoords(
  "myMarker",
  [-79.3832, 43.6532], // Toronto
  4326
);

// Update polygon shape
mapViewer.layer.geometry.setFeatureCoords(
  "myPolygon",
  [
    [
      [-75.8, 45.3],
      [-75.5, 45.3],
      [-75.5, 45.6],
      [-75.8, 45.6],
      [-75.8, 45.3],
    ],
  ],
  4326
);
```

---

## Geometry Groups

### createGeometryGroup()

Creates a new geometry group for organizing multiple geometries. Each group has its own vector layer and can be shown/hidden and z-index set independently.

```typescript
createGeometryGroup(
  geometryGroupId: string,
  options?: {
    vectorLayerOptions?: VectorLayerOptions;
    vectorSourceOptions?: VectorSourceOptions;
  }
): FeatureCollection
```

**Parameters:**

- `geometryGroupId` - Unique identifier for the group
- `options.vectorLayerOptions` - OpenLayers vector layer options
- `options.vectorSourceOptions` - OpenLayers vector source options

**Returns:** FeatureCollection object containing the group

**Example:**

```typescript
const annotationsGroup = mapViewer.layer.geometry.createGeometryGroup(
  "annotations",
  {
    vectorLayerOptions: {
      zIndex: 1000,
      opacity: 0.8,
    },
  }
);
```

---

### setActiveGeometryGroup()

Sets the active geometry group. New geometries will be added to this group by default.

```typescript
setActiveGeometryGroup(id?: string): void
```

**Parameters:**

- `id` - Group ID to set as active (defaults to default group if not specified)

**Example:**

```typescript
// Set custom group as active
mapViewer.layer.geometry.setActiveGeometryGroup("annotations");

// Now new geometries will be added to "annotations" group
mapViewer.layer.geometry.addMarkerIcon([-75.6972, 45.4215]);

// Reset to default group
mapViewer.layer.geometry.setActiveGeometryGroup();
```

---

### getActiveGeometryGroup()

Gets the currently active geometry group.

```typescript
getActiveGeometryGroup(): FeatureCollection
```

**Returns:** The active FeatureCollection

**Example:**

```typescript
const activeGroup = mapViewer.layer.geometry.getActiveGeometryGroup();
console.log("Active group:", activeGroup.geometryGroupId);
```

---

### getGeometryGroup()

Gets a specific geometry group by ID.

```typescript
getGeometryGroup(geometryGroupId?: string): FeatureCollection | undefined
```

**Parameters:**

- `geometryGroupId` - Optional group ID (returns active group if not specified)

**Returns:** FeatureCollection or undefined if not found

**Example:**

```typescript
const group = mapViewer.layer.geometry.getGeometryGroup("annotations");
if (group) {
  console.log("Group found:", group.geometryGroupId);
}
```

---

#### getGeometryGroups()

Gets all geometry groups.

```typescript
getGeometryGroups(): FeatureCollection[]
```

**Returns:** Array of all FeatureCollection objects

**Example:**

```typescript
const allGroups = mapViewer.layer.geometry.getGeometryGroups();
allGroups.forEach((group) => {
  console.log("Group ID:", group.geometryGroupId);
  console.log("Features count:", group.vectorSource.getFeatures().length);
});
```

---

### getGeometryGroupsByFeatureId()

Finds all groups that contain a specific geometry.

```typescript
getGeometryGroupsByFeatureId(featureId: string): FeatureCollection[]
```

**Parameters:**

- `featureId` - The geometry's unique identifier

**Returns:** Array of FeatureCollection objects

**Example:**

```typescript
const groups =
  mapViewer.layer.geometry.getGeometryGroupsByFeatureId("myMarker");
groups.forEach((group) => {
  console.log("Marker is in group:", group.geometryGroupId);
});
```

---

### Group Visibility

#### setGeometryGroupAsVisible()

Shows a geometry group on the map.

```typescript
setGeometryGroupAsVisible(geometryGroupId?: string): void
```

**Parameters:**

- `geometryGroupId` - Optional group ID (uses active group if not specified)

**Example:**

```typescript
mapViewer.layer.geometry.setGeometryGroupAsVisible("annotations");
```

#### setGeometryGroupAsInvisible()

Hides a geometry group from the map.

```typescript
setGeometryGroupAsInvisible(geometryGroupId?: string): void
```

**Parameters:**

- `geometryGroupId` - Optional group ID (uses active group if not specified)

**Example:**

```typescript
mapViewer.layer.geometry.setGeometryGroupAsInvisible("annotations");
```

#### getGeometryGroupZIndex()

Gets the z-index of a geometry group's vector layer.

```typescript
getGeometryGroupZIndex(geometryGroupId?: string): number | undefined
```

**Parameters:**

- `geometryGroupId` - The group ID

**Returns:** The z-index value, or `undefined` if the group doesn't exist

**Example:**

```typescript
const zIndex = mapViewer.layer.geometry.getGeometryGroupZIndex("annotations");
console.log(`Current z-index: ${zIndex}`);
```

#### setGeometryGroupZIndex()

Sets the z-index of a geometry group's vector layer to control rendering order.

```typescript
setGeometryGroupZIndex(geometryGroupId: string, zIndex: number): void
```

**Parameters:**

- `geometryGroupId` - The group ID
- `zIndex` - The z-index value to set (higher values render on top)

**Example:**

```typescript
// Set annotations to render on top
mapViewer.layer.geometry.setGeometryGroupZIndex("annotations", 100);

// Set highlights to render below other geometries
mapViewer.layer.geometry.setGeometryGroupZIndex("highlights", 50);
```

---

### Managing Geometries in Groups

#### addToGeometryGroup()

Adds an existing geometry to a specific group.

```typescript
addToGeometryGroup(geometry: Feature, geometryGroupId?: string): void
```

**Parameters:**

- `geometry` - The Feature to add
- `geometryGroupId` - Optional group ID (uses active group if not specified)

**Example:**

```typescript
const marker = mapViewer.layer.geometry.addMarkerIcon([-75.6972, 45.4215]);
mapViewer.layer.geometry.addToGeometryGroup(marker, "importantPoints");
```

#### deleteGeometryFromGroup()

Removes a geometry from a specific group.

```typescript
deleteGeometryFromGroup(featureId: string, geometryGroupId?: string): void
```

**Parameters:**

- `featureId` - The geometry's unique identifier
- `geometryGroupId` - Optional group ID (uses active group if not specified)

**Example:**

```typescript
mapViewer.layer.geometry.deleteGeometryFromGroup("myMarker", "annotations");
```

#### deleteGeometriesFromGroup()

Removes all geometries from a group but keeps the group itself.

```typescript
deleteGeometriesFromGroup(geometryGroupId?: string): FeatureCollection
```

**Parameters:**

- `geometryGroupId` - Optional group ID (uses active group if not specified)

**Returns:** The cleared FeatureCollection

**Example:**

```typescript
// Clear all annotations
mapViewer.layer.geometry.deleteGeometriesFromGroup("annotations");
```

#### deleteGeometryGroup()

Deletes a geometry group and all its geometries from the map. The default group cannot be deleted.

```typescript
deleteGeometryGroup(geometryGroupId?: string): void
```

**Parameters:**

- `geometryGroupId` - Optional group ID (uses active group if not specified)

**Example:**

```typescript
mapViewer.layer.geometry.deleteGeometryGroup("temporaryMarkers");
```

---

## Styling

### TypeFeatureStyle

Style options for lines, polygons, and markers.

```typescript
type TypeFeatureStyle = {
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  fillColor?: string;
  fillOpacity?: number;
};
```

**Properties:**

- `strokeColor` - Stroke color (CSS color string, e.g., "#ff0000", "red", "rgb(255,0,0)")
- `strokeWidth` - Stroke width in pixels (default: 1)
- `strokeOpacity` - Stroke opacity 0-1 (default: 1)
- `fillColor` - Fill color (CSS color string)
- `fillOpacity` - Fill opacity 0-1 (default: 1)

**Example:**

```typescript
const style = {
  strokeColor: "#0000ff",
  strokeWidth: 3,
  strokeOpacity: 0.8,
  fillColor: "#00ffff",
  fillOpacity: 0.3,
};
```

---

### Circle Styling

Circle geometries extend the base feature style with a radius property.

```typescript
interface TypeFeatureCircleStyle extends TypeFeatureStyle {
  radius?: number; // Radius in kilometers
}
```

**Example:**

```typescript
const circleStyle = {
  radius: 25, // 25 km (multiplied by 10000 internally)
  fillColor: "#ffff00",
  fillOpacity: 0.2,
  strokeColor: "#ff8800",
  strokeWidth: 2,
};
```

---

### Icon Styling

Icon marker style options.

```typescript
type TypeIconStyle = {
  anchor?: number[];
  size?: number[];
  scale?: number;
  anchorXUnits?: string;
  anchorYUnits?: string;
  src: string;
};
```

**Properties:**

- `src` - **Required** - Path to icon image
- `scale` - Scale factor for the icon (default: 0.1)
- `anchor` - Anchor point `[x, y]` (default: [0.5, 256])
- `anchorXUnits` - Units for X anchor: 'fraction' or 'pixels' (default: 'fraction')
- `anchorYUnits` - Units for Y anchor: 'fraction' or 'pixels' (default: 'pixels')
- `size` - Icon size `[width, height]` in pixels (default: [256, 256])

**Example:**

```typescript
const iconStyle = {
  src: "/img/marker-red.png",
  scale: 0.75,
  anchor: [0.5, 1], // Center bottom
  anchorXUnits: "fraction",
  anchorYUnits: "fraction",
};
```

---

## Events

### onGeometryAdded()

Registers a callback for when a geometry is added.

```typescript
onGeometryAdded(callback: GeometryAddedDelegate): void
```

**Callback Signature:**

```typescript
type GeometryAddedDelegate = (sender: GeometryApi, event: Feature) => void;
```

**Example:**

```typescript
mapViewer.layer.geometry.onGeometryAdded((sender, feature) => {
  const featureId = feature.get("featureId");
  console.log("Geometry added:", featureId);
});
```

### offGeometryAdded()

Unregisters a geometry added callback.

```typescript
offGeometryAdded(callback: GeometryAddedDelegate): void
```

---

## Static Utility Methods

### createGeometryFromType()

Creates an OpenLayers geometry from a type and coordinates.

```typescript
static createGeometryFromType(
  geometryType: TypeStyleGeometry,
  coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][]
): OLGeometry
```

**Parameters:**

- `geometryType` - Geometry type: 'Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'
- `coordinates` - Coordinates in the appropriate format

**Returns:** OpenLayers Geometry object

**Example:**

```typescript
import { GeometryApi } from "@/geo/layer/geometry/geometry";

const polygon = GeometryApi.createGeometryFromType("Polygon", [
  [
    [-75.7, 45.4],
    [-75.6, 45.4],
    [-75.6, 45.5],
    [-75.7, 45.5],
    [-75.7, 45.4],
  ],
]);
```

---

### Type Guards

The Geometry API provides static type guard methods to check coordinate types:

#### isCoordinates()

Checks if coordinates represent a single point.

```typescript
static isCoordinates(coordinates: any): coordinates is Coordinate
```

#### isArrayOfCoordinates()

Checks if coordinates represent a LineString or MultiPoint.

```typescript
static isArrayOfCoordinates(coordinates: any): coordinates is Coordinate[]
```

#### isArrayOfArrayOfCoordinates()

Checks if coordinates represent a Polygon or MultiLineString.

```typescript
static isArrayOfArrayOfCoordinates(coordinates: any): coordinates is Coordinate[][]
```

#### isArrayOfArrayOfArrayOfCoordinates()

Checks if coordinates represent a MultiPolygon.

```typescript
static isArrayOfArrayOfArrayOfCoordinates(coordinates: any): coordinates is Coordinate[][][]
```

---

## Common Use Cases

### Drawing User Annotations

```typescript
// Create an annotations group
mapViewer.layer.geometry.createGeometryGroup("userAnnotations");
mapViewer.layer.geometry.setActiveGeometryGroup("userAnnotations");

// Add various geometries
const marker = mapViewer.layer.geometry.addMarkerIcon(
  [-75.6972, 45.4215],
  {
    style: { src: "/img/annotation-marker.png", scale: 0.5 },
  },
  "note1"
);

const highlight = mapViewer.layer.geometry.addPolygon(
  [
    [
      [-75.7, 45.4],
      [-75.6, 45.4],
      [-75.6, 45.5],
      [-75.7, 45.5],
      [-75.7, 45.4],
    ],
  ],
  {
    style: {
      fillColor: "#ffff00",
      fillOpacity: 0.3,
      strokeColor: "#ff8800",
      strokeWidth: 2,
    },
  },
  "highlight1"
);

// Toggle visibility
const toggleButton = document.getElementById("toggleAnnotations");
toggleButton.addEventListener("click", () => {
  const group = mapViewer.layer.geometry.getGeometryGroup("userAnnotations");
  const isVisible = group.vectorLayer.getVisible();
  if (isVisible) {
    mapViewer.layer.geometry.setGeometryGroupAsInvisible("userAnnotations");
  } else {
    mapViewer.layer.geometry.setGeometryGroupAsVisible("userAnnotations");
  }
});
```

---

### Search Radius Visualization

```typescript
// Show search radius around a point
function showSearchRadius(center, radiusKm) {
  // Remove existing search radius
  const existingCircle = mapViewer.layer.geometry.getGeometry("searchRadius");
  if (existingCircle) {
    mapViewer.layer.geometry.deleteGeometry("searchRadius");
  }

  // Add new search radius
  mapViewer.layer.geometry.addCircle(
    center,
    {
      projection: 4326,
      style: {
        radius: radiusKm,
        fillColor: "#0088ff",
        fillOpacity: 0.1,
        strokeColor: "#0044ff",
        strokeWidth: 2,
        strokeOpacity: 0.8,
      },
    },
    "searchRadius",
    "searchGroup"
  );

  // Add center marker
  mapViewer.layer.geometry.addMarkerIcon(
    center,
    {
      projection: 4326,
      style: {
        src: "/img/search-marker.png",
        scale: 0.6,
        anchor: [0.5, 1],
      },
    },
    "searchCenter",
    "searchGroup"
  );
}

// Usage
showSearchRadius([-75.6972, 45.4215], 50); // 50km radius around Ottawa
```

---

### Route Visualization

```typescript
// Draw a route with waypoints
function drawRoute(waypoints, routeId) {
  // Create route group if it doesn't exist
  mapViewer.layer.geometry.createGeometryGroup("routes");

  // Draw the route line
  mapViewer.layer.geometry.addPolyline(
    waypoints,
    {
      projection: 4326,
      style: {
        strokeColor: "#0066cc",
        strokeWidth: 4,
        strokeOpacity: 0.8,
      },
    },
    `${routeId}-line`,
    "routes"
  );

  // Add start marker
  mapViewer.layer.geometry.addMarkerIcon(
    waypoints[0],
    {
      projection: 4326,
      style: {
        src: "/img/start-marker.png",
        scale: 0.5,
        anchor: [0.5, 1],
      },
    },
    `${routeId}-start`,
    "routes"
  );

  // Add end marker
  mapViewer.layer.geometry.addMarkerIcon(
    waypoints[waypoints.length - 1],
    {
      projection: 4326,
      style: {
        src: "/img/end-marker.png",
        scale: 0.5,
        anchor: [0.5, 1],
      },
    },
    `${routeId}-end`,
    "routes"
  );
}

// Usage
const route = [
  [-75.6972, 45.4215], // Ottawa
  [-74.006, 45.0522], // Kingston
  [-79.3832, 43.6532], // Toronto
];
drawRoute(route, "route1");
```

---

### Dynamic Geometry Updates

```typescript
// Update geometry position in real-time
let markerPosition = [-75.6972, 45.4215];

mapViewer.layer.geometry.addMarkerIcon(
  markerPosition,
  undefined,
  "movingMarker"
);

// Simulate movement
setInterval(() => {
  // Update position (e.g., from GPS or animation)
  markerPosition[0] += 0.001;
  markerPosition[1] += 0.0005;

  // Update marker coordinates
  mapViewer.layer.geometry.setFeatureCoords(
    "movingMarker",
    markerPosition,
    4326
  );
}, 1000);
```

---

## Best Practices

### 1. Use Geometry Groups for Organization

```typescript
// Group related geometries together
mapViewer.layer.geometry.createGeometryGroup("boundaries");
mapViewer.layer.geometry.createGeometryGroup("annotations");
mapViewer.layer.geometry.createGeometryGroup("measurements");
```

### 2. Always Provide Feature IDs

```typescript
// Good: Easy to retrieve and manage
mapViewer.layer.geometry.addMarkerIcon(coords, options, "locationMarker");

// Less ideal: Must track the Feature object
const marker = mapViewer.layer.geometry.addMarkerIcon(coords);
```

### 3. Clean Up Geometries

```typescript
// Remove geometries when no longer needed
function clearSearchResults() {
  mapViewer.layer.geometry.deleteGeometriesFromGroup("searchResults");
}

// Or delete the entire group
function removeTemporaryMarkers() {
  mapViewer.layer.geometry.deleteGeometryGroup("temporary");
}
```

### 4. Specify Projections

```typescript
// Always specify projection when coordinates aren't in WGS84
mapViewer.layer.geometry.addMarkerIcon(
  [2800000, 1200000], // Web Mercator coordinates
  { projection: 3857 }
);
```

### 5. Handle Events for Updates

```typescript
// Listen for geometry additions
mapViewer.layer.geometry.onGeometryAdded((sender, feature) => {
  const featureId = feature.get("featureId");
  updateGeometryList(featureId);
});
```

---

## Properties

### geometryGroups

Array of all geometry groups.

```typescript
geometryGroups: FeatureCollection[]
```

### geometries

Array of all geometries across all groups.

```typescript
geometries: Feature[]
```

### defaultGeometryGroupId

The ID of the default geometry group (created automatically).

```typescript
defaultGeometryGroupId: string; // "defaultGeomGroup"
```

### activeGeometryGroupIndex

Index of the currently active geometry group.

```typescript
activeGeometryGroupIndex: number;
```

---

## See Also

- **[Layer API](./layer-api.md)** - Layer management methods
- **[API Utilities - Geo](./api-utilities.md#geo-utilities)** - Geometry conversion utilities (WKT, area, distance)
- **[Packages - Drawer](./packages.md#4-geoview-drawer)** - Interactive drawing package
- **[Event Processors](./event-processors.md#10-drawereventprocessor)** - DrawerEventProcessor for interactive drawing
