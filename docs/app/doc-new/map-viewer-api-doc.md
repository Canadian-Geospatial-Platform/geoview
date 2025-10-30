# MapViewer API Documentation

Below is a categorized list of all functions available on a MapViewer instance obtained through `cgpv.api.getMapViewer('mapId')`.

## Best Practices
- Access after initialization: Always access MapViewer methods after the map has been initialized.
- Error handling: Include error handling when using methods that may throw exceptions.
- Performance: Be mindful of performance when calling methods that trigger redraws.
- Cleanup: If your application dynamically creates and destroys maps, make sure to call `cgpv.api.deleteMapViewer(mapId)` to clean up resources.

## How to Use MapViewer API

```typescript
// Get a map viewer by ID
const mapViewer = cgpv.api.getMapViewer('map1');

// Or get a map viewer asynchronously (waits until it's available)
const mapViewer = await cgpv.api.getMapViewerAsync('map1');

// Then call methods on the mapViewer instance
mapViewer.setView({
  center: [-75.6972, 45.4215],
  zoom: 10
});
```

## Function Categories Quick Links
- [Map State Functions](#map-state-functions)
- [Map Action Functions](#map-action-functions)
- [Map Interaction Functions](#map-interaction-functions)
- [Utility Functions](#utility-functions)
- [Event Handlers](#event-handlers)

## Map State Functions

Functions for getting and setting the state of the map.

#### Functions Quick Links
- [getDisplayLanguage](#getdisplaylanguage)
- [getDisplayTheme](#getdisplaytheme)
- [getMapState](#getmapstate)
- [getView](#getview)
- [setView](#setview)
- [getCenter](#getcenter)
- [setCenter](#setcenter)
- [getMapSize](#getmapsize)
- [getProjection](#getprojection)
- [setLanguage](#setlanguage)
- [setProjection](#setprojection)
- [setTheme](#settheme)
- [setZoomLevel](#setzoomlevel)
- [setExtent](#setextent)

<a id="getdisplaylanguage"></a>

#### getDisplayLanguage
```typescript
/**
 * Returns the current display language.
 * 
 * @returns {TypeDisplayLanguage} The display language ('en' or 'fr')
 */
mapViewer.getDisplayLanguage();
```

<a id="getdisplaytheme"></a>

#### getDisplayTheme
```typescript
/**
 * Returns the current display theme.
 * 
 * @returns {TypeDisplayTheme} The display theme ('light' or 'dark')
 */
mapViewer.getDisplayTheme();
```

<a id="getmapstate"></a>

#### getMapState
```typescript
/**
 * Returns the map current state information.
 * 
 * @returns {TypeMapState} The map state including projection, zoom, center coordinates
 */
mapViewer.getMapState();
```

<a id="getview"></a>

#### getView
```typescript
/**
 * Gets the map view settings.
 * 
 * @returns {View} The OpenLayers View object
 */
mapViewer.getView();
```

<a id="setview"></a>

#### setView
```typescript
/**
 * Sets the map view settings (coordinate values in lon/lat).
 * 
 * @param {TypeViewSettings} mapView - Map view settings object
 */
mapViewer.setView({
  projection: 3857,
  initialView: {
    zoomAndCenter: [10, [-75.6972, 45.4215]]
  },
  minZoom: 2,
  maxZoom: 19
});
```

<a id="getcenter"></a>

#### getCenter
```typescript
/**
 * Asynchronously gets the map center coordinate to give a chance for the map to
 * render before returning the value.
 * 
 * @returns {Promise<Coordinate>} Promise resolving to the map center
 */
mapViewer.getCenter().then(center => {
  console.log('Map center:', center);
});
```

<a id="setcenter"></a>

#### setCenter
```typescript
/**
 * Sets the map center.
 * 
 * @param {Coordinate} center - New center to use [longitude, latitude]
 */
mapViewer.setCenter([-75.6972, 45.4215]);
```

<a id="getmapsize"></a>

#### getMapSize
```typescript
/**
 * Asynchronously gets the map size to give a chance for the map to
 * render before returning the value.
 * 
 * @returns {Promise<Size>} Promise resolving to the map size [width, height]
 */
mapViewer.getMapSize().then(size => {
  console.log('Map size:', size);
});
```

<a id="getprojection"></a>

#### getProjection
```typescript
/**
 * Gets the map projection.
 * 
 * @returns {OLProjection} The OpenLayers Projection object
 */
mapViewer.getProjection();
```

<a id="setlanguage"></a>

#### setLanguage
```typescript
/**
 * Sets the display language of the map.
 * 
 * @param {TypeDisplayLanguage} displayLanguage - The language to use ('en', 'fr')
 * @param {boolean} [reloadLayers=false] - Optional flag to ask viewer to reload layers with the new localized language
 * @returns {Promise<void>}
 */
mapViewer.setLanguage('fr', true);
```

<a id="setprojection"></a>

#### setProjection
```typescript
/**
 * Sets the display projection of the map.
 * 
 * @param {TypeValidMapProjectionCodes} projectionCode - The projection code (3978, 3857)
 * @returns {Promise<void>}
 */
mapViewer.setProjection(3857);
```

<a id="settheme"></a>

#### setTheme
```typescript
/**
 * Sets the display theme of the map.
 * 
 * @param {TypeDisplayTheme} displayTheme - The theme to use ('light', 'dark')
 */
mapViewer.setTheme('dark');
```

<a id="setzoomlevel"></a>

#### setZoomLevel
```typescript
/**
 * Sets the map zoom level.
 * 
 * @param {number} zoom - New zoom level
 */
mapViewer.setZoomLevel(10);
```

<a id="setextent"></a>

#### setExtent
```typescript
/**
 * Sets map extent.
 * 
 * @param {Extent} extent - New extent to zoom to [minX, minY, maxX, maxY]
 * @returns {Promise<void>}
 */
mapViewer.setExtent([-76.1, 45.1, -75.2, 45.7]);
```

## Map Action Functions

Functions for performing actions on the map.

#### Functions Quick Links
- [addComponent](#addcomponent)
- [removeComponent](#removecomponent)
- [refreshLayers](#refreshlayers)
- [delete](#delete)
- [reload](#reload)
- [zoomToExtent](#zoomtoextent)
- [zoomToLonLatExtentOrCoordinate](#zoomtolonlatextentorcoordinate)
- [waitAllLayersStatus](#waitallLayersstatus)

<a id="addcomponent"></a>

#### addComponent
```typescript
/**
 * Adds a new custom component to the map.
 * 
 * @param {string} mapComponentId - An id for the new component
 * @param {JSX.Element} component - The component to add
 */
mapViewer.addComponent('custom-component-1', <CustomComponent />);
```

<a id="removecomponent"></a>

#### removeComponent
```typescript
/**
 * Removes an existing custom component from the map.
 * 
 * @param {string} mapComponentId - The id of the component to remove
 */
mapViewer.removeComponent('custom-component-1');
```

<a id="refreshlayers"></a>

#### refreshLayers
```typescript
/**
 * Loops through all geoview layers and refreshes their respective source.
 * Use this function on projection change or other viewer modification that may affect rendering.
 * 
 * @returns {Promise<void>} A Promise which resolves when the rendering is completed
 */
mapViewer.refreshLayers().then(() => {
  console.log('All layers refreshed');
});
```

<a id="delete"></a>

#### delete
```typescript
/**
 * Deletes the map and cleans up resources.
 */
mapViewer.delete(false).then(() => {
  console.log('Map deleted');
});
```

<a id="reload"></a>

#### reload
```typescript
/**
 * Reloads a map from a config object stored in store, or provided. 
 * It first removes then recreates the map.
 * 
 * @param {TypeMapFeaturesConfig | TypeMapFeaturesInstance} [mapConfig] - Optional map config to use for reload
 * @returns {Promise<void>}
 */
mapViewer.reload();
```

<a id="zoomtoextent"></a>

#### zoomToExtent
```typescript
/**
 * Zooms to the specified extent.
 * 
 * @param {Extent} extent - The extent to zoom to [minX, minY, maxX, maxY]
 * @param {FitOptions} [options] - The options to configure the zoomToExtent
 * @returns {Promise<void>}
 */
mapViewer.zoomToExtent([-76.1, 45.1, -75.2, 45.7], { 
  padding: [100, 100, 100, 100], 
  maxZoom: 11 
});
```

<a id="zoomtolonlatextentorcoordinate"></a>

#### zoomToLonLatExtentOrCoordinate
```typescript
/**
 * Zooms to specified extent or coordinate provided in lonlat.
 * 
 * @param {Extent | Coordinate} extent - The extent or coordinate to zoom to
 * @param {FitOptions} [options] - The options to configure the zoomToExtent
 * @returns {Promise<void>}
 */
mapViewer.zoomToLonLatExtentOrCoordinate([-75.6972, 45.4215], { 
  padding: [100, 100, 100, 100], 
  maxZoom: 11 
});
```

<a id="waitallLayersstatus"></a>

#### waitAllLayersStatus
```typescript
/**
 * Waits until all GeoView layers reach the specified status before resolving the promise.
 * 
 * @param {TypeLayerStatus} layerStatus - The desired status to wait for (e.g., 'loaded', 'processed')
 * @returns {Promise<number>} A promise that resolves with the number of layers that have reached the specified status
 */
mapViewer.waitAllLayersStatus('loaded').then(count => {
  console.log(`${count} layers have been loaded`);
});
```

## Map Interaction Functions

Functions for initializing map interactions.

#### Functions Quick Links
- [initSelectInteractions](#initselectinteractions)
- [initExtentInteractions](#initextentinteractions)
- [initDrawInteractions](#initdrawinteractions)
- [initModifyInteractions](#initmodifyinteractions)
- [initSnapInteractions](#initsnapinteractions)

<a id="initselectinteractions"></a>

#### initSelectInteractions
```typescript
/**
 * Initializes selection interactions.
 * 
 * @returns {Select} The created Select interaction
 */
const selectInteraction = mapViewer.initSelectInteractions();
```

<a id="initextentinteractions"></a>

#### initExtentInteractions
```typescript
/**
 * Initializes extent interactions.
 * 
 * @returns {ExtentInteraction} The created Extent interaction
 */
const extentInteraction = mapViewer.initExtentInteractions();
```

<a id="initdrawinteractions"></a>

#### initDrawInteractions
```typescript
/**
 * Initializes drawing interactions on the given vector source.
 * 
 * @param {string} geomGroupKey - The geometry group key in which to hold the geometries
 * @param {string} type - The type of geometry to draw (Polygon, LineString, Circle, etc)
 * @param {TypeFeatureStyle} style - The styles for the drawing
 * @returns {Draw} The created Draw interaction
 */
const drawInteraction = mapViewer.initDrawInteractions('my-geometries', 'Polygon', {
  strokeColor: 'blue',
  fillColor: 'rgba(0, 0, 255, 0.2)'
});
```

<a id="initmodifyinteractions"></a>

#### initModifyInteractions
```typescript
/**
 * Initializes modifying interactions on the given vector source.
 * 
 * @param {string} geomGroupKey - The geometry group key in which to hold the geometries
 * @param {TypeFeatureStyle} [style] - The styles for the modify interaction
 * @param {Condition} [insertVertexCondition] - Condition for inserting vertices
 * @param {number} [pixelTolerance] - Pixel tolerance for the modify interaction
 * @returns {Modify} The created Modify interaction
 */
const modifyInteraction = mapViewer.initModifyInteractions('my-geometries', {
  strokeColor: 'red',
  fillColor: 'rgba(255, 0, 0, 0.2)'
});
```

<a id="initsnapinteractions"></a>

#### initSnapInteractions
```typescript
/**
 * Initializes snapping interactions on the given vector source.
 * 
 * @param {string} geomGroupKey - The geometry group key in which to hold the geometries
 * @returns {Snap} The created Snap interaction
 */
const snapInteraction = mapViewer.initSnapInteractions('my-geometries');
```

## Utility Functions

Helper functions for coordinate transformations and other utilities.

#### Functions Quick Links
- [getNorthArrowAngle](#getnortharrowangle)
- [convertCoordinateLonLatToMapProj](#convertcoordinatelonlattomapproj)
- [convertCoordinateMapProjToLonLat](#convertcoordinatemapprojtoLonlat)
- [convertExtentLonLatToMapProj](#convertextentlonlattomapproj)
- [convertExtentMapProjToLonLat](#convertextentmapprojtoLonlat)
- [createMapConfigFromMapState](#createmapconfigfrommapstate)

<a id="getnortharrowangle"></a>

#### getNorthArrowAngle
```typescript
/**
 * Gets north arrow bearing. Angle used to rotate north arrow for non Web Mercator projection.
 * 
 * @returns {string} The arrow angle as a string
 */
const northAngle = mapViewer.getNorthArrowAngle();
```

<a id="convertcoordinatelonlattomapproj"></a>

#### convertCoordinateLonLatToMapProj
```typescript
/**
 * Transforms coordinate from LonLat to the current projection of the map.
 * 
 * @param {Coordinate} coordinate - The LonLat coordinate
 * @returns {Coordinate} The coordinate in the map projection
 */
const mapCoord = mapViewer.convertCoordinateLonLatToMapProj([-75.6972, 45.4215]);
```

<a id="convertcoordinatemapprojtoLonlat"></a>

#### convertCoordinateMapProjToLonLat
```typescript
/**
 * Transforms coordinate from current projection of the map to LonLat.
 * 
 * @param {Coordinate} coordinate - The coordinate in map projection
 * @returns {Coordinate} The coordinate in LonLat
 */
const lonLatCoord = mapViewer.convertCoordinateMapProjToLonLat([2673031.1037, 8438703.5471]);
```

<a id="convertextentlonlattomapproj"></a>

#### convertExtentLonLatToMapProj
```typescript
/**
 * Transforms extent from LonLat to the current projection of the map.
 * 
 * @param {Extent} extent - The LonLat extent
 * @param {number} [stops=25] - The number of stops to perform densification on the extent
 * @returns {Extent} The extent in the map projection
 */
const mapExtent = mapViewer.convertExtentLonLatToMapProj([-76.1, 45.1, -75.2, 45.7]);
```

<a id="convertextentmapprojtoLonlat"></a>

#### convertExtentMapProjToLonLat
```typescript
/**
 * Transforms extent from current projection of the map to LonLat.
 * 
 * @param {Extent} extent - The extent in map projection
 * @returns {Extent} The extent in LonLat
 */
const lonLatExtent = mapViewer.convertExtentMapProjToLonLat([2673031.1037, 8438703.5471, 2673031.1037, 8438703.5471]);
```

<a id="createmapconfigfrommapstate"></a>

#### createMapConfigFromMapState
```typescript
/**
 * Creates a map config based on current map state.
 * 
 * @param {boolean|'hybrid'} [overrideGeocoreServiceNames=true] - Indicates if geocore layer names should be kept as is or returned to defaults
 * @returns {TypeMapFeaturesInstance|undefined} Map config with current map state
 */
const mapConfig = mapViewer.createMapConfigFromMapState();
```

## Event Handlers

Functions for registering and unregistering event callbacks.

#### Functions Quick Links
- [onMapInit](#onmapinit)
- [onMapReady](#onmapready)
- [onMapMoveEnd](#onmapmoveend)
- [onMapSingleClick](#onmapsingleclick)
- [onMapZoomEnd](#onmapzoomend)
- [onMapLanguageChanged](#onmaplanguagechanged)

<a id="onmapinit"></a>

#### onMapInit
```typescript
/**
 * Registers a map init event callback.
 * 
 * @param {MapInitDelegate} callback - The callback to be executed whenever the event is emitted
 */
mapViewer.onMapInit((sender) => {
  console.log('Map initialized:', sender.mapId);
});
```

<a id="onmapready"></a>

#### onMapReady
```typescript
/**
 * Registers a map ready event callback.
 * 
 * @param {MapReadyDelegate} callback - The callback to be executed whenever the event is emitted
 */
mapViewer.onMapReady((sender) => {
  console.log('Map ready:', sender.mapId);
});
```

<a id="onmapmoveend"></a>

#### onMapMoveEnd
```typescript
/**
 * Registers a map move end event callback.
 * 
 * @param {MapMoveEndDelegate} callback - The callback to be executed whenever the event is emitted
 */
mapViewer.onMapMoveEnd((sender, payload) => {
  console.log('Map moved to:', payload.lonlat);
});
```

<a id="onmapsingleclick"></a>

#### onMapSingleClick
```typescript
/**
 * Registers a map single click event callback.
 * 
 * @param {MapSingleClickDelegate} callback - The callback to be executed whenever the event is emitted
 */
mapViewer.onMapSingleClick((sender, payload) => {
  console.log('Map clicked at:', payload.lonlat);
});
```

<a id="onmapzoomend"></a>

#### onMapZoomEnd
```typescript
/**
 * Registers a map zoom end event callback.
 * 
 * @param {MapZoomEndDelegate} callback - The callback to be executed whenever the event is emitted
 */
mapViewer.onMapZoomEnd((sender, payload) => {
  console.log('Map zoomed to level:', payload.zoom);
});
```

<a id="onmaplanguagechanged"></a>

#### onMapLanguageChanged
```typescript
/**
 * Registers a language changed event callback.
 * 
 * @param {MapLanguageChangedDelegate} callback - The callback to be executed whenever the event is emitted
 */
mapViewer.onMapLanguageChanged((sender, payload) => {
  console.log('Map language changed to:', payload.language);
});
```