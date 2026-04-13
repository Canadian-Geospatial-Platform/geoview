import type { LayerListEntry } from '@/core/components/common';
/**
 * Waits until a layer path has 0 elements before changing the selection.
 *
 * Used by the Details-Panel and the GeoChart-Panel as a bypass mechanism
 * to ensure layer selection only changes when a layer genuinely has no features.
 *
 * @param mapId - The map identifier
 * @param callbackSetStoreLayerDataArrayBatch - Callback executed when setting the layerPath to be used by the bypass
 * @param callbackSetStoreSelectedLayerPath - Callback executed when selecting a layer based on its layerPath
 * @param memoLayerSelectedItem - The selected item LayerListEntry
 * @param memoLayersList - The list of layers available for selection
 */
export declare function checkSelectedLayerPathList(mapId: string, callbackSetStoreLayerDataArrayBatch: (mapId: string, layerPath: string) => void, callbackSetStoreSelectedLayerPath: (mapId: string, layerPath: string) => void, memoLayerSelectedItem: LayerListEntry | undefined, memoLayersList: LayerListEntry[]): void;
//# sourceMappingURL=comp-common.d.ts.map