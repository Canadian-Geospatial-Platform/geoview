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
export declare function checkSelectedLayerPathList(callbackSetLayerDataArrayBatch: (layerPath: string) => void, callbackSetSelectedLayerPath: (layerPath: string) => void, memoLayerSelectedItem: LayerListEntry | undefined, memoLayersList: LayerListEntry[]): void;
//# sourceMappingURL=comp-common.d.ts.map