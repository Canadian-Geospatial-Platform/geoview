# 18 — Global Settings

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-18-global-settings.html](../../packages/geoview-core/public/templates/release-testing/rt-18-global-settings.html) — Map 1 (geo.ca theme + global settings), Map 2 (dark theme), Map 3 (light theme), Map 4 (red highlight color).

Global settings that affect all layers and panels.

Config: `configs/navigator/demos/19-global-settings.json`

## Coord Info Toggle

| Test                     | Description                      | Steps                                           | Expected Result                     | Auto |
| ------------------------ | -------------------------------- | ----------------------------------------------- | ----------------------------------- | ---- |
| Coord info default true  | Coordinate info shown by default | 1. Load config with coord info `default: true`  | Coordinate info is shown by default | C    |
| Coord info toggle off    | Coordinates stop appearing       | 1. Toggle coord info off                        | Coordinates stop appearing          | M    |
| Coord info toggle on     | Coordinates reappear             | 1. Toggle coord info back on                    | Coordinates reappear                | M    |
| Coord info default false | Coordinate info hidden initially | 1. Load config with coord info `default: false` | Coordinate info is hidden initially | C    |

## Unsymbolized Features

| Test                  | Description                              | Steps                                                                             | Expected Result                                                    | Auto |
| --------------------- | ---------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---- |
| Unsymbolized toggle   | Features without explicit symbols appear | 1. Enable "show unsymbolized features"                                            | Features without explicit symbols appear on the map                | M    |
| Compare feature count | Unsymbolized total is higher or equal    | 1. Compare data table feature count with unsymbolized enabled vs. symbolized only | Unsymbolized total is higher (or equal if all features symbolized) | M    |

## Sublayer Removal

| Test                   | Description                           | Steps                                                   | Expected Result                     | Auto |
| ---------------------- | ------------------------------------- | ------------------------------------------------------- | ----------------------------------- | ---- |
| Can remove sublayer    | Sublayers removable when allowed      | 1. Verify sublayers can be removed from the layer panel | Sublayers can be removed            | C    |
| Cannot remove sublayer | Remove option disabled when prevented | 1. Set global setting to prevent sublayer removal       | Remove option is disabled or hidden | C    |

## Highlight Layer

| Test                   | Description                                   | Steps                                         | Expected Result                                            | Auto |
| ---------------------- | --------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------- | ---- |
| Highlight with no bbox | Highlight works on layer without bounding box | 1. Highlight a layer that has no bounding box | Highlight works (no crash, visual feedback on layer entry) | M    |

## Non-Supported Format

## Disabled Layer Types

| Test                   | Description                                     | Steps                                                                         | Expected Result                | Auto |
| ---------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------ | ---- |
| Disabled types setting | Disabled types cannot be added via Add Layer UI | 1. Set global settings to disable certain layer types<br>2. Open Add Layer UI | Disabled types cannot be added | C    |

## Theme

Theme is set via config property `"theme"`: `"geo.ca"` (default), `"light"`, or `"dark"`.

| Test         | Description                                 | Steps                                  | Expected Result                                        | Auto |
| ------------ | ------------------------------------------- | -------------------------------------- | ------------------------------------------------------ | ---- |
| geo.ca theme | Branded geo.ca theme renders                | 1. Load default config                 | Branded geo.ca theme renders (standard GeoView colors) | M    |
| Dark theme   | Dark backgrounds, light text, correct icons | 1. Load config with `"theme": "dark"`  | Dark backgrounds, light text, correct icon colors      | M    |
| Light theme  | Light backgrounds, dark text                | 1. Load config with `"theme": "light"` | Light backgrounds, dark text                           | M    |

## Highlight Color

Config property: `map.highlightColor` — options: `black` (default), `white`, `red`, `green`, `aqua`.

| Test                   | Description                     | Steps                                                               | Expected Result                          | Auto |
| ---------------------- | ------------------------------- | ------------------------------------------------------------------- | ---------------------------------------- | ---- |
| Default highlight      | Highlight uses default color    | 1. Click a feature                                                  | Highlight uses the default color (black) | M    |
| Custom highlight color | Highlight uses configured color | 1. Load config with `"highlightColor": "red"`<br>2. Click a feature | Highlight uses the configured color      | C    |

## Service URLs Override

Config property: `serviceUrls` — overrides default service endpoints.

| Test               | Description                            | Steps                                                                                                                         | Expected Result                                                            | Auto |
| ------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---- |
| Custom geolocator  | Geolocator uses custom endpoint        | 1. Set `geolocatorUrl` to the actual URL but remove the API key, keeping only `locate`<br>2. Perform a search                 | Geolocator returns fewer results than default (missing key limits results) | M    |
| Custom geocore URL | GeoCore loading uses custom endpoint   | 1. While on VPN, set `geocoreUrl` to `https://dev.geocore.api.geo.ca`<br>2. Add a GeoCore layer                               | GeoCore layer loading uses the dev endpoint                                | M    |
| Custom proxy URL   | CORS-proxied requests use custom proxy | 1. Set `proxyUrl` to `https://example.com/proxy`<br>2. Load a layer that requires CORS proxy (e.g., a WMS behind same-origin) | Layer fails to load, proving the override is being used                    | M    |
