# [FEATURE] Introduce Application class to separate public API shell from MapViewer domain

## User Story

As a GeoView developer/consumer, I would like a dedicated Application class that serves as the public API entry point so that the MapViewer can become a focused geo/map domain class, the public surface is explicit and discoverable, and controllers are not leaked to external consumers.

## Description

Currently `MapViewer` serves a dual role:

1. **Domain class** — owns the OpenLayers map, manages projections, view state, basemaps, and emits map-level events (`onMapMoveEnd`, `onMapZoomEnd`, `onMapRotation`, etc.)
2. **Application shell** — holds UI APIs (`appBarApi`, `footerBarApi`, `navBarApi`, `stateApi`), `notifications`, `plugins`, the `ControllerRegistry`, and orchestrates language/theme changes, layer loading, config creation, and feature queries.

This conflation is already acknowledged in the codebase (`map-viewer.ts` lines 191–196, `TO.DOCONT` comments) and creates several problems:

- **Leaky abstraction**: External code accesses internals via `cgpv.api.getMapViewer('map1').controllers.mapController.onGeolocatorSearch(...)` instead of a clean public API.
- **Backwards dependency**: The domain class (`MapViewer`) imports and calls controllers (~29 `this.controllers.*` call sites), which inverts the intended `Controller → Domain` data flow.
- **Discoverability**: Consumers must know the internal controller/API structure to find the right method. There is no single public surface that documents "what can I do with a map instance?"
- **Test-suite coupling**: The test suite needs controller access, but currently the only path is through the public `MapViewer.controllers` property, which also exposes controllers to all external consumers.

### Proposed Architecture

```
cgpv.api.getApplication('map1')          → Application (public shell)
cgpv.api.getApplication('map1').map      → MapViewer   (geo domain, OL map)

// Replaces: cgpv.api.getMapViewer('map1')  (deprecated, kept as alias)
```

**Application class** — the new public entry point:

```typescript
class Application {
  // Domain accessors
  getMapViewer(): MapViewer;

  // Public sub-APIs (moved from MapViewer)
  notifications: Notifications;
  appBar: AppBarApi;
  footerBar: FooterBarApi;
  navBar: NavBarApi;
  plugins: PluginsContainer;
  layer: LayerApi;
  geometry: GeometryApi;
  stateApi: StateApi;

  // Application-level operations (moved from MapViewer)
  setLanguage(lang): Promise<void>;
  setTheme(theme): void;
  setProjection(code): Promise<void>;
  setDisplayDateTimezone(tz): void;
  createMapConfigFromMapState(): TypeMapFeaturesInstance;

  // Public event convenience methods (delegate to controllers)
  onGeolocatorSearch(cb): GeolocatorSearchDelegate;
  // ... other public events

  // Test-only accessor (clearly separated)
  /** @internal — for test suite use only */
  getControllersRegistry(): ControllerRegistry;
}
```

**MapViewer** — slimmed to a geo/map domain class:

```typescript
class MapViewer {
  // OpenLayers map, view, projection
  map: OLMap;
  basemap: BasemapApi;
  featureHighlight: FeatureHighlight;

  // Pure map events (these stay on MapViewer)
  onMapMoveEnd(cb): MapMoveEndDelegate;
  onMapZoomEnd(cb): MapZoomEndDelegate;
  onMapRotation(cb): MapRotationDelegate;
  onMapProjectionChanged(cb): MapProjectionChangedDelegate;
  onMapSingleClick(cb): MapSingleClickDelegate;
  onMapPointerMove(cb): MapPointerMoveDelegate;
  onMapChangeSize(cb): MapChangeSizeDelegate;

  // Low-level map operations
  setProjection(code): boolean;   // returns success, no orchestration
  getView(): View;
  getProjectionEPSG(): string;
}
```

### Target external API examples

```javascript
const app = cgpv.api.getApplication('map1');

// Notifications
app.notifications.addNotificationSuccess('Hello');

// Geolocator event
app.onGeolocatorSearch((sender, payload) => { ... });

// Layer operations
app.layer.addGeoviewLayer(config);
app.layer.setOrToggleLayerVisibility('esriFeatureLYR5/0');

// Map-specific events (through the map domain)
app.getMapViewer().onMapMoveEnd((sender, payload) => { ... });
app.getMapViewer().onMapZoomEnd((sender, payload) => { ... });

// Backward compat (deprecated alias)
cgpv.api.getMapViewer('map1'); // returns app.getMapViewer() with deprecation warning
```

## Implementation Approach

### Phase 1 — Create the Application class (non-breaking)

1. Create `Application` class in `src/core/application.ts`
2. Move `ControllerRegistry` ownership from `MapViewer` to `Application`
3. `Application` holds references to `MapViewer`, `Notifications`, `AppBarApi`, `FooterBarApi`, `NavBarApi`, `StateApi`, `LayerApi`, `PluginsContainer`, `GeometryApi`
4. Add `cgpv.api.getApplication(mapId)` alongside existing `cgpv.api.getMapViewer(mapId)`
5. Add `@internal getControllersRegistry()` on `Application` for test-suite access
6. Existing `getMapViewer()` continues to work (no breaking change yet)

### Phase 2 — Migrate external references

1. Update all demo HTML files to use `getApplication()` instead of `getMapViewer()` for non-map operations
2. Update `cgpv.onMapInit` / `cgpv.onMapReady` callbacks to receive `Application` (or both)
3. Add convenience event methods on `Application` (e.g., `onGeolocatorSearch`) that delegate to controllers
4. Move orchestration methods (`setLanguage`, `setTheme`, `setDisplayDateTimezone`, `createMapConfigFromMapState`) from `MapViewer` to `Application`

### Phase 3 — Clean up MapViewer

1. Remove `controllers` property from `MapViewer` (break the backwards dependency)
2. Remove UI API references (`appBarApi`, `footerBarApi`, etc.) from `MapViewer`
3. Remove store imports (`getStore*`, `setStore*`) from `MapViewer` — controllers handle store access
4. Remove `this.controllers.*` call sites from `MapViewer` (~29 locations)
5. Deprecate `cgpv.api.getMapViewer()` (or make it return only the slim map domain object)

### Phase 4 — Test suite access

1. Test suite uses `Application.getControllersRegistry()` instead of `MapViewer.controllers`
2. Mark `getControllersRegistry()` with `@internal` JSDoc tag
3. Consider a separate `TestApplication` subclass or interface if stricter isolation is desired

### Controller accessibility considerations

Two options for test-suite controller access:

| Option | Approach | Trade-off |
|--------|----------|-----------|
| A | `@internal getControllersRegistry()` on `Application` | Simple, single access point, but technically public |
| B | Separate `TestAccessor` class only instantiated by test-suite plugin | Stronger isolation, but more scaffolding |

Recommendation: Start with Option A. If external consumers abuse it, move to Option B.

## Affected Files

**New files:**
- `packages/geoview-core/src/core/application.ts` — New Application class

**Major changes:**
- `packages/geoview-core/src/geo/map/map-viewer.ts` — Remove UI APIs, controllers, orchestration methods (~29 controller call sites, ~8 public API properties)
- `packages/geoview-core/src/api/api.ts` — Add `getApplication()` / `getApplicationAsync()`, update `#maps` registry
- `packages/geoview-core/src/api/cgpv.ts` — Update `onMapInit` / `onMapReady` callback types

**Test suite updates:**
- `packages/geoview-test-suite/src/tests/suites/abstract-gv-test-suite.ts` — Use `Application` instead of `MapViewer` for controller access
- `packages/geoview-test-suite/src/tests/testers/abstract-gv-tester.ts` — Update accessor methods

**Demo pages (Phase 2):**
- `packages/geoview-core/public/templates/demos/demo-function-event.html`
- `packages/geoview-core/public/templates/demos-navigator.html`
- `packages/geoview-core/public/templates/layers-navigator.html`
- All other demo HTML files using `cgpv.api.getMapViewer()`

**Documentation:**
- `docs/app/api/` — Update API access patterns
- `docs/programming/controller-architecture.md` — Document Application → Controller → Domain flow

## Additional Context

- The existing `TO.DOCONT` comments in `map-viewer.ts` (lines 191–196) already document this intent
- This refactor aligns with the controller architecture (`Controller → Domain` flow) by removing the backwards `Domain → Controller` calls from MapViewer
- The `onGeolocatorSearch` event exposure problem (current conversation) is a concrete symptom: the event lives on `MapController` but consumers expect it on the public surface. The Application class solves this cleanly
- Breaking changes should be deferred to a major version bump. Phase 1–2 are additive; Phase 3 is breaking
