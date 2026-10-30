# Map, geo and OpenLayers runtime

Owner: MapGeoExpert. Public documentation is canonical.

Read only the linked section of each doc: search for its heading and read to the next heading of the same level; expand only if needed (`AGENTS.md` → Reading linked docs).

| Topic                                                                     | Canonical section                                                                                                                                                                          |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Initialization and typed map events                                       | [MapViewer events](../../docs/programming/event-helper.md#mapviewer-events)                                                                                                                |
| Viewer/map DOM distinction, static/dynamic, crosshair/keyboard            | [Keyboard behavior](../../docs/app/accessibility.md#keyboard-navigation-mode), [Implementation](ui-style-a11y-i18n.md#keyboard-mode-and-panel-focus)                                          |
| Fixed collapsed viewer sizing and info bar                                | [MapController runtime](../../docs/programming/controller-architecture.md#mapcontroller)                                                                                                   |
| North-pole coordinate order, rotated pixel containment, hidden transforms | [MapController runtime](../../docs/programming/controller-architecture.md#mapcontroller)                                                                                                   |
| Effective scale/visibility                                                | [Layer runtime invariants](../../docs/programming/adding-layer-types.md#runtime-invariants)                                                                                                |
| Config view shape and plugin loading                                      | [View settings](../../docs/app/config/configuration-reference.md#viewsettings-required), [Package loading](../../docs/app/config/configuration-reference.md#package-configuration-methods) |
| Controller/store synchronization                                          | [Store access](../../docs/programming/using-store.md#store-access-patterns)                                                                                                                |
| Awaitable test zoom versus immediate MapViewer call                       | [Test zoom gotcha](../../docs/app/testing/test-templates.md#controllers-vs-mapviewer-for-zoom)                                                                                             |
| Viewport boundary sampling and midpoint fitting                           | [Visible Viewport Boundary](../../docs/app/api/map-viewer-api.md#visible-viewport-boundary)                                                                                                |
| Fullscreen enter/exit view restore, size-driven view constraints          | [Fullscreen view preservation](../../docs/programming/controller-architecture.md#fullscreen-view-preservation)                                                                             |

## Viewport boundary and midpoint fitting

Public integration behavior and usage examples are documented in [Visible Viewport Boundary](../../docs/app/api/map-viewer-api.md#visible-viewport-boundary).
Keep that section canonical for callers; this section records source-level implementation details only.

- `getViewportBoundaryLonLat()` samples the padded viewport rectangle using pixel-to-coordinate conversion, then transforms samples to lon/lat without wrapping longitudes. This preserves wrapped-world coordinates for integrations.
- `midpointWSENCoords` is assembled in west, south, east, north order. Do not treat the four coordinate pairs as an extent tuple.
- `fitViewportToMidpointsLonLat()` validates input and requires a usable rendered viewport before changing the view. It projects all four points, optionally updates rotation, fits a `MultiPoint`, and waits for rendering.
- The private rotation helper normalizes the projected west-to-east and south-to-north directions before combining them, so each direction has equal influence independent of length. Opposing estimates that cancel cannot define a unique rotation and raise `InvalidViewportMidpointsError`.
- Animated rotation completes before the fit because OpenLayers calculates the fit against the current view rotation. Either animation may be interrupted; cancellation rejects without rolling back view changes already applied.

Source: [`map-viewer.ts`](../../packages/geoview-core/src/geo/map/map-viewer.ts), especially `getViewportBoundaryLonLat()`, `fitViewportToMidpointsLonLat()`, and `#getViewportMidpointRotation()`.

## Source navigation and guardrails

- Register init/ready listeners before `cgpv.init`; init can fire before layer loading finishes.
- Trace sizing through Shell → `useMapResize`, not just OL canvas dimensions.
- `NORTH_POLE_POSITION_LONLAT` uniquely stores lat/lon: swap at projection boundaries.
- Use pixel-space direction/containment; do not replace it with singular geographic bearings.
- MapViewer/OL access stays in controllers/plugin lifecycle, never rendered React components.
- Crosshair pixel/coordinate alignment (#3712): follow the [keyboard contract](../../docs/app/accessibility.md#keyboard-navigation-mode).
  `Crosshair` samples the viewport midpoint through `MapController.getViewportCenterPosition` (built on `getMapPositionFromPixel`); keep its CSS center and sampled pixel aligned.

For Swiper render clipping and drag isolation, follow [package-specific runtime routing](packages.md#swiper-runtime).
