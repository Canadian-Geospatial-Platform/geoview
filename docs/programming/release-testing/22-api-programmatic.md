# 22 — API & Programmatic Usage

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-22-api-programmatic.html](../../packages/geoview-core/public/templates/release-testing/rt-22-api-programmatic.html) — Links to demo-function-event, geometry, inter-all, bounding-box-selector, panels demo pages.

Testing the public JavaScript API, event system, geometry API, dynamic panel management, and programmatic map manipulation.

## API Functions & Events

Demo: `templates/demos-specific/demo-function-event.html`

| Test                       | Description               | Steps                                                                       | Expected Result                                                                          | Auto |
| -------------------------- | ------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---- |
| Layer status monitoring    | Real-time status updates  | 1. Load the page<br>2. Observe the collapsible "Layers Status" section      | Updates in real-time as layers load (shows status transitions: loading → loaded / error) | M    |
| Event listeners fire       | Events trigger on actions | 1. Open browser console<br>2. Pan the map, add/remove a layer               | `onMapMoveEnd`, `onLayerAdded`, and `onLayerRemoved` events fire when expected           | M    |
| Filter application via API | API filter updates map    | 1. Use the filter textarea controls on the page<br>2. Apply a filter string | Map updates to show only filtered features                                               | M    |
| Error layer in event list  | Error layer doesn't crash | 1. Observe the intentional error layer (`errorId`)                          | Reports error status in the layer status display without crashing the page               | M    |

## Geometry API (Programmatic)

Demo: `templates/demos/geometry.html`

| Test                    | Description                  | Steps                                                     | Expected Result                                       | Auto |
| ----------------------- | ---------------------------- | --------------------------------------------------------- | ----------------------------------------------------- | ---- |
| Add Polyline            | Polyline appears on map      | 1. Click "Add Polyline" button                            | A polyline geometry appears on the map                | M    |
| Add Polygon             | Polygon appears on map       | 1. Click "Add Polygon" button                             | A polygon geometry appears on the map                 | M    |
| Add Circle              | Circle appears on map        | 1. Click "Add Circle" button                              | A circle geometry appears on the map                  | M    |
| Add Marker Icon         | Marker icon appears on map   | 1. Click "Add Marker Icon" button                         | A marker icon appears on the map                      | M    |
| Create Geometry Group   | Group appears in dropdown    | 1. Enter a group name<br>2. Click "Create Geometry Group" | Group appears in the select dropdown                  | M    |
| Active group assignment | Geometries added to group    | 1. Select a group from the dropdown<br>2. Add geometries  | New geometries are added to the selected group        | M    |
| Delete Group            | Group geometries removed     | 1. Select a group<br>2. Click "Delete Active Group"       | All geometries in that group are removed from the map | M    |
| Default group           | No-group defaults to Default | 1. Add geometries without selecting a custom group        | They belong to the "Default" group                    | M    |

## Interactions API (Low-Level Draw)

Demo: `templates/demos/inter-all.html`

| Test                      | Description                       | Steps                                                                                                                                                      | Expected Result                                     | Auto |
| ------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---- |
| Multi-group drawing       | Groups render with correct colors | 1. Draw shapes in Group A (blue), Group B (red), and Group C (green)                                                                                       | Each group's shapes render with correct colors      | M    |
| Shape selection per group | Drawing mode per shape type       | 1. Select different shape types (Point/LineString/Polygon/Circle/Geodesic) in each group                                                                   | Drawing mode activates correctly for each           | M    |
| Select + Translate mode   | Shapes can be moved               | 1. Enable "Select + Translate mode" checkbox<br>2. Click a shape to select it<br>3. Drag to move                                                           | Shape translates to the new position                | M    |
| Extent mode               | Extent rectangle drawn            | 1. Enable "Extent mode" checkbox<br>2. Shift-Drag to draw an extent rectangle<br>3. Shift-Drag corners/edges to resize<br>4. Shift-Click outside to remove | Extent rectangle is drawn, resizable, and removable | M    |
| Modify mode per group     | Vertices become draggable         | 1. Enable "Modify" for a group<br>2. Drag a vertex                                                                                                         | Vertices are draggable on that group's shapes only  | M    |
| Snap toggle               | Snapping to existing vertices     | 1. Enable "Snap" for a group<br>2. Draw near an existing vertex                                                                                            | Snapping occurs                                     | M    |

## Bounding Box Selector

Demo: `templates/demos/inter-bounding-box-selector.html`

| Test                | Description                | Steps                                           | Expected Result                                                                     | Auto |
| ------------------- | -------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------- | ---- |
| Initial box display | Default box on load        | 1. Load the page                                | Bounding box rectangle appears with default coordinates (N:70, E:-70, S:60, W:-100) | M    |
| Form → Map sync     | Input change updates map   | 1. Change the North input to 75                 | Bounding box on map updates to reflect the new extent                               | M    |
| Map → Form sync     | Drag updates inputs        | 1. Drag a corner of the bounding box on the map | Coordinate inputs update to reflect the new position                                | M    |
| Translate box       | Box moves with drag        | 1. Click and drag the center of the box         | Box moves; all four coordinate inputs update                                        | M    |
| Resize via vertices | Box resizes with edge drag | 1. Drag an edge or vertex of the box            | Box resizes; corresponding inputs update                                            | M    |

## Add Panels API

Demo: `templates/demos/add-panels.html`

| Test              | Description                   | Steps                                                 | Expected Result                                    | Auto |
| ----------------- | ----------------------------- | ----------------------------------------------------- | -------------------------------------------------- | ---- |
| Add Appbar Panel  | Panel tab added to app bar    | 1. Click "Add Appbar Panel"                           | New panel tab appears in the app bar with content  | M    |
| Add Navbar Panel  | Panel button in nav bar       | 1. Click "Add Navbar Panel"                           | New panel button appears in the navigation bar     | M    |
| Add Navbar Button | Button in specified group     | 1. Enter a group name<br>2. Click "Add Navbar Button" | Button appears in the specified group              | M    |
| Multiple panels   | Each panel has unique content | 1. Add several appbar panels                          | Each appears as a separate tab with unique content | M    |
| Panel interaction | Dynamic panels open/close     | 1. Click the dynamically added panel tabs             | They open and close correctly                      | M    |

## API Loads (Geometry Endpoint)

Demo: `templates/demos/api-loads.html`

| Test                             | Description              | Steps                              | Expected Result                                                  | Auto |
| -------------------------------- | ------------------------ | ---------------------------------- | ---------------------------------------------------------------- | ---- |
| data-geometry-endpoint attribute | Map uses endpoint        | 1. Load the page                   | Map initializes with the configured `data-geometry-endpoint` URL | M    |
| Load geometries from URL param   | Geometries from STAC API | 1. Append `?geoms=<id>` to the URL | Geometries from the STAC API are loaded and displayed on the map | M    |
| No geoms param                   | Empty state graceful     | 1. Load the page without `?geoms=` | Map loads without errors (empty state)                           | M    |

## PyGeoAPI Process Integration

Demo: `templates/demos/pygeoapi-processes.html`

| Test                | Description              | Steps                                               | Expected Result                                                 | Auto |
| ------------------- | ------------------------ | --------------------------------------------------- | --------------------------------------------------------------- | ---- |
| POST process result | Process GeoJSON renders  | 1. Load the page                                    | GeoJSON layer from PyGeoAPI process response renders on the map | M    |
| Layer attributes    | Attributes in data table | 1. Open the data table for the process-result layer | Feature attributes are present and correctly displayed          | M    |

## GeoJSON Feature Injection

Demo: `templates/demos-specific/demo-geojson-inject.html`

| Test                        | Description                    | Steps                                                        | Expected Result                                                   | Auto |
| --------------------------- | ------------------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------- | ---- |
| Empty layer on load         | No features initially          | 1. Load the page                                             | Map initializes with an empty GeoJSON layer (no features visible) | M    |
| Inject features             | Features appear on map         | 1. Use the API/buttons to inject GeoJSON features            | Features appear on the map                                        | M    |
| Multiple injections         | Features accumulate            | 1. Inject features multiple times                            | They accumulate (previous features persist)                       | M    |
| Layer in legend             | Legend shows layer             | 1. Check the legend                                          | GeoJSON layer appears in the legend even when empty               | M    |
| Feature count in data table | Data table reflects injections | 1. Open the data table for the GeoJSON layer after injection | Row count matches the number of injected features                 | M    |

## Events Demo

Demo: `templates/demos/events.html`

| Test              | Description              | Steps                                            | Expected Result                        | Auto |
| ----------------- | ------------------------ | ------------------------------------------------ | -------------------------------------- | ---- |
| Map init event    | Init event fires on load | 1. Load the page                                 | Init event fires and is logged         | M    |
| Map move event    | Move events captured     | 1. Pan the map                                   | Move events are captured and displayed | M    |
| Custom event emit | Custom events received   | 1. Click the button to emit notifications events | Event is received by the listener      | M    |
