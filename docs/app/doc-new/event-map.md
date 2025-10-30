# Map Viewer Events Documentation

Below is an alphabetical list of all map viewer events available in GeoView. These events can be used to respond to various map interactions and state changes.

## Best Practices

- Register events after initialization: Always register your event handlers inside the onMapInit or onMapReady callbacks.
- Error handling: Include error handling in your event callbacks to prevent uncaught exceptions.
- Performance: Be mindful of performance when handling events that fire frequently (like onMapMoveEnd or onMapZoomEnd).
- Event cleanup: If your application dynamically creates and destroys maps, make sure to remove event listeners when they're no longer needed.

## How to Use Map Viewer Events

```typescript
// After initializing the map with cgpv.init()
cgpv.onMapInit((mapViewer) => {
  // Register event handlers on the map viewer instance
  mapViewer.onEventName((sender, payload) => {
    // Handle the event
  });
});
```

## Event Quick Links

- [onBasemapChanged](#onbasemapchanged)
- [onCrosshairMoved](#oncrosshairmoved)
- [onFeatureHighlight](#onfeaturehighlight)
- [onFeatureSelect](#onfeatureselect)
- [onFeatureUnhighlight](#onfeatureunhighlight)
- [onFeatureUnselect](#onfeatureunselect)F
- [onKeyboardNavigationActivated](#onkeyboardnavigationactivated)
- [onMapClick](#onmapclick)
- [onMapLanguageChanged](#onmaplanguagechanged)
- [onMapMoveEnd](#onmapmoveend)
- [onMapMoveStart](#onmapmovestart)
- [onMapProjectionChanged](#onmapprojectionchanged)
- [onMapResize](#onmapresize)
- [onMapRotationChanged](#onmaprotationchanged)
- [onMapThemeChanged](#onmapthemechanged)
- [onMapZoomEnd](#onmapzoomend)
- [onMapZoomStart](#onmapzoomstart)
- [onOverviewMapToggle](#onoverviewmaptoggle)
- [onPanelContentChanged](#onpanelcontentchanged)
- [onPanelVisibilityChanged](#onpanelvisibilitychanged)
- [onScaleChanged](#onscalechanged)

<a id="onbasemapchanged"></a>

#### onBasemapChanged

```typescript
/**
 * Triggered when the map's basemap is changed.
 *
 * @param {Object} sender - The object that triggered the event (typically the map viewer)
 * @param {Object} payload - The event payload
 * @param {Object} payload.basemap - The new basemap object
 * @param {string} payload.basemap.id - The ID of the new basemap
 * @param {string} payload.basemap.name - The name of the new basemap
 * @param {string} payload.basemap.type - The type of the new basemap
 */
mapViewer.onBasemapChanged((sender, payload) => {
  console.log(`Basemap changed to: ${payload.basemap.id}`);
});
```

<a id="oncrosshairmoved"></a>

#### onCrosshairMoved

```typescript
/**
 * Triggered when the map's crosshair is moved (keyboard navigation).
 *
 * @param {Object} sender - The object that triggered the event
 * @param {Object} payload - The event payload
 * @param {Array<number>} payload.position - The new position [x, y] in pixels
 * @param {Array<number>} payload.lonlat - The new position [longitude, latitude] in map coordinates
 */
mapViewer.onCrosshairMoved((sender, payload) => {
  console.log(`Crosshair moved to: ${payload.position}`);
});
```

<a id="onfeaturehighlight"></a>

#### onFeatureHighlight

```typescript
/**
 * Triggered when a feature is highlighted on the map.
 *
 * @param {Object} sender - The object that triggered the event
 * @param {Object} payload - The event payload
 * @param {string} payload.featureId - The ID of the highlighted feature
 * @param {string} payload.layerId - The ID of the layer containing the feature
 * @param {Object} payload.feature - The highlighted feature object
 */
mapViewer.onFeatureHighlight((sender, payload) => {
  console.log(`Feature highlighted: ${payload.featureId}`);
});
```

<a id="onfeatureselect"></a>

#### onFeatureSelect

```typescript
/**
 * Triggered when a feature is selected on the map.
 *
 * @param {Object} sender - The object that triggered the event
 * @param {Object} payload - The event payload
 * @param {string} payload.featureId - The ID of the selected feature
 * @param {string} payload.layerId - The ID of the layer containing the feature
 * @param {Object} payload.feature - The selected feature object
 * @param {boolean} payload.multiSelect - Whether multiple features are selected
 */
mapViewer.onFeatureSelect((sender, payload) => {
  console.log(`Feature selected: ${payload.featureId}`);
});
```

<a id="onfeatureunhighlight"></a>

#### onFeatureUnhighlight

```typescript
/**
 * Triggered when a feature is no longer highlighted.
 *
 * @param {Object} sender - The object that triggered the event
 * @param {Object} payload - The event payload
 * @param {string} payload.featureId - The ID of the unhighlighted feature
 * @param {string} payload.layerId - The ID of the layer containing the feature
 */
mapViewer.onFeatureUnhighlight((sender, payload) => {
  console.log(`Feature unhighlighted: ${payload.featureId}`);
});
```

<a id="onfeatureunselect"></a>

#### onFeatureUnselect

```typescript
/**
 * Triggered when a feature is unselected.
 *
 * @param {Object} sender - The object that triggered the event
 * @param {Object} payload - The event payload
 * @param {string} payload.featureId - The ID of the unselected feature
 * @param {string} payload.layerId - The ID of the layer containing the feature
 */
mapViewer.onFeatureUnselect((sender, payload) => {
  console.log(`Feature unselected: ${payload.featureId}`);
});
```

<a id="onkeyboardnavigationactivated"></a>

#### onKeyboardNavigationActivated

```typescript
/**
 * Triggered when keyboard navigation is activated or deactivated.
 *
 * @param {Object} sender - The object that triggered the event
 * @param {Object} payload - The event payload
 * @param {boolean} payload.active - Whether keyboard navigation is active
 */
mapViewer.onKeyboardNavigationActivated((sender, payload) => {
  console.log(`Keyboard navigation activated: ${payload.active}`);
});
```

<a id="onmapclick"></a>

#### onMapClick

```typescript
/**
 * Triggered when the map is clicked.
 *
 * @param {Object} sender - The object that triggered the event
 * @param {Object} payload - The event payload
 * @param {Array<number>} payload.lonlat - The clicked position [longitude, latitude]
 * @param {Array<number>} payload.pixel - The clicked position [x, y] in pixels
 * @param {Object} payload.event - The original click event
 */
mapViewer.onMapClick((sender, payload) => {
  console.log(`Map clicked at: ${payload.lonlat}`);
});
```

<a id="onmaplanguagechanged"></a>

#### onMapLanguageChanged

```typescript
/**
 * Triggered when the map's display language is changed.
 *
 * @param {Object} sender - The object that triggered the event
 * @param {Object} payload - The event payload
 * @param {string} payload.language - The new language code (e.g., 'en', 'fr')
 * @param {string} payload.previousLanguage - The previous language code
 */
mapViewer.onMapLanguageChanged((sender, payload) => {
  console.log(`Map language changed to: ${payload.language}`);
});
```

<a id="onmapmoveend"></a>

#### onMapMoveEnd

```typescript
/**
 * Triggered when the map stops moving (pan/drag).
 *
 * @param {Object} sender - The object that triggered the event
 * @param {Object} payload - The event payload
 * @param {Array<number>} payload.lonlat - The new center position [longitude, latitude]
 * @param {Object} payload.extent - The new map extent {minx, miny, maxx, maxy}
 */
mapViewer.onMapMoveEnd((sender, payload) => {
  console.log(`Map moved to center: ${payload.lonlat}`);
});
```

<a id="onmapmovestart"></a>

#### onMapMoveStart

```typescript
/**
 * Triggered when the map starts moving.
 *
 * @param {Object} sender - The object that triggered the event
 * @param {Object} payload - The event payload
 * @param {Array<number>} payload.lonlat - The starting center position [longitude, latitude]
 * @param {Object} payload.extent - The starting map extent {minx, miny, maxx, maxy}
 */
mapViewer.onMapMoveStart((sender, payload) => {
  console.log(`Map started moving from: ${payload.lonlat}`);
});
```

<a id="onmapprojectionchanged"></a>

#### onMapProjectionChanged

```typescript
/**
 * Triggered when the map's projection is changed.
 *
 * @param {Object} sender - The object that triggered the event
 * @param {Object} payload - The event payload
 * @param {string} payload.projection - The new projection code (e.g., 'EPSG:3857', 'EPSG:3978')
 * @param {string} payload.previousProjection - The previous projection code
 */
mapViewer.onMapProjectionChanged((sender, payload) => {
  console.log(`Map projection changed to: ${payload.projection}`);
});
```

<a id="onmapresize"></a>

#### onMapResize

```typescript
/**
 * Triggered when the map is resized.
 *
 * @param {Object} sender - The object that triggered the event
 * @param {Object} payload - The event payload
 * @param {Array<number>} payload.size - The new size [width, height] in pixels
 * @param {Array<number>} payload.previousSize - The previous size [width, height] in pixels
 */
mapViewer.onMapResize((sender, payload) => {
  console.log(`Map resized to: ${payload.size}`);
});
```

<a id="onmaprotationchanged"></a>

#### onMapRotationChanged

```typescript
/**
 * Triggered when the map's rotation is changed.
 *
 * @param {Object} sender - The object that triggered the event
 * @param {Object} payload - The event payload
 * @param {number} payload.rotation - The new rotation angle in degrees
 * @param {number} payload.previousRotation - The previous rotation angle in degrees
 */
mapViewer.onMapRotationChanged((sender, payload) => {
  console.log(`Map rotation changed to: ${payload.rotation} degrees`);
});
```

<a id="onmapthemechanged"></a>

#### onMapThemeChanged

```typescript
/**
 * Triggered when the map's display theme is changed.
 *
 * @param {Object} sender - The object that triggered the event
 * @param {Object} payload - The event payload
 * @param {string} payload.theme - The new theme ('light' or 'dark')
 * @param {string} payload.previousTheme - The previous theme
 */
mapViewer.onMapThemeChanged((sender, payload) => {
  console.log(`Map theme changed to: ${payload.theme}`);
});
```

<a id="onmapzoomend"></a>

#### onMapZoomEnd

```typescript
/**
 * Triggered when a zoom operation ends.
 *
 * @param {Object} sender - The object that triggered the event
 * @param {Object} payload - The event payload
 * @param {number} payload.zoom - The new zoom level
 * @param {number} payload.previousZoom - The previous zoom level
 * @param {Array<number>} payload.lonlat - The center position [longitude, latitude] after zooming
 */
mapViewer.onMapZoomEnd((sender, payload) => {
  console.log(`Map zoomed to level: ${payload.zoom}`);
});
```

<a id="onmapzoomstart"></a>

#### onMapZoomStart

```typescript
/**
 * Triggered when a zoom operation starts.
 *
 * @param {Object} sender - The object that triggered the event
 * @param {Object} payload - The event payload
 * @param {number} payload.zoom - The starting zoom level
 * @param {Array<number>} payload.lonlat - The center position [longitude, latitude] before zooming
 */
mapViewer.onMapZoomStart((sender, payload) => {
  console.log(`Map zoom started from level: ${payload.zoom}`);
});
```

<a id="onoverviewmaptoggle"></a>

#### onOverviewMapToggle

```typescript
/**
 * Triggered when the overview map is toggled.
 *
 * @param {Object} sender - The object that triggered the event
 * @param {Object} payload - The event payload
 * @param {boolean} payload.visible - Whether the overview map is visible
 */
mapViewer.onOverviewMapToggle((sender, payload) => {
  console.log(`Overview map toggled: ${payload.visible}`);
});
```

<a id="onpanelcontentchanged"></a>

#### onPanelContentChanged

```typescript
/**
 * Triggered when the content of a panel changes.
 *
 * @param {Object} sender - The object that triggered the event
 * @param {Object} payload - The event payload
 * @param {string} payload.panelId - The ID of the panel that changed
 * @param {string} payload.content - The new content type or ID
 */
mapViewer.onPanelContentChanged((sender, payload) => {
  console.log(`Panel ${payload.panelId} content changed`);
});
```

<a id="onpanelvisibilitychanged"></a>

#### onPanelVisibilityChanged

```typescript
/**
 * Triggered when a panel's visibility changes.
 *
 * @param {Object} sender - The object that triggered the event
 * @param {Object} payload - The event payload
 * @param {string} payload.panelId - The ID of the panel
 * @param {boolean} payload.visible - Whether the panel is visible
 */
mapViewer.onPanelVisibilityChanged((sender, payload) => {
  console.log(
    `Panel ${payload.panelId} visibility changed to: ${payload.visible}`
  );
});
```

<a id="onscalechanged"></a>

#### onScaleChanged

```typescript
/**
 * Triggered when the map's scale changes.
 *
 * @param {Object} sender - The object that triggered the event
 * @param {Object} payload - The event payload
 * @param {number} payload.scale - The new scale denominator (e.g., 50000 for 1:50,000)
 * @param {number} payload.previousScale - The previous scale denominator
 */
mapViewer.onScaleChanged((sender, payload) => {
  console.log(`Map scale changed to: ${payload.scale}`);
});
```
