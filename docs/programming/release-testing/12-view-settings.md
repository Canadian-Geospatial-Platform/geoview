# 12 — View Settings

Zoom constraints, extent overrides, and zoom-to-layer.

## Restricted Zoom

Config: `configs/navigator/demos/04-restrict-zoom.json`

- [ ] **Min zoom enforced** — Try to zoom out below the configured min zoom. Verify the map stops at the minimum.
- [ ] **Max zoom enforced** — Try to zoom in above the configured max zoom. Verify the map stops at the maximum.
- [ ] **Zoom to 20** — In the browser console, run `cgpv.api.maps['mapId'].controllers.mapController.zoomMap(20)`. Verify it clamps to the restricted max limit.
- [ ] **Zoom to 1** — In the browser console, run `cgpv.api.maps['mapId'].controllers.mapController.zoomMap(1)`. Verify it clamps to the restricted min limit.

## Initial View

The `viewSettings.initialView` property determines the map's initial focus. Three modes are available (mutually exclusive):

### layerIds

Config: `configs/navigator/demos/06-zoom-layer.json`

- [ ] **Zoom to specific layers** — Verify the map loads zoomed to the extent of the layers specified in `initialView.layerIds`.
- [ ] **Zoom to union of all layers** — Use a config with `initialView.layerIds: []` (empty array = use all layers as initial focus). Verify the map zooms to the union of all layer extents on load. Test using the sandbox.

### zoomAndCenter

- [ ] **Zoom and center** — Use a config with `initialView.zoomAndCenter` (e.g., `[4, [-75, 45]]`). Verify the map loads at the specified zoom level centered on the given coordinates.

### extent

- [ ] **Initial extent** — Use a config with `initialView.extent` (bounding box array). Verify the map loads fitted to the specified extent.

## Max Extent

Config: `configs/navigator/demos/05-max-extent-override.json`

- [ ] **Unrestricted pan** — Zoom out fully. Verify the map extent is larger than the default extent.
- [ ] **Compare extents** — Compare the visible extent with the default extent AND the one configured in the config. Verify the configured `maxExtent` is applied.
- [ ] **Pan constrained** — Pan the map. Verify you cannot pan beyond the configured max extent boundaries.

## Rotation & Home View

Config: `configs/navigator/demos/27-view-settings-rotation-home.json`

This config has `initialView` (zoom 7, Ottawa) and a separate `homeView` (zoom 4, Canada). By default, Home equals the initial view, but `homeView` can override it independently.

- [ ] **Initial rotation** — Verify the map loads with the configured initial rotation (45°).
- [ ] **Initial view differs from home** — Verify the map loads at `initialView` (zoom 7, centered on Ottawa), not at `homeView`.
- [ ] **Home view** — Click Home. Verify it navigates to the configured `homeView` (zoom 4, centered on Canada), which is different from the initial view.

## Initial Click Coordinate

- [ ] **Initial click marker** — Use a config with `viewSettings.initialClickCoordinate` set. Verify the map loads with a click marker at the specified coordinate and the Details panel opens with query results for that location.
