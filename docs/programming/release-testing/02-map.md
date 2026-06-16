# 02 — Map

Map rendering, projections, north pole, and north arrow.

## Projections

- [ ] **3 projections supported** — Load a map in each projection and verify it renders correctly:
  - EPSG:3978 (LCC — Lambert Conformal Conic)
  - EPSG:3857 (Web Mercator)
  - EPSG:3573 (North Pole LAEA)
- [ ] **Projection switch** — Switch between LCC (EPSG:3978) and WM (EPSG:3857) using the projection selector. Verify the map re-renders correctly each time. Note: EPSG:3573 has no default basemap so projection switch is not available for it.
- [ ] **Layer rendering after switch** — Verify all loaded layers re-render correctly after each projection switch.

## North Pole & North Arrow

- [ ] **EPSG:3978 — North pole visible** — Zoom out fully in LCC. Verify the north pole icon is visible (not the arrow).
- [ ] **EPSG:3978 — Arrow on zoom in** — Zoom in on LCC until the north pole is outside the viewport. Verify the north arrow appears pointing toward the pole.
- [ ] **EPSG:3978 — Pole returns on zoom out** — Zoom back out. Verify the north pole icon reappears (arrow disappears).
- [ ] **EPSG:3857 — No north pole** — In Web Mercator, verify the north pole is never shown (WM cannot display the pole).
- [ ] **EPSG:3857 — Arrow always up** — In WM without rotation, the north arrow should point up (or be hidden if north is always up).
- [ ] **EPSG:3573 — No north pole or arrow** — In North Pole LAEA, verify neither the north pole icon nor the arrow is displayed (the pole is the center of the projection).

## Map Rotation

- [ ] **LCC rotation** — Rotate the map in LCC. Verify the north arrow updates direction correctly.
- [ ] **WM rotation** — Rotate the map in WM. Verify the north arrow updates direction correctly.
- [ ] **Rotation reset** — Rotate the map, then reset rotation to 0°. Verify the map returns to its default orientation.
- [ ] **Fix North (LCC only)** — In LCC, rotate the map, then click "Fix North". Verify the map adjusts rotation so that north is up in the current view (this is not necessarily 0° — it depends on the map center and projection).

## Map Interaction

- [ ] **Pan** — Click and drag the map. Verify smooth panning.
- [ ] **Zoom with scroll** — Scroll wheel zoom in/out. Verify smooth zoom transitions.
- [ ] **Zoom with buttons** — Use the zoom +/- buttons in the navbar.
- [ ] **Pinch zoom** — (Touch devices) Pinch to zoom. Verify correct behavior.
- [ ] **Double-click zoom** — Double-click to zoom in. Verify center is at the click point.

## Static Map

- [ ] **No interaction** — Load a static map config (`interaction: 'static'`). Verify no panning or zooming is possible.
