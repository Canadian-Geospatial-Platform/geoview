# 23 — Config Loading Methods

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-23-config-loading-methods.html](https://canadian-geospatial-platform.github.io/geoview/public/rt-23-config-loading-methods.html) — Links to default-config, demo-flood, demo-custom-footer-height demo pages.

Testing all supported methods for loading map configurations, including div attributes, URL parameters, function calls, and share mechanics.

## Default Config Loading (All Methods)

Demo: `templates/demos/default-config.html`

| Test                         | Description                           | Steps                                                                | Expected Result                                                                              | Auto |
| ---------------------------- | ------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---- |
| Empty div (no config) — map1 | Default settings load                 | 1. Check `map1` (no `data-config` or `data-config-url`)              | Viewer initializes with default settings (transport basemap, LCC projection, default extent) | M    |
| Malformed JSON — map2        | Error but no crash                    | 1. Check `map2` (invalid coordinate 'x', invalid projection 1111)    | Error is logged/notified; no crash                                                           | M    |
| Invalid properties — map3    | Validation errors reported            | 1. Check `map3` (zoom out of range, bad basemapId, invalid property) | Validation errors reported; map renders with defaults                                        | M    |
| Invalid layer entries — map4 | Bad layers reported, good layers load | 1. Check `map4` (ESRI Dynamic with invalid entry)                    | Invalid layers reported as errors; valid layers still load                                   | M    |

## Config from URL Parameters

Demo: `templates/demos/default-config.html` — `map5A`

| Test                    | Description                 | Steps                                                                                            | Expected Result                                                                | Auto |
| ----------------------- | --------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ---- |
| URL params load — map5A | Shared params applied       | 1. Check `map5A` which uses `data-shared` attribute with URL params (`p`, `z`, `c`, `b`, `keys`) | Projection, zoom, center, basemap, and geocore layers override the base config | M    |
| GeoCORE keys — map5B    | Keys attribute loads layers | 1. Check `map5B` which uses `data-geocore-keys`                                                  | Geocore layers load from the specified keys                                    | M    |

## Config from Div Parameters

| Test                           | Description                    | Steps                                                                                                                    | Expected Result                                      | Auto |
| ------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | ---- |
| data-lang="fr" + inline config | French language from attribute | 1. Load `templates/demos-specific/demo-flood.html`<br>2. Check `map2` (uses `data-lang="fr"` with inline `data-config`)  | Map loads in French with all layers from inline JSON | M    |
| data-config inline (English)   | Inline JSON config             | 1. On same page, check `map1` (uses `data-lang="en"` with inline `data-config`)                                          | Map initializes with inline config in English        | M    |
| data-config-url — map6         | External file config           | 1. Load `templates/demos/default-config.html`<br>2. Check `map6` which uses `data-config-url="./configs/my-config.json"` | Config loaded from the external file (static map)    | M    |

## Config from Function Call

Demo: `templates/demos/default-config.html` — `map7`

| Test                           | Description               | Steps                                                           | Expected Result                                                  | Auto |
| ------------------------------ | ------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- | ---- |
| createMapFromConfigFast — map7 | Programmatic map creation | 1. Wait ~10 seconds after page load<br>2. Verify `map7` appears | Map creates dynamically via `cgpv.api.createMapFromConfigFast()` | M    |

## Custom Footer Height

Demo: `templates/demos/demo-custom-footer-height.html`

| Test                       | Description               | Steps                                         | Expected Result                                  | Auto |
| -------------------------- | ------------------------- | --------------------------------------------- | ------------------------------------------------ | ---- |
| data-footer-height="400px" | Fixed footer height       | 1. Load map with `data-footer-height="400px"` | Footer bar panel area is exactly 400px tall      | M    |
| data-footer-height="100vh" | Full viewport footer      | 1. Load map with `data-footer-height="100vh"` | Footer bar panel expands to full viewport height | M    |
| Default height             | No attribute uses default | 1. Load a map without `data-footer-height`    | Footer bar uses the default height               | M    |

## Share Function & URL Parameters

Demo: `templates/demos-specific/demo-share.html`

> Basic share button visibility, dialog, and URL restore tested in [01 — Global](01-global.md#share-url).

| Test               | Description                 | Steps                                                                           | Expected Result                                                                             | Auto |
| ------------------ | --------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---- |
| Config merging     | Share URL reflects state    | 1. Change map state (zoom, projection)<br>2. Click Share                        | URL parameters reflect current map state merged with the base config                        | M    |
| URL param priority | Params override base config | 1. Load a page with both `data-config-url` and URL params (e.g., `?p=3857&z=6`) | URL params selectively override (projection/zoom change); other properties remain from file | M    |

## App Geo v2 (createMapFromConfigFast)

Demo: `templates/demos-specific/demo-app-geo-v2.html`

| Test                   | Description                | Steps                                  | Expected Result                                                   | Auto |
| ---------------------- | -------------------------- | -------------------------------------- | ----------------------------------------------------------------- | ---- |
| URL param UUID loading | UUID from URL creates map  | 1. Load with `?id=<geocore-uuid>`      | Map creates and loads the specified UUID layer                    | M    |
| Reload/remount         | Clean destroy and recreate | 1. Click "Reload (remount)" button     | Map destroys and recreates cleanly without errors or memory leaks | M    |
| Different UUIDs        | Each UUID loads correctly  | 1. Try multiple UUID links on the page | Each loads the correct layer configuration                        | M    |

## UI Components Demo

Demo: `templates/demos/ui-components.html`

| Test                   | Description               | Steps                                                   | Expected Result                                              | Auto |
| ---------------------- | ------------------------- | ------------------------------------------------------- | ------------------------------------------------------------ | ---- |
| Components render      | All components render     | 1. Load the page                                        | All showcased UI components render without errors            | M    |
| Interactive components | Interactions work         | 1. Click buttons, toggle switches, interact with inputs | They respond correctly                                       | M    |
| Theme consistency      | Correct theme tokens used | 1. Visually inspect components                          | Components use correct theme tokens (colors, spacing, fonts) | M    |
