# 17c — Swiper

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-17c-swiper.html](https://canadian-geospatial-platform.github.io/geoview/public/rt-17c-swiper.html) — Map 1 (two GeoCore layers + swiper plugin with activate/deactivate buttons).
>
> **Demo page:** [package-swiper.html](../../packages/geoview-core/public/templates/demos/package-swiper.html)

Swiper plugin for comparing layers. The swiper is a core package plugin (`geoview-swiper`) that splits the map view to compare layers side-by-side.

## Lifecycle

Demo: `templates/demos/package-swiper.html`

Swiper is activated/deactivated via the console API:

```js
cgpv.api.getMapViewer("mapId").plugins["swiper"].activateForLayer("layerPath");
cgpv.api
  .getMapViewer("mapId")
  .plugins["swiper"].deActivateForLayer("layerPath");
cgpv.api.getMapViewer("mapId").plugins["swiper"].deActivateAll();
```

| Test              | Description               | Steps                                                  | Expected Result                                      | Auto |
| ----------------- | ------------------------- | ------------------------------------------------------ | ---------------------------------------------------- | ---- |
| Activate swiper   | Split view appears        | 1. Call `activateForLayer` with a valid layer path     | Split view appears on the map with swiper divider    | A    |
| Deactivate swiper | Map returns to normal     | 1. Call `deActivateForLayer`                           | Map returns to normal single view                    | A    |
| Deactivate all    | All swiper layers removed | 1. Activate multiple layers<br>2. Call `deActivateAll` | All swiper layers are removed; map returns to normal | A    |

## Layer Management

Demo: `templates/demos/package-swiper.html`

| Test                   | Description                | Steps                                   | Expected Result                           | Auto |
| ---------------------- | -------------------------- | --------------------------------------- | ----------------------------------------- | ---- |
| Add layer to swiper    | Layer appears on one side  | 1. Add a layer to the swiper comparison | Layer appears on one side of the split    | C    |
| Remove layer           | Layer removed from split   | 1. Remove a layer from the swiper       | Layer is removed from the comparison      | C    |
| Remove all layers      | Swiper handles empty state | 1. Remove all layers from the swiper    | Swiper handles empty state gracefully     | C    |
| Add layer after remove | Swiper resumes working     | 1. After removing all, add a new layer  | Swiper resumes working with the new layer | C    |

## Orientation

Demo: `templates/demos/package-swiper.html`

```js
cgpv.api.getMapViewer("mapId").plugins["swiper"].setOrientation("vertical");
cgpv.api.getMapViewer("mapId").plugins["swiper"].setOrientation("horizontal");
```

| Test               | Description         | Steps                                                                          | Expected Result                          | Auto |
| ------------------ | ------------------- | ------------------------------------------------------------------------------ | ---------------------------------------- | ---- |
| Vertical swiper    | Split is vertical   | 1. Call `setOrientation('vertical')`                                           | Split divider is vertical (left/right)   | C    |
| Horizontal swiper  | Split is horizontal | 1. Call `setOrientation('horizontal')`                                         | Split divider is horizontal (top/bottom) | C    |
| Switch orientation | Smooth transition   | 1. Call `setOrientation('vertical')`<br>2. Call `setOrientation('horizontal')` | Smooth transition between orientations   | C    |

## Map Rotation with Swiper

Demo: `templates/demos/package-swiper.html`

| Test           | Description                    | Steps                                        | Expected Result                                   | Auto |
| -------------- | ------------------------------ | -------------------------------------------- | ------------------------------------------------- | ---- |
| Rotate map     | Divider rotates with map       | 1. Rotate the map while the swiper is active | Swiper divider rotates with the map correctly     | M    |
| Swipe position | Divider moves and clips layers | 1. Drag the swiper divider                   | Divider moves smoothly and clips layers correctly | M    |

## Map Resize with Swiper

Demo: `templates/demos/package-swiper.html`

The swiper bar and the layer clip rectangle both derive from the divider percentage of the current map size, so they stay aligned on resize.

| Test       | Description               | Steps                                                    | Expected Result                                                    | Auto |
| ---------- | ------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------ | ---- |
| Grow map   | Bar and clip stay aligned | 1. Enlarge the window/map while the swiper is active     | The divider bar and the clipped layer edge remain aligned (no gap) | M    |
| Shrink map | Bar and clip stay aligned | 1. Reduce the window/map size while the swiper is active | The divider bar and the clipped layer edge remain aligned (no gap) | M    |

## Interactive Mode (Layer Settings Panel)

Demo: `templates/demos/package-swiper.html` (loaded with `"interactive": true`)

When the swiper config sets `"interactive": true`, each layer's right panel exposes a **Swiper** section (settings gear) to add/remove the layer and choose its visible side. Side options follow the orientation (left/right for vertical, up/down for horizontal). When `interactive` is `false` (default), no section appears and the swiper stays static.

| Test                    | Description                             | Steps                                                                             | Expected Result                                                       | Auto |
| ----------------------- | --------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---- |
| Settings section shown  | Swiper section appears when interactive | 1. Open a layer's right panel<br>2. Click the settings gear                       | A "Swiper" section with a "Show in Swiper" toggle is visible          | M    |
| Add via settings        | Layer joins the swiper                  | 1. Toggle "Show in Swiper" on                                                     | The layer is clipped by the swiper; a side selector appears           | M    |
| Change side             | Layer reveals on the chosen side        | 1. With the layer in the swiper, pick a different side in the selector            | The layer's visible side switches accordingly (left/right or up/down) | M    |
| Section hidden (static) | No section when not interactive         | 1. Load a config without `interactive` (or `false`)<br>2. Open a layer's settings | No "Swiper" section appears; swiper behaves exactly as before         | M    |

## Swiper + Details Interaction

Demo: `templates/demos/package-swiper.html`

| Test                      | Description                   | Steps                                     | Expected Result                                   | Auto |
| ------------------------- | ----------------------------- | ----------------------------------------- | ------------------------------------------------- | ---- |
| Features hidden by swiper | Hidden features not queryable | 1. Click on the hidden side of the swiper | No details appear for features on the hidden side | M    |
| Hover disabled            | No tooltip on hidden side     | 1. Hover over features on the hidden side | No tooltip appears for hidden features            | M    |
