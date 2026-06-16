# 17c — Swiper

Swiper plugin for comparing layers.

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

- [ ] **Activate swiper** — Call `activateForLayer` with a valid layer path. Verify the split view appears on the map.
- [ ] **Deactivate swiper** — Call `deActivateForLayer`. Verify the map returns to normal single view.
- [ ] **Deactivate all** — Activate multiple layers, then call `deActivateAll`. Verify all swiper layers are removed.

## Layer Management

- [ ] **Add layer to swiper** — Add a layer to the swiper comparison. Verify it appears on one side.
- [ ] **Remove layer** — Remove a layer from the swiper. Verify it is removed from the comparison.
- [ ] **Remove all layers** — Remove all layers from the swiper. Verify the swiper handles empty state.
- [ ] **Add layer after remove all** — After removing all, add a new layer. Verify the swiper resumes working.

## Orientation

- [ ] **Vertical swiper** — Set the swiper to vertical orientation. Verify the split is vertical.
- [ ] **Horizontal swiper** — Set to horizontal orientation. Verify the split is horizontal.
- [ ] **Switch orientation** — Switch between vertical and horizontal. Verify smooth transition.

## Map Rotation with Swiper

- [ ] **Rotate map** — Rotate the map while the swiper is active. Verify the swiper divider rotates with the map correctly.
- [ ] **Swipe position** — Drag the swiper divider. Verify it moves smoothly and clips layers correctly.

## Swiper + Details Interaction

- [ ] **Features hidden by swiper** — Features hidden by the swiper should not be queryable. Click on the hidden side — verify no details appear for those features.
- [ ] **Hover disabled** — Hover over features on the hidden side. Verify no tooltip appears.
