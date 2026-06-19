# 07 — Legend

> **Progress tracking**: Use the [Release Testing Issue Template](../../.github/ISSUE_TEMPLATE/release-testing.md) to track pass/fail status per release.
>
> **Test page**: [rt-07-legend.html](../../packages/geoview-core/public/templates/release-testing/rt-07-legend.html) — Map 1 (Fieldnotes + Hydro GeoCore groups + simple layer + ESRI uniqueValue/classBreaks layers, collapse/expand/visibility buttons), Map 2 (4 WMS layers — MSI datacube, GeoMet, NAPL, Man-made).
>
> **Navigator configs** (for detailed tests with specific layer types): `layers/all-layers.json`, `layers/esri-feature.json`, `layers/wms.json`, `demos/26-complex-classifications.json`

Legend panel behavior and interactions. The Legend panel is available via appBar or footerBar tabs and displays all layers with their icons, style classes, and controls.

## Basic Display

| Test              | Description                        | Steps                                                                                                       | Expected Result                                            | Auto |
| ----------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---- |
| All layers listed | All config layers appear in legend | 1. On Map 1, open the Legend panel in the app bar                                                           | All layers from the config appear in the legend panel      | M    |
| Layer icons       | Correct icon per layer type        | 1. On Map 1, inspect each layer entry in the legend                                                         | Each layer displays its correct icon/symbol                | M    |
| Group layers      | Groups expandable/collapsible      | 1. On Map 1, click the expand arrow on a group layer (GeoCore with sublayers)<br>2. Click again to collapse | Group expands to show child layers, collapses to hide them | M    |

## Loading Status

| Test                 | Description              | Steps                                                                                                | Expected Result                                                       | Auto |
| -------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---- |
| Layer progress bar   | Shows while layer loads  | 1. Hard-refresh the test page<br>2. Watch individual layer entries on Map 1 while layers are loading | A progress bar appears underneath each loading layer entry            | M    |
| Legend spinner       | Shows while legend loads | 1. Hard-refresh the test page<br>2. Watch the legend panel on Map 1                                  | A circular spinner appears in the legend while layers are processing  | M    |
| Indicators disappear | Hide after load complete | 1. Wait for all layers on Map 1 to finish loading                                                    | Progress bars and spinner disappear once layers reach loaded or error | M    |

## Toggle All Controls

The ToggleAll component provides two controls at the top of the legend: an eye icon (toggle all visibility) and a collapse icon (expand/collapse all layer headers).

| Test                      | Description                | Steps                                                                                     | Expected Result                                                   | Auto |
| ------------------------- | -------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ---- |
| Collapse all              | All layer headers collapse | 1. On Map 1, click the "Collapse All" button                                              | All expanded layer entries collapse (children/items hidden)       | C    |
| Expand all                | All layer headers expand   | 1. On Map 1, click the "Expand All" button                                                | All layer entries expand to show children and items               | C    |
| Toggle all visibility off | All layers hidden          | 1. On Map 1, click the "All Visibility OFF" button (or the eye icon in the ToggleAll bar) | All layers turn off on the map; visibility icons update in legend | C    |
| Toggle all visibility on  | All layers shown           | 1. On Map 1, click the "All Visibility ON" button (or the eye icon again)                 | All layers turn back on; visibility icons update in legend        | C    |

## Visibility Toggle

| Test             | Description                 | Steps                                                          | Expected Result                                                                                     | Auto |
| ---------------- | --------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---- |
| Toggle layer off | Single layer hides on map   | 1. On Map 1, click the visibility (eye) icon for a layer       | Layer disappears from the map; icon shows hidden state                                              | C    |
| Toggle layer on  | Single layer shows on map   | 1. On Map 1, click the visibility icon again                   | Layer reappears on the map; icon shows visible state                                                | C    |
| Toggle group off | Group hides children on map | 1. On Map 1, toggle a group layer (GeoCore with sublayers) off | All children hidden on map, but show greyed out in legend with their own visibility state preserved | M    |

## Full Screen & ESC

| Test                  | Description                 | Steps                                                                   | Expected Result                                       | Auto |
| --------------------- | --------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- | ---- |
| Legend full screen    | Opens in full-screen dialog | 1. On Map 1, click the fullscreen button in the legend panel (app bar)  | Legend opens in a full-screen dialog with same layout | M    |
| ESC exits full screen | Closes full-screen dialog   | 1. While in fullscreen, press ESC                                       | Legend exits full screen and returns to normal view   | M    |
| Map scroll after ESC  | Map not stuck after ESC     | 1. After pressing ESC from fullscreen<br>2. Scroll/zoom on the map area | Map scrolls and zooms normally (no stuck state)       | M    |

## Shortcuts & Actions

| Test                     | Description                    | Steps                                                                                              | Expected Result                                                                                          | Auto |
| ------------------------ | ------------------------------ | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---- |
| Legend → Layers shortcut | Opens Layers panel for layer   | 1. On Map 1, click the Layers icon button on a layer in the legend                                 | Layers panel opens with that layer selected                                                              | M    |
| Highlight layer          | Opacity boost on map           | 1. On Map 1, click the highlight button on a layer<br>2. Click again to remove                     | Layer features are visually highlighted on the map (opacity boost); clicking again removes the highlight | M    |
| Zoom to layer extent     | Map zooms to layer bounds      | 1. On Map 1, click the zoom-to-extent button on a layer                                            | Map zooms to that layer's geographic extent                                                              | C    |
| Zoom to visible scale    | Zooms to layer's visible range | 1. On Map 1, zoom out until a layer shows "out of visible range"<br>2. Click the scale icon button | Map zooms to a level within the layer's min/max scale range                                              | M    |

## Style Classes Visibility

> Additional configs (for complex classifications): `configs/navigator/demos/26-complex-classifications.json`

Map 1 includes ESRI Feature layers with uniqueValue (CESI layer 1) and classBreaks (CSO Volume layer 8) style classes.

| Test                    | Description                    | Steps                                                                                            | Expected Result                                                                      | Auto |
| ----------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ---- |
| Classes listed          | Style classes shown with icons | 1. On Map 1, expand the classBreaks layer (CSO Volume) or uniqueValue layer (CESI) in the legend | All style classes listed under the layer with their icons                            | M    |
| Class count description | Shows "y of x classes"         | 1. On Map 1, check the subtitle under the layer name                                             | Description shows "y of x classes" reflecting visible count (e.g., "5 of 5 classes") | C    |
| Toggle class off        | Class disappears from map      | 1. On Map 1, click a style class checkbox to toggle it off                                       | That class disappears from the map; count updates (e.g., "4 of 5 classes")           | C    |
| Toggle class on         | Class reappears on map         | 1. On Map 1, click the same checkbox to toggle it back on                                        | Class reappears on the map; count updates back                                       | C    |
| Toggle all classes off  | No features render             | 1. On Map 1, toggle all style classes off one by one                                             | No features render for that layer; count shows "0 of x classes"                      | C    |
| Toggle all classes on   | All features reappear          | 1. On Map 1, toggle all back on                                                                  | All features reappear; count shows "x of x classes"                                  | C    |

## WMS Legend Images

| Test                 | Description          | Steps                                           | Expected Result                                   | Auto |
| -------------------- | -------------------- | ----------------------------------------------- | ------------------------------------------------- | ---- |
| WMS images in legend | Legend images appear | 1. On Map 2, expand the WMS layer in the legend | Legend image appears in the expanded content area | M    |
| Lightbox on click    | Opens full-size view | 1. On Map 2, click a WMS legend image           | Image opens in a lightbox for a larger view       | M    |
