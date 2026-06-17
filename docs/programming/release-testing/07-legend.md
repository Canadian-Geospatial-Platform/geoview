# 07 — Legend

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.

Legend panel behavior and interactions. The Legend panel is available via appBar or footerBar tabs and displays all layers with their icons, style classes, and controls.

## Basic Display

Config (appBar legend, many layer types + group): `configs/navigator/layers/all-layers.json` (`appBar: ["legend"]`, 13+ layer types, GeoJSON group `point-feature-group`)

Config (footerBar legend, groups): `configs/navigator/demos/09-basic-footer-layers-tab.json` (`footerBar: ["legend"]`, GeoJSON group with 5 children)

| Test              | Description                        | Steps                                                                                                          | Expected Result                                            | Auto |
| ----------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---- |
| All layers listed | All config layers appear in legend | 1. Load `all-layers.json`<br>2. Open the Legend panel                                                          | All layers from the config appear in the legend panel      | M    |
| Layer icons       | Correct icon per layer type        | 1. Inspect each layer entry in the legend                                                                      | Each layer displays its correct icon/symbol                | M    |
| Group layers      | Groups expandable/collapsible      | 1. Load a config with group layers<br>2. Click the expand arrow on a group layer<br>3. Click again to collapse | Group expands to show child layers, collapses to hide them | M    |

## Loading Status

Config: any config with layers (e.g., `configs/navigator/layers/all-layers.json`)

| Test                    | Description               | Steps                                                                                       | Expected Result                                                  | Auto |
| ----------------------- | ------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---- |
| Progress bar on loading | Shows while layer loads   | 1. Load a config (or hard-refresh the page)<br>2. Watch the legend while layers are loading | A progress bar appears underneath each loading layer entry       | M    |
| Progress bar disappears | Hides after load complete | 1. Wait for all layers to finish loading                                                    | Progress bars disappear once layers reach loaded or error status | M    |

## Toggle All Controls

Config: `configs/navigator/layers/all-layers.json` (multiple layers and groups)

The ToggleAll component provides two controls at the top of the legend: an eye icon (toggle all visibility) and a collapse icon (expand/collapse all layer headers).

| Test                      | Description                | Steps                                                                                                         | Expected Result                                                   | Auto |
| ------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---- |
| Collapse all              | All layer headers collapse | 1. Run `cgpv.api.getMapViewer('LYR_CGPV').controllers.layerController.setAllLayerCollapsed(true)` in console  | All expanded layer entries collapse (children/items hidden)       | C    |
| Expand all                | All layer headers expand   | 1. Run `cgpv.api.getMapViewer('LYR_CGPV').controllers.layerController.setAllLayerCollapsed(false)` in console | All layer entries expand to show children and items               | C    |
| Toggle all visibility off | All layers hidden          | 1. Click the eye icon in the ToggleAll bar                                                                    | All layers turn off on the map; visibility icons update in legend | C    |
| Toggle all visibility on  | All layers shown           | 1. Click the eye icon again                                                                                   | All layers turn back on; visibility icons update in legend        | C    |

## Visibility Toggle

Config: `configs/navigator/layers/all-layers.json` (has individual layers and a group layer)

| Test             | Description                 | Steps                                          | Expected Result                                                                                     | Auto |
| ---------------- | --------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---- |
| Toggle layer off | Single layer hides on map   | 1. Click the visibility (eye) icon for a layer | Layer disappears from the map; icon shows hidden state                                              | C    |
| Toggle layer on  | Single layer shows on map   | 1. Click the visibility icon again             | Layer reappears on the map; icon shows visible state                                                | C    |
| Toggle group off | Group hides children on map | 1. Toggle a group layer off                    | All children hidden on map, but show greyed out in legend with their own visibility state preserved | M    |

## Full Screen & ESC

Config: `configs/navigator/layers/all-layers.json` (legend in appBar — fullscreen button only available in appBar)

| Test                  | Description                 | Steps                                                                   | Expected Result                                       | Auto |
| --------------------- | --------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- | ---- |
| Legend full screen    | Opens in full-screen dialog | 1. Click the fullscreen button in the legend panel                      | Legend opens in a full-screen dialog with same layout | M    |
| ESC exits full screen | Closes full-screen dialog   | 1. While in fullscreen, press ESC                                       | Legend exits full screen and returns to normal view   | M    |
| Map scroll after ESC  | Map not stuck after ESC     | 1. After pressing ESC from fullscreen<br>2. Scroll/zoom on the map area | Map scrolls and zooms normally (no stuck state)       | M    |

## Shortcuts & Actions

Config: `configs/navigator/layers/all-layers.json` (has layers tab for shortcut target)

| Test                     | Description                    | Steps                                                                                    | Expected Result                                                                                          | Auto |
| ------------------------ | ------------------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---- |
| Legend → Layers shortcut | Opens Layers panel for layer   | 1. Click the Layers icon button on a layer in the legend                                 | Layers panel opens with that layer selected                                                              | M    |
| Highlight layer          | Opacity boost on map           | 1. Click the highlight button on a layer<br>2. Click again to remove                     | Layer features are visually highlighted on the map (opacity boost); clicking again removes the highlight | M    |
| Zoom to layer extent     | Map zooms to layer bounds      | 1. Click the zoom-to-extent button on a layer                                            | Map zooms to that layer's geographic extent                                                              | C    |
| Zoom to visible scale    | Zooms to layer's visible range | 1. Zoom out until a layer shows "out of visible range"<br>2. Click the scale icon button | Map zooms to a level within the layer's min/max scale range                                              | M    |

## Style Classes Visibility

Config (uniqueValue + classBreaks): `configs/navigator/layers/esri-feature.json` (layers `uniqueValueId` and `classBreaksId` with multiple style classes)

Config (complex classifications): `configs/navigator/demos/26-complex-classifications.json` (valueExpression classification by century)

For layers with multiple style classes (unique value or class breaks):

| Test                    | Description                    | Steps                                                                                            | Expected Result                                                                      | Auto |
| ----------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ---- |
| Classes listed          | Style classes shown with icons | 1. Load `esri-feature.json`<br>2. Expand a layer with style classes (uniqueValue or classBreaks) | All style classes listed under the layer with their icons                            | M    |
| Class count description | Shows "y of x classes"         | 1. Check the subtitle under the layer name                                                       | Description shows "y of x classes" reflecting visible count (e.g., "5 of 5 classes") | C    |
| Toggle class off        | Class disappears from map      | 1. Click a style class checkbox to toggle it off                                                 | That class disappears from the map; count updates (e.g., "4 of 5 classes")           | C    |
| Toggle class on         | Class reappears on map         | 1. Click the same checkbox to toggle it back on                                                  | Class reappears on the map; count updates back                                       | C    |
| Toggle all classes off  | No features render             | 1. Toggle all style classes off one by one                                                       | No features render for that layer; count shows "0 of x classes"                      | C    |
| Toggle all classes on   | All features reappear          | 1. Toggle all back on                                                                            | All features reappear; count shows "x of x classes"                                  | C    |

## WMS Legend Images

Config: `configs/navigator/layers/wms.json` (multiple WMS layers with legend images)

| Test                 | Description          | Steps                                                     | Expected Result                                   | Auto |
| -------------------- | -------------------- | --------------------------------------------------------- | ------------------------------------------------- | ---- |
| WMS images in legend | Legend images appear | 1. Load `wms.json`<br>2. Expand a WMS layer in the legend | Legend image appears in the expanded content area | M    |
| Lightbox on click    | Opens full-size view | 1. Click a WMS legend image                               | Image opens in a lightbox for a larger view       | M    |
