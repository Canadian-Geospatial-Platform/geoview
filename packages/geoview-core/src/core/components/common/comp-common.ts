import type { LayerListEntry } from '@/core/components/common';

/**
 * Shared method implementing a bypass mechanism to make sure to wait until a particular layerPath indeed has 0 elements before actually changing the selection.
 * Used by the Details-Panel and the GeoChart-Panel.
 *
 * @param {function} callbackSetLayerDataArrayBatch - Callback executed when setting the layerPath to be used by the bypass
 * @param {function} callbackSetSelectedLayerPath - Callback executed when selecting a layer based on its layerPath
 * @param {LayerListEntry | undefined} memoLayerSelectedItem - The selected item LayerListEntry
 * @param {LayerListEntry[]} memoLayersList - The list of layers available for selection
 * @returns
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
