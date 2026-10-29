# Map Events

> **Full API Reference:** [MapViewer — TypeDoc](https://canadian-geospatial-platform.github.io/geoview/public/docs/typedoc/classes/MapViewer.html)
>
> TypeDoc is auto-generated from source code and always reflects the current event signatures, payload types, and delegate definitions.

Map events are available on the `mapViewer` instance. Register them inside `cgpv.onMapInit()`.

## Usage

```typescript
cgpv.onMapInit((mapViewer) => {
  // View events
  mapViewer.onMapMoveEnd((sender, event) => {
    console.log("Map moved to:", event.lonlat);
  });

  mapViewer.onMapZoomEnd((sender, event) => {
    console.log("Zoom level:", event.zoom);
  });

  mapViewer.onMapSingleClick((sender, event) => {
    console.log("Clicked at:", event.lonlat);
  });
});

cgpv.init();
```

## Available Events

### Lifecycle Events

| Event                  | Fires When                                            |
| ---------------------- | ----------------------------------------------------- |
| `onMapInit`            | Map instance is created (layers may still be loading) |
| `onMapReady`           | Map and UI are fully loaded                           |
| `onMapLayersProcessed` | All initial layers have been processed                |
| `onMapLayersLoaded`    | All initial layers have been loaded or errored        |

### View Events

| Event              | Fires When                             |
| ------------------ | -------------------------------------- |
| `onMapMoveEnd`     | Map finishes panning                   |
| `onMapZoomEnd`     | Zoom operation ends                    |
| `onMapRotation`    | Map rotation changes                   |
| `onMapChangeSize`  | Map container is resized               |
| `onMapSingleClick` | Map is clicked                         |
| `onMapPointerMove` | Mouse pointer moves over map           |
| `onMapPointerStop` | Mouse pointer stops moving (debounced) |

### State Events

| Event                    | Fires When                  |
| ------------------------ | --------------------------- |
| `onMapProjectionChanged` | Projection is changed       |
| `onMapLanguageChanged`   | Display language is changed |

### Component Events

| Event                   | Fires When               |
| ----------------------- | ------------------------ |
| `onMapComponentAdded`   | Map component is added   |
| `onMapComponentRemoved` | Map component is removed |

### Sub-Object Events

Some events live on sub-objects of `mapViewer`, not on `mapViewer` directly:

```typescript
// Basemap events — on mapViewer.basemap
mapViewer.basemap.onBasemapChanged((sender, event) => {
  console.log("Basemap changed:", event.basemap);
});

mapViewer.basemap.onBasemapError((sender, event) => {
  console.log("Basemap error:", event);
});
```

| Object              | Event              | Fires When            |
| ------------------- | ------------------ | --------------------- |
| `mapViewer.basemap` | `onBasemapChanged` | Basemap is changed    |
| `mapViewer.basemap` | `onBasemapError`   | Basemap fails to load |

> **Note:** Layer events (`onLayerCreated`, `onLayerStatusChanged`, etc.) are on `mapViewer.layer` — see [Layer Events](./layer-events.md).

## Best Practices

- **Register events inside `cgpv.onMapInit()`** — the mapViewer is guaranteed ready
- **Performance**: Events like `onMapMoveEnd` and `onMapZoomEnd` fire frequently — keep handlers lightweight
- **Cleanup**: Use `offEventName()` to remove handlers when no longer needed (automatic on map destroy)
- **Pointer events**: `onMapPointerMove()`, `onMapPointerStop()`, and `onMapSingleClick()` return the callback for easy deregistration

## See Also

- **[Layer Events](./layer-events.md)** — Layer lifecycle and property change events
- **[Event System Overview](./event-system.md)** — How the delegate event pattern works
- **[Creating Events](./event-creation.md)** — How to add new events
