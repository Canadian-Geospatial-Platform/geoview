# 07 — Legend

Legend panel behavior and interactions.

## Basic Display

- [ ] **All layers listed** — Open the Legend panel. Verify all layers from the config appear.
- [ ] **Layer icons** — Verify each layer has the correct icon/symbol.
- [ ] **Group layers** — Verify group layers are expandable/collapsible and show child layers.

## Loading Status

- [ ] **Progress bar on loading** — While layers are loading, verify a progress bar appears underneath each loading layer entry.
- [ ] **Progress bar disappears** — After loading completes, verify the progress bar disappears.

## Show All / Collapse All

- [ ] **Collapse all** — Click "Collapse All". Verify all group layers collapse.
- [ ] **Show all** — Click "Show All". Verify all group layers expand.

## Visibility Toggle

- [ ] **Toggle layer off** — Click the visibility icon for a layer. Verify it turns off in the legend and on the map.
- [ ] **Toggle layer on** — Click again. Verify it turns back on.
- [ ] **Toggle group** — Toggle a group layer off. Verify all children are hidden on the map (but show greyed out in legend with their own visibility preserved).

## Full Screen & ESC

- [ ] **Legend full screen** — Set the Legend panel to full screen.
- [ ] **ESC exits full screen** — Press ESC. Verify the legend exits full screen.
- [ ] **Map scroll after ESC** — After pressing ESC from full screen, scroll on the map area. Verify the map scrolls/zooms normally (no stuck state).

## Shortcuts & Actions

- [ ] **Legend → Layers shortcut** — Click the layer settings shortcut on a layer in the legend. Verify the Layers panel opens with that layer selected.
- [ ] **Highlight layer** — Click the highlight button on a layer. Verify the layer is visually highlighted on the map (opacity boost). Click again to remove highlight.
- [ ] **Zoom to layer extent** — Click the zoom-to-extent button on a layer. Verify the map zooms to that layer's extent.

## Style Classes Visibility

For layers with multiple style classes (unique value or class breaks):

- [ ] **Classes listed** — Verify all style classes are listed under the layer with their icons.
- [ ] **Class count description** — Verify the description shows "y of x classes" reflecting how many are visible.
- [ ] **Toggle class off** — Toggle one class off. Verify that class disappears from the map and the count updates (e.g., "4 of 5 classes").
- [ ] **Toggle class on** — Toggle the class back on. Verify it reappears on the map and the count updates.
- [ ] **Toggle all classes off** — Turn off all classes. Verify no features render for that layer.
- [ ] **Toggle all classes on** — Turn all back on. Verify all features reappear.

## WMS Legend Images

- [ ] **WMS images in legend** — For WMS layers, verify legend images appear in a collapsible section.
- [ ] **Lightbox on click** — Click a WMS legend image. Verify it opens in the lightbox for a larger view.
