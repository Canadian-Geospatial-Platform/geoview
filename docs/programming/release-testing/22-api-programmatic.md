# 23 — API & Programmatic Usage

Testing the public JavaScript API, event system, geometry API, dynamic panel management, and programmatic map manipulation.

## API Functions & Events

Demo: `templates/demos-specific/demo-function-event.html`

- [ ] **Layer status monitoring** — Load the page. Verify the collapsible "Layers Status" section updates in real-time as layers load (shows status transitions: loading → loaded / error).
- [ ] **Event listeners fire** — Open browser console. Verify `onMapMoveEnd`, `onLayerAdded`, and `onLayerRemoved` events fire when expected (pan map, add/remove layer).
- [ ] **Filter application via API** — Use the filter textarea controls on the page to apply a filter string. Verify the map updates to show only filtered features.
- [ ] **Error layer in event list** — Verify the intentional error layer (`errorId`) reports error status in the layer status display without crashing the page.

## Geometry API (Programmatic)

Demo: `templates/demos/geometry.html`

- [ ] **Add Polyline** — Click "Add Polyline" button. Verify a polyline geometry appears on the map.
- [ ] **Add Polygon** — Click "Add Polygon" button. Verify a polygon geometry appears on the map.
- [ ] **Add Circle** — Click "Add Circle" button. Verify a circle geometry appears on the map.
- [ ] **Add Marker Icon** — Click "Add Marker Icon" button. Verify a marker icon appears on the map.
- [ ] **Create Geometry Group** — Enter a group name and click "Create Geometry Group". Verify the group appears in the select dropdown.
- [ ] **Active group assignment** — Select a group from the dropdown, then add geometries. Verify new geometries are added to the selected group.
- [ ] **Delete Group** — Select a group and click "Delete Active Group". Verify all geometries in that group are removed from the map.
- [ ] **Default group** — Add geometries without selecting a custom group. Verify they belong to the "Default" group.

## Interactions API (Low-Level Draw)

Demo: `templates/demos/inter-all.html`

- [ ] **Multi-group drawing** — Draw shapes in Group A (blue), Group B (red), and Group C (green). Verify each group's shapes render with correct colors.
- [ ] **Shape selection per group** — Select different shape types (Point/LineString/Polygon/Circle/Geodesic) in each group. Verify drawing mode activates correctly for each.
- [ ] **Select + Translate mode** — Enable "Select + Translate mode" checkbox. Click a shape to select it, then drag to move. Verify the shape translates to the new position.
- [ ] **Extent mode** — Enable "Extent mode" checkbox. Shift-Drag to draw an extent rectangle. Shift-Drag corners/edges to resize. Shift-Click outside to remove.
- [ ] **Modify mode per group** — Enable "Modify" for a group. Verify vertices become draggable on that group's shapes only.
- [ ] **Snap toggle** — Enable "Snap" for a group. Draw near an existing vertex. Verify snapping occurs.

## Bounding Box Selector

Demo: `templates/demos/inter-bounding-box-selector.html`

- [ ] **Initial box display** — Load the page. Verify a bounding box rectangle appears on the map with the default coordinates (North: 70, East: -70, South: 60, West: -100).
- [ ] **Form → Map sync** — Change the North input to 75. Verify the bounding box rectangle on the map updates to reflect the new extent.
- [ ] **Map → Form sync** — Drag a corner of the bounding box on the map. Verify the coordinate inputs update to reflect the new position.
- [ ] **Translate box** — Click and drag the center of the box. Verify the box moves and all four coordinate inputs update.
- [ ] **Resize via vertices** — Drag an edge or vertex of the box. Verify the box resizes and corresponding inputs update.

## Add Panels API

Demo: `templates/demos/add-panels.html`

- [ ] **Add Appbar Panel** — Click "Add Appbar Panel". Verify a new panel tab appears in the app bar with content.
- [ ] **Add Navbar Panel** — Click "Add Navbar Panel". Verify a new panel button appears in the navigation bar.
- [ ] **Add Navbar Button** — Enter a group name, click "Add Navbar Button". Verify a button appears in the specified group.
- [ ] **Multiple panels** — Add several appbar panels. Verify each appears as a separate tab with unique content.
- [ ] **Panel interaction** — Click the dynamically added panel tabs. Verify they open and close correctly.

## API Loads (Geometry Endpoint)

Demo: `templates/demos/api-loads.html`

- [ ] **data-geometry-endpoint attribute** — Load the page. Verify the map initializes with the configured `data-geometry-endpoint` URL.
- [ ] **Load geometries from URL param** — Append `?geoms=<id>` to the URL. Verify geometries from the STAC API are loaded and displayed on the map.
- [ ] **No geoms param** — Load the page without `?geoms=`. Verify the map loads without errors (empty state).

## PyGeoAPI Process Integration

Demo: `templates/demos/pygeoapi-processes.html`

- [ ] **POST process result** — Load the page. Verify the GeoJSON layer created from the PyGeoAPI process response renders on the map.
- [ ] **Layer attributes** — Open the data table for the process-result layer. Verify feature attributes are present and correctly displayed.
- [ ] **Combined with WMS** — Verify both the WMS Hydro Network layer and the PyGeoAPI result layer render simultaneously.

## GeoJSON Feature Injection

Demo: `templates/demos-specific/demo-geojson-inject.html`

- [ ] **Empty layer on load** — Load the page. Verify the map initializes with an empty GeoJSON layer (no features visible).
- [ ] **Inject features** — Use the API/buttons on the page to inject GeoJSON features. Verify features appear on the map.
- [ ] **Multiple injections** — Inject features multiple times. Verify they accumulate (previous features persist).
- [ ] **Layer in legend** — Verify the GeoJSON layer appears in the legend even when empty, and feature count updates after injection.

## Events Demo

Demo: `templates/demos/events.html`

- [ ] **Map init event** — Load the page. Verify the init event fires and is logged.
- [ ] **Map move event** — Pan the map. Verify move events are captured and displayed.
- [ ] **Custom event emit** — If the page provides a button to emit custom events, click it. Verify the event is received by the listener.
