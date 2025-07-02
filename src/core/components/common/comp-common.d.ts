import { LayerListEntry } from '@/core/components/common';
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
export declare function checkSelectedLayerPathList(callbackSetLayerDataArrayBatch: (layerPath: string) => void, callbackSetSelectedLayerPath: (layerPath: string) => void, memoLayerSelectedItem: LayerListEntry | undefined, memoLayersList: LayerListEntry[]): void;
//# sourceMappingURL=comp-common.d.ts.map