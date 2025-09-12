import { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import { TypeLayerEntryConfig, MapConfigLayerEntry, TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import { ConfigBaseClassProps } from '@/api/config/validation-classes/config-base-class';
import { GroupLayerEntryConfigProps } from '@/api/config/validation-classes/group-layer-entry-config';
type BuildGeoViewLayerInput = {
    layerIdsToAdd: string[];
    layerName: string;
    layerType: string;
    layerURL: string;
    layerTree: TypeGeoviewLayerConfig;
};
type LayerEntryConfigShell = {
    layerId: string;
    layerName: string | undefined;
    listOfLayerEntryConfig?: LayerEntryConfigShell[];
};
export declare class UtilAddLayer {
    /**
     * Returns an array of tuples representing available GeoView layer types and their localized display names.
     *
     * @param {TypeDisplayLanguage} language - The display language to use for localization.
     * @param {boolean} includeStatic - True if we need to include static image layers, false otherwise.
     * @returns {Array<[string, string]>} An array where each item is a tuple: [layerType, localizedName].
     */
    static getLocalizeLayerType(language: TypeDisplayLanguage, includeStatic: boolean): Array<[string, string]>;
    /**
     * Finds a layer entry config from an array with the given ID.
     * @param {TypeGeoviewLayerConfig | undefined} layerTree - The layer config to start searching from.
     * @param {string} layerId - The ID of the layer to find.
     * @returns The layer entry config of the found layer or null if none is found.
     */
    static getLayerById(layerTree: TypeGeoviewLayerConfig | undefined, layerId: string): TypeGeoviewLayerConfig | TypeLayerEntryConfig | undefined;
    /**
     * Finds a layer name from an array of layer entry configs with the given ID.
     * @param {TypeGeoviewLayerConfig | undefined} layerTree - The layer config to start searching from.
     * @param {string} layerId - The ID of the layer to find.
     * @returns The name of the layer or undefined if none is found.
     */
    static getLayerNameById(layerTree: TypeGeoviewLayerConfig | undefined, layerId: string): string | undefined;
    /**
     * Checks if all of a groups sublayers are to be added to the map.
     * @param {TypeGeoviewLayerConfig} layerTree - The group layer to check
     * @param {string[]} layerIds - The la
     * @returns {boolean} Whether or not all of the sublayers are included
     */
    static allSubLayersAreIncluded(layerTree: TypeGeoviewLayerConfig | GroupLayerEntryConfigProps, layerIds: (string | undefined)[]): boolean;
    /**
     * Creates a layer entry config shell for a group layer.
     * @param {GroupLayerEntryConfig} groupLayer - The group layer
     * @returns {LayerEntryConfigShell} The resulting layer entry config shell
     */
    static createLayerEntryConfigForGroupLayer(layerName: string, layerType: string, layerIds: string[], layersToAdd: (TypeGeoviewLayerConfig | ConfigBaseClassProps)[], layerIdsToAdd: string[], removedLayerIds: string[], groupLayer: TypeGeoviewLayerConfig | GroupLayerEntryConfigProps): LayerEntryConfigShell;
    /**
     * Builds a geoview layer config from provided layer IDs.
     * @param {BuildGeoViewLayerInput} inputProps - The layer information
     * @returns {MapConfigLayerEntry} The geoview layer config
     */
    static buildGeoLayerToAdd(inputProps: BuildGeoViewLayerInput): MapConfigLayerEntry;
}
export {};
//# sourceMappingURL=add-layer-utils.d.ts.map