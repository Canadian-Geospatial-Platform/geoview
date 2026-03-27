import type { LayerListEntry } from '@/core/components/common';

/**
 * Waits until a layer path has 0 elements before changing the selection.
 *
 * Used by the Details-Panel and the GeoChart-Panel as a bypass mechanism
 * to ensure layer selection only changes when a layer genuinely has no features.
 *
 * @param callbackSetLayerDataArrayBatch - Callback executed when setting the layerPath to be used by the bypass
 * @param callbackSetSelectedLayerPath - Callback executed when selecting a layer based on its layerPath
 * @param memoLayerSelectedItem - The selected item LayerListEntry
 * @param memoLayersList - The list of layers available for selection
 */
export function checkSelectedLayerPathList(
  callbackSetLayerDataArrayBatch: (layerPath: string) => void,
  callbackSetSelectedLayerPath: (layerPath: string) => void,
  memoLayerSelectedItem: LayerListEntry | undefined,
  memoLayersList: LayerListEntry[]
): void {
  // Check if the layer we are on is not 'processed' or 'error', ignore if so
  if (memoLayerSelectedItem && !(memoLayerSelectedItem.queryStatus === 'processed' || memoLayerSelectedItem.queryStatus === 'error'))
    return;

  // Check if the layer we are on still have features
  if (memoLayerSelectedItem?.numOffeatures) {
    // All good, keep selection
    // Reset the bypass for next time
    callbackSetLayerDataArrayBatch(memoLayerSelectedItem.layerPath);
  } else {
    // Find the first layer with features
    const anotherLayerEntry = memoLayersList.find((layer) => {
      return memoLayersList.find((layer2) => layer.layerPath === layer2.layerPath && layer2.numOffeatures);
    });

    // If found
    if (anotherLayerEntry) {
      // Select that one
      callbackSetSelectedLayerPath(anotherLayerEntry.layerPath);
    } else {
      // TODO: Investigate infinite loop in AppBar for statement. (Not sure if still relevant to check or how to check it?)
      // None found, select none
      callbackSetSelectedLayerPath('');
    }
  }
}
