# MapViewer Public Functions

Below is a comprehensive list of all public functions available on a MapViewer instance obtained through `cgpv.api.getMapViewer('mapId')`.

## Properties
- `mapId` - The unique identifier of the map
- `map` - The OpenLayers map instance
- `mapFeaturesConfig` - The map configuration properties
- `plugins` - Plugins (package) attached to the map
- `appBarApi` - API for the app bar
- `navBarApi` - API for the navigation bar
- `footerBarApi` - API for the footer bar
- `stateApi` - API for state management
- `basemap` - API for basemap functions
- `notifications` - API for notifications
- `layer` - API for layer functions
- `modal` - API for modal creation

## Map State Functions
- `getDisplayLanguage()` - Returns the current display language
- `getDisplayTheme()` - Returns the current display theme
- `getMapState()` - Returns the map current state information
- `getView()` - Gets the map view settings
- `setView(mapView)` - Sets the map view settings
- `getCenter()` - Gets the map center coordinate
- `setCenter(center)` - Sets the map center
- `getMapSize()` - Gets the map size
- `getCoordinateFromPixel(pointXY, timeoutMs)` - Gets the map coordinate from pixel
- `getProjection()` - Gets the map projection
- `getMapLayerOrderInfo()` - Gets the ordered layer info
- `getI18nInstance()` - Gets the i18n instance for localization
- `setFullscreen(status, element)` - Sets fullscreen mode
- `setInteraction(interaction)` - Sets map to either dynamic or static
- `setLanguage(displayLanguage, reloadLayers)` - Sets the display language of the map
- `setProjection(projectionCode)` - Sets the display projection of the map
- `rotate(degree)` - Rotates the view to align it at the given degrees
- `setTheme(displayTheme)` - Sets the display theme of the map
- `setMapZoomLevel(zoom)` - Sets the map zoom level
- `setMinZoomLevel(zoom)` - Sets the minimum map zoom level
- `setMaxZoomLevel(zoom)` - Sets the maximum map zoom level
- `setExtent(extent)` - Sets map extent
- `setMaxExtent(extent)` - Sets the maximum extent of the map

## Map Action Functions
- `addComponent(mapComponentId, component)` - Adds a new custom component to the map
- `removeComponent(mapComponentId)` - Removes an existing custom component from the map
- `addLocalizeRessourceBundle(language, translations)` - Adds a localization resource bundle
- `emitMapSingleClick(clickCoordinates)` - Emits a map single click event
- `refreshLayers()` - Refreshes all geoview layers
- `clickMarkerIconHide()` - Hides a click marker from the map
- `clickMarkerIconShow(marker)` - Shows a marker on the map
- `delete()` - Deletes the map
- `reload(mapConfig)` - Reloads a map from a config object
- `reloadWithCurrentState(maintainGeocoreLayerNames)` - Reloads a map from current state
- `zoomToExtent(extent, options)` - Zooms to the specified extent
- `setHomeButtonView(view)` - Updates nav bar home button view settings
- `zoomToLonLatExtentOrCoordinate(extent, options)` - Zooms to specified extent or coordinate
- `updateIconImageCache(legend)` - Updates the size of the icon image list
- `waitAllLayersStatus(layerStatus)` - Waits until all layers reach specified status

## Map Interaction Functions
- `initSelectInteractions()` - Initializes selection interactions
- `initExtentInteractions()` - Initializes extent interactions
- `initTranslateInteractions()` - Initializes translation interactions
- `initTranslateOneFeatureInteractions()` - Initializes translation interactions for one feature
- `initDrawInteractions(geomGroupKey, type, style)` - Initializes drawing interactions
- `initModifyInteractions(geomGroupKey, style, insertVertexCondition, pixelTolerance)` - Initializes modifying interactions
- `initSnapInteractions(geomGroupKey)` - Initializes snapping interactions

## Utility Functions
- `getNorthVisibility()` - Gets if north is visible
- `getNorthArrowAngle()` - Gets north arrow bearing
- `convertCoordinateLonLatToMapProj(coordinate)` - Transforms coordinate from LonLat to map projection
- `convertCoordinateMapProjToLonLat(coordinate)` - Transforms coordinate from map projection to LonLat
- `convertExtentLonLatToMapProj(extent, stops)` - Transforms extent from LonLat to map projection
- `convertExtentMapProjToLonLat(extent)` - Transforms extent from map projection to LonLat
- `convertCoordinateFromProjToMapProj(coordinate, fromProj)` - Transforms coordinate from given projection to map projection
- `convertCoordinateFromMapProjToProj(coordinate, toProj)` - Transforms coordinate from map projection to given projection
- `convertExtentFromProjToMapProj(extent, fromProj, stops)` - Transforms extent from given projection to map projection
- `convertExtentFromMapProjToProj(extent, toProj, stops)` - Transforms extent from map projection to given projection
- `createMapConfigFromMapState(overrideGeocoreServiceNames)` - Creates a map config based on current map state
- `replaceMapConfigLayerNames(namePairs, mapConfig, removeUnlisted)` - Replaces layer names in a map config

## Event Handlers
- `onMapInit(callback)` - Registers a map init event callback
- `offMapInit(callback)` - Unregisters a map init event callback
- `onMapReady(callback)` - Registers a map ready event callback
- `offMapReady(callback)` - Unregisters a map ready event callback
- `onMapLayersProcessed(callback)` - Registers a map layers processed event callback
- `offMapLayersProcessed(callback)` - Unregisters a map layers processed event callback
- `onMapLayersLoaded(callback)` - Registers a map layers loaded event callback
- `offMapLayersLoaded(callback)` - Unregisters a map layers loaded event callback
- `onMapMoveEnd(callback)` - Registers a map move end event callback
- `offMapMoveEnd(callback)` - Unregisters a map move end event callback
- `onMapPointerMove(callback)` - Registers a map pointer move event callback
- `offMapPointerMove(callback)` - Unregisters a map pointer move event callback
- `onMapPointerStop(callback)` - Registers a map pointer stop event callback
- `offMapPointerStop(callback)` - Unregisters a map pointer stop event callback
- `onMapSingleClick(callback)` - Registers a map single click event callback
- `offMapSingleClick(callback)` - Unregisters a map single click event callback
- `onMapZoomEnd(callback)` - Registers a map zoom end event callback
- `offMapZoomEnd(callback)` - Unregisters a map zoom end event callback
- `onMapRotation(callback)` - Registers a map rotation event callback
- `offMapRotation(callback)` - Unregisters a map rotation event callback
- `onMapChangeSize(callback)` - Registers a map change size event callback
- `offMapChangeSize(callback)` - Unregisters a map change size event callback
- `onMapComponentAdded(callback)` - Registers a component added event callback
- `offMapComponentAdded(callback)` - Unregisters a component added event callback
- `onMapComponentRemoved(callback)` - Registers a component removed event callback
- `offMapComponentRemoved(callback)` - Unregisters a component removed event callback
- `onMapLanguageChanged(callback)` - Registers a language changed event callback
- `offMapLanguageChanged(callback)` - Unregisters a language changed event callback
