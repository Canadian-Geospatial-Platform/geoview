import { GroupLayerEntryConfig, TypeGeoviewLayerConfig } from '@/api/config/types/map-schema-types';
type BuildGeoViewLayerInput = {
    layerIdsToAdd: string[];
    layerName: string;
    layerType: string;
    layerURL: string;
    layerList: GroupLayerEntryConfig[];
};
/**
 * Finds a layer entry config from an array with the given ID.
 * @param {GroupLayerEntryConfig[]} layerList - The array of layerEntryConfigs.
 * @param {string} layerId - The ID of the layer to find.
 * @returns The layer entry config of the found layer or null if none is found.
 */
export declare const getLayerById: (layerList: GroupLayerEntryConfig[], layerId: string) => GroupLayerEntryConfig | null;
/**
 * Finds a layer name from an array of layer entry configs with the given ID.
 * @param {GroupLayerEntryConfig[]} layersList - The array of layerEntryConfigs.
 * @param {string} layerId - The ID of the layer to find.
 * @returns The name of the layer or undefined if none is found.
 */
export declare const getLayerNameById: (layersList: GroupLayerEntryConfig[], layerId: string) => string | undefined;
/**
 * Builds a geoview layer config from provided layer IDs.
 * @param {BuildGeoViewLayerInput} inputProps - The layer information
 * @returns {TypeGeoviewLayerConfig} The geoview layer config
 */
export declare const buildGeoLayerToAdd: (inputProps: BuildGeoViewLayerInput) => TypeGeoviewLayerConfig;
export {};
