# 18 — Swiper

Swiper plugin for comparing layers.

## Lifecycle

Config: `configs/navigator/demos/14-package-swiper.json`

- [ ] **Activate swiper** — Enable the swiper. Verify the split view appears on the map.
- [ ] **Deactivate swiper** — Disable the swiper. Verify the map returns to normal single view.

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

---

## Issues Found

<!-- Record any issues below -->
