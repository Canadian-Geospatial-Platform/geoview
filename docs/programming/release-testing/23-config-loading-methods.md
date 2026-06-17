# 24 — Config Loading Methods

Testing all supported methods for loading map configurations, including div attributes, URL parameters, function calls, and share mechanics.

## Default Config Loading (All Methods)

Demo: `templates/demos/default-config.html`

### 1. No Config Object

- [ ] **Empty div** — A `<div>` with no `data-config` or `data-config-url`. Verify the viewer initializes with default settings (transport basemap, LCC projection, default extent).

### 2. Invalid JSON Object

- [ ] **Malformed JSON** — A div with `data-config` containing syntactically invalid JSON. Verify an error is logged/notified but no crash occurs.

### 3. Bad Config Values

- [ ] **Invalid properties** — A div with `data-config` containing valid JSON but invalid config values (e.g., projection: 9999). Verify validation errors are reported, map still renders with defaults.

### 4. Bad Layer Config Values

- [ ] **Invalid layer entries** — Layers with bad values in `listOfGeoviewLayerConfig`. Verify invalid layers are reported as errors, valid layers still load.

### 5A. Config from URL Parameters

- [ ] **URL params load** — Load with URL params: `?p=3857&z=4&c=-100,40&l=en&t=dark&b=id:transport,s:off,l:on&i=dynamic&keys=<uuid>,<uuid>`. Verify:
  - Projection is 3857 (Web Mercator)
  - Zoom level is 4
  - Center is approximately -100, 40
  - Language is English
  - Theme is dark
  - Basemap is transport with shading off and labels on
  - Interaction is dynamic
  - Geocore layers load from the provided UUIDs

### 5B. Config from Div Parameters

- [ ] **data-lang attribute** — Verify `data-lang="fr"` loads the map in French.
- [ ] **data-config inline** — Verify `data-config="{...}"` (inline JSON) initializes the map correctly.
- [ ] **data-config-url** — Verify `data-config-url="./configs/my-config.json"` loads config from the external file.

### 6. Config from File

- [ ] **External JSON file** — Load config using `data-config-url` pointing to a JSON file. Verify all config properties (layers, basemap, projection) are applied.

### 7. Config from Function Call

- [ ] **createMapFromConfigFast** — Verify a map can be created programmatically via `cgpv.api.createMapFromConfigFast(mapId, configJson)` without any data attributes on the div.

## Custom Footer Height

Demo: `templates/demos/demo-custom-footer-height.html`

- [ ] **data-footer-height="400px"** — Load the map with `data-footer-height="400px"`. Verify the footer bar panel area is exactly 400px tall.
- [ ] **data-footer-height="100vh"** — Load the map with `data-footer-height="100vh"`. Verify the footer bar panel expands to full viewport height.
- [ ] **Default height** — Load a map without `data-footer-height`. Verify the footer bar uses the default height.

## Share Function & URL Parameters

Demo: `templates/demos-specific/demo-share.html`

> Basic share button visibility, dialog, and URL restore tested in [01 — Global](01-global.md#share-url).

- [ ] **Config merging** — Click Share. Verify the URL parameters reflect current map state (projection, zoom, center, layers) merged with the base config.
- [ ] **URL param priority** — Load a page with both `data-config-url` and URL params (e.g., `?p=3857&z=6`). Verify URL params selectively override the base config (projection and zoom change, other properties remain from the file).

## App Geo v2 (createMapFromConfigFast)

Demo: `templates/demos-specific/demo-app-geo-v2.html`

- [ ] **URL param UUID loading** — Load with `?id=<geocore-uuid>`. Verify the map creates and loads the specified UUID layer.
- [ ] **Reload/remount** — Click "Reload (remount)" button. Verify the map destroys and recreates cleanly without errors or memory leaks.
- [ ] **Different UUIDs** — Try multiple UUID links listed on the page. Verify each loads the correct layer configuration.

## UI Components Demo

Demo: `templates/demos/ui-components.html`

- [ ] **Components render** — Load the page. Verify all showcased UI components render without errors.
- [ ] **Interactive components** — Click buttons, toggle switches, interact with inputs. Verify they respond correctly.
- [ ] **Theme consistency** — Verify components use the correct theme tokens (colors, spacing, fonts).
