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

  mapViewer.onMapClick((sender, event) => {
    console.log("Clicked at:", event.lonlat);
  });
});

cgpv.init();
```

## Available Events

### View Events

| Event                  | Fires When               |
| ---------------------- | ------------------------ |
| `onMapMoveStart`       | Map begins panning       |
| `onMapMoveEnd`         | Map finishes panning     |
| `onMapZoomStart`       | Zoom operation begins    |
| `onMapZoomEnd`         | Zoom operation ends      |
| `onMapRotationChanged` | Map rotation changes     |
| `onMapResize`          | Map container is resized |
| `onScaleChanged`       | Map scale changes        |
| `onMapClick`           | Map is clicked           |

### State Events

| Event                    | Fires When                           |
| ------------------------ | ------------------------------------ |
| `onMapProjectionChanged` | Projection is changed                |
| `onMapLanguageChanged`   | Display language is changed          |
| `onMapThemeChanged`      | Theme is changed (light/dark/geo.ca) |
| `onBasemapChanged`       | Basemap is changed                   |

### Interaction Events

| Event                           | Fires When                            |
| ------------------------------- | ------------------------------------- |
| `onFeatureHighlight`            | Feature is highlighted                |
| `onFeatureUnhighlight`          | Feature highlight is removed          |
| `onFeatureSelect`               | Feature is selected                   |
| `onFeatureUnselect`             | Feature is unselected                 |
| `onCrosshairMoved`              | Crosshair moves (keyboard navigation) |
| `onKeyboardNavigationActivated` | Keyboard navigation toggled           |

### UI Events

| Event                      | Fires When               |
| -------------------------- | ------------------------ |
| `onOverviewMapToggle`      | Overview map toggled     |
| `onPanelContentChanged`    | Panel content changes    |
| `onPanelVisibilityChanged` | Panel visibility changes |

## Best Practices

- **Register events inside `cgpv.onMapInit()`** — the mapViewer is guaranteed ready
- **Performance**: Events like `onMapMoveEnd` and `onMapZoomEnd` fire frequently — keep handlers lightweight
- **Cleanup**: Use `offEventName()` to remove handlers when no longer needed (automatic on map destroy)

## See Also

- **[Layer Events](./layer-events.md)** — Layer lifecycle and property change events
- **[Event System Overview](./event-system.md)** — How the delegate event pattern works
- **[Creating Events](./event-creation.md)** — How to add new events
