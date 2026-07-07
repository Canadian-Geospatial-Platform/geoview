# Breaking Changes Post 2.1

This document lists public API methods that were removed or had their signatures changed after version 2.1.

## MapViewer

### Removed Methods

| Method | Replacement |
|--------|-------------|
| `getPluginAsync(pluginId)` | No replacement |
| `getCenter()` | Use `cgpv.api.getMapViewer().getView().getCenter()` |
| `getMapSize()` | Use `cgpv.api.getMapViewer().map.getSize()` |
| `getCoordinateFromPixel(pointXY, timeoutMs)` | No replacement |
| `setExtent(extent)` | Use `zoomToExtent(extent)` |
| `setMaxExtent(extent)` | No replacement |
| `waitAllLayersStatus(layerStatus)` | Use `cgpv.api.getMapViewer().layer.waitForAllLayersStatus(layerStatus)` |
| `waitForLayersLoaded()` | Use `cgpv.api.getMapViewer().layer.waitForLayersLoaded()` |

### Signature Changes

| Method | Change |
|--------|--------|
| `setMapZoomLevel(zoom)` | No longer returns a Promise |
| `getNorthArrowAngle()` | Now returns a `number` instead of `string` |
| `zoomToExtent(extent, options?)` | New signature: `zoomToExtent(extent, useAnimation, options)` — `useAnimation` parameter added |
| `onMapZoomEnd` / `offMapZoomEnd` | Renamed to `onMapResolutionChanged` / `offMapResolutionChanged` |
| `onMapChangeSize` / `offMapChangeSize` | Renamed to `onMapSizeChanged` / `offMapSizeChanged` |

## LayerApi

### Removed Methods

| Method | Replacement |
|--------|-------------|
| `getOLLayerAsync()` | No replacement |

### Signature Changes

| Method | Change |
|--------|--------|
| `zoomToLayerExtent(layerPath, fitOptions?)` | New signature: `zoomToLayerExtent(layerPath, useAnimation, fitOptions?)` — `useAnimation` parameter added |
