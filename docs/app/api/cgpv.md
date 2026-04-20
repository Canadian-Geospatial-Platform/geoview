# CGPV Global Object

> **Full API Reference:** [TypeCGPV — TypeDoc](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/types/TypeCGPV.html)
>
> TypeDoc is auto-generated from source code and always reflects the current types and signatures.

The `cgpv` object is assigned to `window.cgpv` when the GeoView script (`cgpv-main.js`) loads. It is the entry point for interacting with GeoView maps and their lifecycle.

> **Important:** The `cgpv` object is frozen with `Object.freeze()` after creation. Its properties cannot be modified.

---

## Properties

| Property         | Type                                                    | Description                                          |
| ---------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| `init`           | `() => void`                                            | Initializes all maps found in the DOM                |
| `onMapInit`      | `(callback: MapViewerDelegate) => void`                 | Registers a callback for the map init event          |
| `onMapReady`     | `(callback: MapViewerDelegate) => void`                 | Registers a callback for the map ready event         |
| `api`            | `API`                                                   | Main API class — manage map viewers, layers, plugins |
| `reactUtilities` | `{ react, createRoot, createElement }`                  | Shared React library (ensures single React instance) |
| `translate`      | `typeof translate`                                      | Shared react-i18next translation module              |
| `ui`             | `{ useTheme, useMediaQuery, useWhatChanged, elements }` | Shared MUI hooks and UI component library            |
| `logger`         | `typeof logger`                                         | Logging system (logTrace, logDebug, logInfo, etc.)   |

```typescript
type MapViewerDelegate = (mapViewer: MapViewer) => void;
```

---

## Typical Usage

```html
<div
  id="map1"
  class="geoview-map"
  data-lang="en"
  data-config='{"map": {"viewSettings": {"zoom": 4, "center": [-95, 55], "projection": 3978}}}'
></div>

<script src="cgpv-main.js"></script>
<script>
  // Register handlers BEFORE init
  cgpv.onMapInit((mapViewer) => {
    console.log("Map init:", mapViewer.mapId);
  });

  cgpv.onMapReady((mapViewer) => {
    console.log("Map ready:", mapViewer.mapId);
  });

  // Initialize all maps
  cgpv.init();

  // Later: access a map via the API
  const mapViewer = cgpv.api.getMapViewer("map1");
</script>
```

### `cgpv.init()`

Scans the DOM for all elements with the `geoview-map` class and renders a map in each one. Each element must have a `data-config` attribute with the map configuration (JSON string) and optionally `data-lang` for the language.

> **Note:** Always register `onMapInit` and `onMapReady` callbacks **before** calling `init()`.

### `cgpv.onMapInit(callback)`

Fires when a map is initialized (but before layers are processed).

### `cgpv.onMapReady(callback)`

Fires when the map and UI are fully loaded and ready for interaction.

---

## Shared Libraries

### `cgpv.reactUtilities`

Plugins should use this instead of importing their own React to avoid multiple React instances:

```typescript
const { react, createRoot, createElement } = cgpv.reactUtilities;
```

### `cgpv.ui`

Shared MUI hooks and GeoView UI components:

```typescript
const { useTheme, useMediaQuery, elements } = cgpv.ui;
```

### `cgpv.translate`

The react-i18next translation module for i18n in plugins.

### `cgpv.logger`

GeoView logging system. Use instead of `console.log`:

```typescript
cgpv.logger.logInfo("My plugin loaded");
```

---

## See Also

- **[TypeCGPV — TypeDoc](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/types/TypeCGPV.html)** — Complete type reference
- [api.md](api.md) — API class methods (`createMapFromConfig`, `reload`, etc.)
- [map-viewer-api.md](map-viewer-api.md) — MapViewer instance methods
- [layer-api.md](layer-api.md) — Layer management API
- [controllers.md](app/events/controllers.md) — Controllers API documentation
