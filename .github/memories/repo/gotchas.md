# Repo gotchas (short, stable facts; append new lessons here, not in copilot-instructions.md)

- `NORTH_POLE_POSITION_LONLAT` = `[lat, lon]` (not `[lon, lat]`); swap before projecting.
- `isValidUUID()` rejects `uuid:suffix` (duplicate GeoCore ids); strip suffix first.
- GeoPackage feature-info outfields come from `GeoPackageReader.#processFeatureInfoConfig()`, not `AbstractGeoViewVector`.
- Blank field names crash Material React Table; guard with `key.trim()` in data-table consumers.
- WMS may repeat `<Name>` across nesting levels; resolve by full path, never bare id.
- gh-pages preview uses the PROD webpack config; version suffix driven by `GEOVIEW_BUILD_IS_DEV`.
- Webpack config files: use `__dirname`, not `__filename` (no-undef).
- `public/builds/` holds stale bundles; never use as reference.
- `npm audit` / `npm audit fix` are unreliable in Rush/pnpm; use the pnpm lockfile.
- Swiper: clip per-layer in OL `prerender/postrender`, never CSS `clip-path` on shared renderer containers.
- Never refit an extent across a viewport aspect-ratio change (e.g. fullscreen exit); restore center/resolution. OL resolves view constraints on every `change:size` before user listeners (#3674).
