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
- The ground is a basemap draped over terrain, so buildings and trees stand on it. The panel's
  **Basemap** selector switches between the Canada Base Map (default), Esri World Imagery and none.
  Terrain comes from NRCan's 1 m lidar elevation model (HRDEM) where it exists; elsewhere the
  ground is flat at 0 m. **Show 3D tileset** hides the tileset to look at the ground under it.
- A terrain line in the panel reports elevation tiles as they load (grey while loading, green when
  loaded, red when the elevation service fails); icon and wording carry the state, colour only
  reinforces it, and screen readers are only told about failures.
- Tileset colours come from the tiles themselves (glTF vertex colours, `COLOR_0`).

The package id used in map configs is **`tiles-3d`** (the npm package and folder are named
`geoview-3d`).

## Important: floating (or sunken) objects and blank ground

The 3D view draws the ground at the height given by NRCan's HRDEM lidar elevation model, and each
tileset at its own heights. Buildings only sit on the ground when both describe heights the same
way:

- **The Halifax demo tileset is inside HRDEM coverage** and uses the same heights as HRDEM: across
  2,597 buildings, the lowest vertex minus the HRDEM ground has a median of -0.16 m. Buildings
  sit on the ground.
- **Outside HRDEM coverage, objects float.** HRDEM only covers lidar survey areas. Elsewhere the
  ground is flat at 0 m while the tileset is still drawn at its true height above sea level: a
  town at 150 m floats 150 m above the basemap. Before testing your own tileset, check that its
  area is covered: this search lists the lidar projects covering a bounding box (in degrees: west,
  south, east, north) and returns none outside coverage:
  <https://datacube.services.geo.ca/stac/api/search?collections=hrdem-lidar&bbox=-63.64,44.648,-63.62,44.66>
- **The elevation service drops at times; objects then float.** During testing (November 2026)
  NRCan's HRDEM service answered every request with HTTP 502 for a while, Halifax included. When
  an HRDEM request fails, the plugin uses an altitude of 0 m for that piece of ground (so the
  basemap stays visible instead of leaving a hole), and objects there float at their full height
  above sea level. The panel's terrain line then turns red ("Terrain: N tiles failed, so the ground
  is flat (0 m) there and objects may float"), screen readers announce it once, and the browser
  console shows one warning. Close and reopen the panel later to retry.
  This is the main reason to replace the WCS with **PMTiles** in a next iteration: a WCS
  resamples the elevation model on a live server for every tile (about 0.7 s each here), so the
  terrain depends on that server being up and responsive. PMTiles is a single static file of
  pre-computed tiles, read with plain HTTP range requests from object storage or a CDN, the same
  way the demo tileset is served: no server-side computation, cacheable, faster, and able to go
  deeper (about zoom 17 for 1 m HRDEM, against 15 here). It could also merge HRDEM with the
  Canada-wide MRDEM-30 so the ground is never flat for lack of lidar. The cost is a build step
  (converting the DEMs to tiles) and hosting the file.
- **Ellipsoidal heights sink.** The terrain is orthometric (CGVD2013, metres above sea level).
  3D Tiles nominally uses heights above the WGS84 ellipsoid; a tileset that really uses them is
  drawn lower by the geoid offset, about 20 m below the ground around Halifax (the offset varies
  across Canada). Such tilesets need a geoid correction, which is not implemented.
- **Zoomed out (below zoom 12), the ground is flat on purpose**, because relief barely shows at
  that scale; objects float by their elevation until you zoom in.
- **Blank ground outside Canada close up.** The Canada Base Map only has close-up (street-scale)
  tiles over Canada: zoomed in outside Canada, for example just across the US border, its ground
  is blank and the browser console lists "404" errors for the missing tiles. Switch the basemap to
  Esri World Imagery there.

## Why deck.gl (and not CesiumJS)

To be upfront: an earlier attempt to bring 3D into GeoView used CesiumJS,
[PR #2860](https://github.com/Canadian-Geospatial-Platform/geoview/pull/2860) "Primary Cesium
Addition to Geoview". It has been open since April 2025 and was last updated on 16 June 2025, with
changes requested and merge conflicts. It adds 3,361 files (+1.53 million lines), almost all of
them a vendored copy of CesiumJS under `packages/geoview-core/cesium/`. This spike deliberately
takes another route, and its author leans towards deck.gl. The reasons and the trade-offs are
below so that reviewers can judge for themselves.

Why deck.gl here:

- **A plugin, not a core change.** The 3D view lives in `packages/geoview-3d`, and geoview-core
  only gains a bundle entry and an app-bar id (see Footprint below), so it can evolve without
  waiting for core priorities. (This choice is independent of the engine: CesiumJS could also be
  wrapped in a plugin.)
- **Ordinary npm dependencies, no vendored engine.** deck.gl, loaders.gl and luma.gl are MIT
  licensed vis.gl projects under the OpenJS Foundation. The plugin bundle is 1.48 MB (319 KB
  brotli) and is downloaded only by maps that list `tiles-3d`. CesiumJS also needs its static
  assets (workers, assets, widgets) served from a base URL.
- **The data stack GeoView needs next.** loaders.gl reads 3D Tiles, glTF, point clouds (LAS/LAZ;
  COPC streaming is planned for loaders.gl v5, see geoview #2497), vector tiles, PMTiles and
  GeoTIFF.
- **A web-map model.** deck.gl's default view is a Web Mercator map, like the web maps GeoView
  already shows, which keeps the 2D-to-3D sync small (`viewport-sync.ts`).
- **Built for data visualization.** Its GPU layers (aggregations, paths, point clouds, meshes)
  suit the digital-twin use cases this viewer is aimed at.
- **No vendor service by default.** CesiumJS's default imagery (and Cesium World Terrain) come from
  Cesium ion, which needs an access token, unless configured otherwise; here every source is
  explicit (NRCan, Esri).

What CesiumJS does better, honestly:

- **3D Tiles was created by Cesium** (it is now an OGC standard) and Cesium's renderer is the
  reference. deck.gl needed three workarounds here: refining through empty tiles, a vertex-colour
  shader patch and a custom terrain fetch (see Design decisions).
- **A real globe.** CesiumJS works on the WGS84 ellipsoid with ellipsoidal heights and streaming
  terrain built in. deck.gl's map view is flat Web Mercator (its globe view is experimental), and
  terrain had to be assembled here from HRDEM with an experimental extension, hence the height
  caveats above.
- **Maturity of 3D interaction** (camera, picking, measurement). Picking is turned off in this
  spike.

If globe-scale work or ellipsoidal precision becomes the priority, CesiumJS remains a valid
option; the plugin boundary (the `tiles-3d` panel and the framework-free `TilesetRenderer`) keeps
the rendering engine replaceable.

### Requirements

- **A browser with WebGL2.** deck.gl 9 renders only through WebGL2 (or WebGPU). The rest of GeoView
  does not need it: OpenLayers draws most layers with the 2D canvas, and GeoTIFF layers use WebGL1.
  Without WebGL2 the plugin does not create the 3D view; the panel says so and asks the user to
  enable hardware acceleration. Check a browser at <https://get.webgl.org/webgl2/>.
- WebGL2 is typically unavailable when hardware acceleration is turned off, the graphics driver is
  blocklisted by the browser, an enterprise policy disables it, or the session runs over Remote
  Desktop or in a VM without a GPU.
- Tilesets must be served from the same origin as the viewer or with CORS enabled.
- Network access to the services drawn under the tileset (all send CORS headers):
  - Canada Base Map: `maps-cartes.services.geo.ca` (NRCan);
  - Esri World Imagery: `services.arcgisonline.com`;
  - terrain: `datacube.services.geo.ca` (NRCan HRDEM Web Coverage Service).
- Tileset heights must be orthometric (CGVD2013, above sea level), like HRDEM, and the tileset
  must lie inside HRDEM coverage; see "Important: floating (or sunken) objects and blank ground"
  above.

### Footprint in geoview-core

The plugin lives in `packages/geoview-3d`. Loading it as a core package needs these small
geoview-core changes:

- `webpack.common.js`: one bundle entry, `geoview-tiles-3d` → `corePackages/geoview-tiles-3d.js`.
- `schema.json` and `src/api/types/map-schema-types.ts`: `tiles-3d` added to the list of allowed
  app-bar ids (one line each).

Monorepo-level changes (outside geoview-core): `rush.json` registers the package, and
`common/config/rush/.pnpmfile.cjs` keeps a single loaders.gl version.

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

These steps take a fresh machine to the 3D view in a browser. They assume Git and Node.js 24.22.1
or newer within 24.x (required by `rush.json`; tested with 24.22.2).

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

### 4. The demo tileset (already configured)

`packages/geoview-core/public/configs/demo-3d-config-tiles-3d.json` points to a sample tileset of
Halifax (about 1 x 1 km, 91 MB, inside HRDEM coverage), hosted with CORS on GitHub Pages:
<https://ymoisan.github.io/geoview-3d-testdata/halifax/tileset.json> (repository:
[ymoisan/geoview-3d-testdata](https://github.com/ymoisan/geoview-3d-testdata)). Nothing to do for
a first test.

To test another 3D Tiles 1.1 tileset, replace that URL (and read "Important: floating (or sunken)
objects and blank ground" first):

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
- [ ] On the first opening, the camera frames the tileset and the model is visible, in the
      tileset's own colours.
- [ ] The ground shows the Canada Base Map; zoomed in and tilted, building bases meet the ground
      (inside HRDEM coverage).
- [ ] Zoomed in (zoom 12 or more), the terrain line under the status counts elevation tiles as they
      load ("Terrain: loading 6 tiles… (8 loaded)", grey) and settles on "Terrain: N tiles
      loaded" with a green check; on elevation failures it turns red with an error icon.
- [ ] **Show 3D tileset** hides and shows the tileset immediately (no tiles are downloaded again);
      with it off, the draped basemap and the terrain relief are visible on their own.
- [ ] The **Basemap** selector switches to Esri World Imagery (sharp close up, where the Canada Base
      Map is blurry) and to none; the attribution under it follows. The choice survives closing and
      reopening the panel.
- [ ] Close the panel, pan/zoom the 2D map, reopen: the 3D view shows the same area at a comparable
      zoom (it is no longer re-framed on the tileset).
- [ ] Mouse and keyboard navigation work in the 3D view; a focus outline appears when it is
      tabbed to.
- [ ] Closing the panel shows the 2D map again.
- [ ] With `"tilesetUrl": "REPLACE_ME"`, the panel reports that no valid tileset URL is configured
      and no 3D view is shown.
- [ ] With a broken URL (for example a typo), the panel reports the loading error.
- [ ] The browser console shows no errors from the plugin (the demo page's own missing
      `js/page-header.js` is unrelated).

Edits to the side config file take effect on a page reload; no rebuild is needed.

## For reviewers

### Source layout

| File                                   | Role                                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/index.tsx`                        | `AppBarPlugin` entry: button, panel, translations (en/fr), registration as `tiles-3d`         |
| `src/geoview-3d-panel.tsx`             | Panel: shows the overlay over the map only while the panel is open; status, basemap selector  |
| `src/geoview-3d-overlay.tsx`           | Overlay: owns the canvas and the renderer lifecycle; syncs the 2D view on map move-end        |
| `src/tileset-renderer.ts`              | Framework-free deck.gl renderer: layers, tileset loading, aborts and request generations      |
| `src/safe-tile-3d-layer.ts`            | `Tile3DLayer` subclass that routes deck.gl's unawaited root-load failure to the error handler |
| `src/tileset-traversal.ts`             | Makes loaders.gl refine through empty upper tiles down to the tiles holding geometry          |
| `src/vertex-color-scenegraph-layer.ts` | `ScenegraphLayer` whose shader multiplies glTF `COLOR_0` vertex colours into the base colour  |
| `src/basemap-layer.ts`                 | Basemap choices (Canada Base Map, Esri World Imagery, none), draped on the terrain            |
| `src/terrain-layer.ts`                 | Terrain from the HRDEM Web Coverage Service: GeoTIFF tiles decoded into ground meshes         |
| `src/viewport-sync.ts`                 | Pure conversion of the 2D map centre and ground resolution to a deck.gl viewport              |
| `src/stubs/`                           | Documented, unwired stubs for planned features (below)                                        |

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
- **Keyboard isolation:** OpenLayers takes its keyboard input from the map container, which also
  contains the 3D canvas, so arrow and zoom keys pressed in the 3D view would pan or zoom the 2D
  map too (and the sync would then move the 3D camera). A native listener on the canvas stops
  those keys there; deck.gl listens on the canvas itself and still gets them, and Escape and Tab
  still reach GeoView's focus trap.
- **Refining through empty tiles:** loaders.gl stops descending a tileset once a tile's
  screen-space error is small enough, even when that tile has no content. Tilesets whose upper
  levels are empty with small geometric errors (as tyler writes them) then draw nothing;
  `tileset-traversal.ts` always descends into tiles that have children but nothing to draw.
- **Vertex colours:** deck.gl 9.4's scenegraph shader ignores glTF `COLOR_0`, so tilesets coloured
  per vertex over a white material render grey. `vertex-color-scenegraph-layer.ts` multiplies
  `COLOR_0` into the colour as the glTF spec requires; glTFs without `COLOR_0` render unchanged.
- **Terrain and draping:** a `TerrainLayer` draws the ground mesh and the basemap is painted onto it
  with deck.gl's `TerrainExtension`, so the basemap keeps its own (deeper) zoom levels. The 3D Tiles
  keep their own absolute heights. Tested on Halifax: across 2,597 buildings, the lowest vertex
  minus the HRDEM ground has a median of -0.16 m.
- **Custom terrain fetch:** `TerrainLayer` normally decodes elevation images in a CDN-hosted worker.
  Its `fetch` prop is replaced: each tile is a WCS `GetCoverage` for float32 GeoTIFF (decoded with
  `geotiff`, already a geoview-core dependency), sampled bilinearly by its own georeferencing
  because MapServer's pixel count for a WCS 1.1 request varies by one. Below zoom 12, tiles are flat
  and built locally, without any request.
- **Experimental deck.gl APIs:** `_TerrainExtension` (only exported under that name in 9.4) and
  `Deck._pickable: false`, which turns hover picking off: with draped terrain it logged "Picked
  non-existent layer" errors, and nothing in the 3D view is picked yet. Both may change in a later
  deck.gl release.
- **Bundle cost:** `corePackages/geoview-tiles-3d.js` is about 1.48 MB (319 KB brotli; 1.24 MB
  before the basemap and terrain), downloaded only by maps that list `tiles-3d`.

### Known limitations

- **Basemaps blur close up (a GeoView-wide caveat).** GeoView's Canada Base Map cache stops at zoom
  15 (scale about 1:18,000); deeper tiles return 404 even though the service advertises levels to
  23, so the imagery is stretched and blurry at street and building scale. This matters most in 3D,
  where users zoom in closely. Esri World Imagery serves real tiles to zoom 19.
- **Terrain through WCS is a stopgap.** Every terrain tile is a WCS request, resampled by the server
  (about 0.7 s median, 1.2 s at worst, for a 129 x 129 grid). Terrain is therefore requested only
  from zoom 12 to 15 (`TERRAIN_MAX_ZOOM`) and stretched beyond; it loads visibly while moving.
  Pre-tiled elevation (PMTiles) is planned and could go to the data's native level, about zoom 17
  (rationale under "Important: floating (or sunken) objects and blank ground").
- **Terrain coverage.** HRDEM covers lidar survey areas only; elsewhere the ground is flat at 0 m
  and objects float (see "Important: floating (or sunken) objects and blank ground"). The
  medium-resolution model (MRDEM-30) and CDEM cover all of Canada as cloud-optimized GeoTIFFs in
  EPSG:3979, but would need reprojection in the browser; the WCS endpoints tried for them did not
  respond.
- **The Canada Base Map stops at the border close up.** At street-scale zoom levels it only has
  tiles over Canada; elsewhere (for example northern New York at zoom 12) the server answers 404,
  the ground is left blank and the browser console shows its own "Failed to load resource: 404"
  lines, which a page cannot silence. The plugin logs one warning per basemap. Switch to Esri World
  Imagery outside Canada.
- **The no-WebGL2 message** was tested by making the browser refuse WebGL2 contexts: the panel
  shows the message, no 3D view or tile request is made, and nothing is thrown. It has not yet been
  seen on a machine that really lacks WebGL2.

### Not yet implemented

- **COPC point clouds** (`src/stubs/copc-source.ts`): waits for COPC streaming in loaders.gl v5
  (still alpha). Tracked in geoview issue #2497.
- **STAC discovery of tilesets** (`src/stubs/stac-discovery.ts`): the asset-selection rule exists;
  wiring it to the existing `geoview-stac-browser` search is to do.
- **PMTiles** for elevation (removing the WCS limits above) and for a vector basemap that stays
  sharp at any zoom.
- **Two-way sync** (the 3D camera moving the 2D map) is out of scope for this spike.
