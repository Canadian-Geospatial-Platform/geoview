# 18 — Global Settings

Global settings that affect all layers and panels.

Config: `configs/navigator/demos/19-global-settings.json`

## Coord Info Toggle

- [ ] **Coord info default true** — Verify coordinate info is shown by default when `default: true`.
- [ ] **Coord info toggle off** — Toggle coord info off. Verify coordinates stop appearing.
- [ ] **Coord info toggle on** — Toggle back on. Verify coordinates reappear.
- [ ] **Coord info default false** — Load a config with coord info default false. Verify it is hidden initially.

## Unsymbolized Features

- [ ] **Unsymbolized toggle** — Enable "show unsymbolized features". Verify features without explicit symbols appear on the map.
- [ ] **Compare feature count** — Compare the total feature count in the data table (with unsymbolized enabled) vs. the count with only symbolized features. Verify the unsymbolized total is higher (or equal if all features are symbolized).

## Sublayer Removal

- [ ] **Can remove sublayer** — Verify sublayers can be removed from the layer panel when allowed by global settings.
- [ ] **Cannot remove sublayer** — Set global setting to prevent sublayer removal. Verify the remove option is disabled or hidden.

## Highlight Layer

- [ ] **Highlight with no bbox** — Test highlighting a layer that has no bounding box. Verify the highlight works (no crash, visual feedback on the layer entry).

## Non-Supported Format

- [ ] **Add non-supported UUID** — Add a geocore UUID that resolves to a non-supported layer format (e.g., `aa698863-f689-4dd6-be12-1a9fa513f04b`). Verify:
  - The viewer does not crash
  - An appropriate error message is displayed
  - Other layers continue to work

## Disabled Layer Types

- [ ] **Disabled types setting** — If global settings disable certain layer types, verify those types cannot be added via Add Layer UI.

## Theme

Theme is set via config property `"theme"`: `"geo.ca"` (default), `"light"`, or `"dark"`.

- [ ] **geo.ca theme** — Load default config. Verify the branded geo.ca theme renders (standard GeoView colors).
- [ ] **Dark theme** — Load a config with `"theme": "dark"`. Verify dark backgrounds, light text, and correct icon colors.
- [ ] **Light theme** — Load a config with `"theme": "light"`. Verify light backgrounds, dark text.
- [ ] **Theme with open panels** — Open footer/app bar panels with dark theme. Verify panels use correct dark theme colors (no white flashes).

## Highlight Color

Config property: `map.highlightColor` — options: `black` (default), `white`, `red`, `green`, `aqua`.

- [ ] **Default highlight** — Click a feature. Verify highlight uses the default color (black).
- [ ] **Custom highlight color** — Load a config with `"highlightColor": "red"`. Click a feature. Verify the highlight uses the configured color.

## Service URLs Override

Config property: `serviceUrls` — overrides default service endpoints.

- [ ] **Custom geolocator URL** — Set a custom `geolocatorUrl`. Verify the geolocator search uses the custom endpoint.
- [ ] **Custom geocore URL** — Set a custom `geocoreUrl`. Verify GeoCore layer loading uses the custom endpoint.
- [ ] **Custom proxy URL** — Set a custom `proxyUrl`. Verify CORS-proxied requests use the custom proxy.
