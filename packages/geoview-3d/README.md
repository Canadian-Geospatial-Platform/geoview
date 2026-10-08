# geoview-3d

A deck.gl-based 3D Tiles viewer plugin for GeoView (spike).

## What is it about

The **geoview-3d** package adds a **3D** button to the app bar. Opening its panel shows a
deck.gl view of an [OGC 3D Tiles 1.1](https://www.ogc.org/standard/3dtiles/) tileset over the
map; closing the panel returns to the 2D map and releases the 3D (WebGL) resources.

- The first time a tileset is shown, the camera frames it. After that, the 3D view follows the 2D
  map: each time the panel opens or the map stops moving, the 3D camera moves to the same centre
  and an equivalent zoom (one-way; pitch and bearing you set in 3D are kept).
- In the 3D view: drag to pan, right-drag (or Ctrl/Shift-drag) to rotate and tilt, wheel to zoom.
  With the keyboard (focus the 3D view first): arrow keys pan, Shift + arrow keys rotate and tilt,
  `=` and `-` zoom.

The package id used in map configs is **`tiles-3d`** (the npm package and folder are named
`geoview-3d`).

### Footprint in geoview-core

The plugin lives in `packages/geoview-3d`. Loading it as a core package needs these small
geoview-core changes:

- `webpack.common.js`: one bundle entry, `geoview-tiles-3d` → `corePackages/geoview-tiles-3d.js`.
- `schema.json` and `src/api/types/map-schema-types.ts`: `tiles-3d` added to the list of allowed
  app-bar ids (one line each).

Monorepo-level changes (outside geoview-core): `rush.json` registers the package;
`common/config/rush/.pnpmfile.cjs` keeps a single loaders.gl version; `packages/package.json` runs
ESLint with an 8 GB heap because type-aware linting of all packages exceeds Node's 4 GB default.

## How to configure

Add `tiles-3d` to the app bar of the map config:

```json
{
  "appBar": {
    "tabs": {
      "core": ["legend", "tiles-3d"]
    }
  }
}
```

The plugin options come, in order of precedence, from:

1. an inline `corePackagesConfig` entry: `"corePackagesConfig": [{ "tiles-3d": { ... } }]`;
2. a side file next to the map config, when the page uses `data-config-url`: for
   `configs/my-map.json` the plugin reads `configs/my-map-tiles-3d.json`;
3. the default config below.

### Options

- **isOpen** (`boolean`): open the 3D panel on load. Default `false`.
- **tilesetUrl** (`string`): URL of the 3D Tiles 1.1 `tileset.json` to render (absolute, or relative
  to the page). `REPLACE_ME` is a placeholder meaning "no tileset yet". The server must allow CORS
  for the viewer's origin unless the tileset is served from the same origin.
- **version** (`string`): schema version. `"1.0"`.

### Default config

```json
{
  "isOpen": false,
  "tilesetUrl": "REPLACE_ME",
  "version": "1.0"
}
```

## How to test this fork

These steps take a fresh machine to the 3D view in a browser. They assume Git and Node.js 20.11 or
newer (the build has been run with Node 24).

### 1. Clone and select the branch

```bash
git clone https://github.com/ymoisan/geoview.git
cd geoview
git checkout geoview-3d
```

> On Windows, clone inside WSL's Linux file system (for example `~/github/geoview`), not under
> `/mnt/c` or `/mnt/d`: package linking fails on those drives with `EACCES` rename errors.

### 2. Install dependencies

```bash
npm install -g @microsoft/rush   # once per machine
rush update
```

Without a global install, the repository's bootstrap script works too:
`node common/scripts/install-run-rush.js update`.

### 3. Build

```bash
rush build --to geoview-3d
```

This builds geoview-core (which bundles the plugin as `corePackages/geoview-tiles-3d.js`) and
type-checks geoview-3d. It takes a few minutes.

### 4. Point the demo at a tileset

Edit `packages/geoview-core/public/configs/demo-3d-config-tiles-3d.json` and replace `REPLACE_ME`
with the URL of a 3D Tiles 1.1 `tileset.json`:

- **Simplest (no CORS):** copy a tileset folder (for example a tyler output with `tileset.json`
  and its `.glb` files) under `packages/geoview-core/public/datasets/3dtiles/<name>/`, then use
  `"tilesetUrl": "./datasets/3dtiles/<name>/tileset.json"`.
- **Remote:** use the full `https://…/tileset.json` URL; the server must send
  `Access-Control-Allow-Origin` for `http://localhost:8080`.

### 5. Serve and open the demo

```bash
rush serve
```

Open <http://localhost:8080/geoview-3d.html>, then click the **3D** button in the app bar.

### What to check

- [ ] The panel opens and the 3D view covers the map; the status reads "3D tileset loaded."
- [ ] On the first opening, the camera frames the tileset and the model is visible.
- [ ] Close the panel, pan/zoom the 2D map, reopen: the 3D view shows the same area at a comparable
      zoom (it is no longer re-framed on the tileset).
- [ ] Mouse and keyboard navigation work in the 3D view; a focus outline appears when it is
      tabbed to.
- [ ] Closing the panel shows the 2D map again.
- [ ] With `REPLACE_ME`, the panel reports that no valid tileset URL is configured and no 3D view
      is shown.
- [ ] With a broken URL (for example a typo), the panel reports the loading error.

Edits to the side config file take effect on a page reload; no rebuild is needed.

## For reviewers

### Source layout

| File                         | Role                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| `src/index.tsx`              | `AppBarPlugin` entry: button, panel, translations (en/fr), registration as `tiles-3d`         |
| `src/geoview-3d-panel.tsx`   | Panel: shows the overlay over the map only while the panel is open; status live region        |
| `src/geoview-3d-overlay.tsx` | Overlay: owns the canvas and the renderer lifecycle; syncs the 2D view on map move-end        |
| `src/tileset-renderer.ts`    | Framework-free deck.gl renderer: tileset loading, aborts and request generations, camera      |
| `src/safe-tile-3d-layer.ts`  | `Tile3DLayer` subclass that routes deck.gl's unawaited root-load failure to the error handler |
| `src/viewport-sync.ts`       | Pure conversion of the 2D map centre and ground resolution to a deck.gl viewport              |
| `src/stubs/`                 | Documented, unwired stubs for planned features (below)                                        |

### Design decisions worth reviewing

- **Overlay, not panel content:** the app bar keeps closed panels mounted (`display: none`), so
  the WebGL canvas is mounted over the map only while the panel is open, freeing the GPU context
  on close.
- **No CDN workers:** loaders.gl downloads its parser workers from unpkg.com by default; they are
  disabled (`core.worker: false`) and parsing runs on the main thread. This is fine for the
  uncompressed glTF that tyler emits; Draco/meshopt-compressed tilesets would need self-hosted
  workers.
- **One-way, best-effort sync:** the 2D map drives the 3D camera (centre and zoom); the 3D view
  never moves the 2D map. Zoom is matched through ground resolution because OpenLayers zoom levels
  depend on the map projection (EPSG:3978 by default).
- **Bundle cost:** `corePackages/geoview-tiles-3d.js` is about 1.24 MB (301 KB brotli), downloaded
  only by maps that list `tiles-3d`.

### Not yet implemented

- **COPC point clouds** (`src/stubs/copc-source.ts`): waits for COPC streaming in loaders.gl v5
  (still alpha). Tracked in geoview issue #2497.
- **STAC discovery of tilesets** (`src/stubs/stac-discovery.ts`): the asset-selection rule exists;
  wiring it to the existing `geoview-stac-browser` search is to do.
- **Two-way sync and a draped 2D basemap** in the 3D view are out of scope for this spike.
