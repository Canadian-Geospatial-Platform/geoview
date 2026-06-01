import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import type { MapConfigLayerEntry, TypeGeoviewLayerConfig, TypeInitialGeoviewLayerType, TypeLayerEntryConfig } from '@/api/types/layer-schema-types';
import type { GroupLayerEntryConfig, GroupLayerEntryConfigProps } from '@/api/config/validation-classes/group-layer-entry-config';
type BuildGeoViewLayerInput = {
    layerIdsToAdd: string[];
    layerName: string;
    layerType: TypeInitialGeoviewLayerType;
    layerURL: string;
    layerTree: TypeGeoviewLayerConfig;
    isGeoCore: boolean;
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
     * @param language - The display language to use for localization
     * @param includeStatic - Indicates whether static image layers should be included
     * @returns An array where each item is a tuple containing [layerType, localizedName]
     */
    static getLocalizeLayerType(language: TypeDisplayLanguage, includeStatic: boolean): Array<[string, string]>;
    /**
     * Finds a layer or layer entry configuration by ID.
     *
     * @param layerTree - The layer tree to start searching from
     * @param layerId - The layer ID or view ID to resolve
     * @returns The matching layer configuration or layer entry configuration, or undefined when not found
     */
    static findLayerById(layerTree: TypeGeoviewLayerConfig | undefined, layerId: string): TypeGeoviewLayerConfig | TypeLayerEntryConfig | undefined;
    /**
     * Finds a layer display name by ID.
     *
     * @param layerTree - The layer tree to start searching from
     * @param layerId - The layer ID or view ID to resolve
     * @returns The resolved layer name, or undefined when no matching layer is found
     */
    static findLayerNameById(layerTree: TypeGeoviewLayerConfig | undefined, layerId: string): string | undefined;
    /**
     * Checks whether all sublayers of a group are included in the selected IDs.
     *
     * @param layerTree - The group layer or root layer entry to validate
     * @param layerIds - The selected layer IDs to compare against
     * @returns True when every descendant layer entry is included in the selection
     */
    static allSubLayersAreIncluded(layerTree: TypeGeoviewLayerConfig | TypeLayerEntryConfig | GroupLayerEntryConfigProps, layerIds: (string | undefined)[]): boolean;
    /**
     * Creates a layer entry configuration shell for a selected group layer.
     *
     * The method can collapse a fully-selected ESRI Dynamic group into its original
     * group entry, or build a synthetic group entry that contains only selected
     * descendants when the selection is partial.
     *
     * @param layerName - The display name provided by the user for the resulting layer selection
     * @param layerType - The source layer type used to determine collapse behavior
     * @param layerIds - The selected layer IDs resolved from the current selection
     * @param layersToAdd - The selected layer objects to include in the resulting config
     * @param layerIdsToAdd - The selected layer view IDs used to identify nested descendants
     * @param removedLayerIds - The accumulator of layer IDs that must be skipped to avoid duplicate entries
     * @param layerTree - The complete source layer tree used to resolve nested view paths
     * @param groupLayer - The group layer currently being converted into a layer entry shell
     * @param allowCollapse - Optional flag indicating whether full-group collapse is allowed
     * @returns The layer entry configuration shell for the group selection
     */
    static createLayerEntryConfigForGroupLayer(layerName: string, layerType: TypeInitialGeoviewLayerType, layerIds: string[], layersToAdd: (TypeGeoviewLayerConfig | TypeLayerEntryConfig)[], layerIdsToAdd: string[], removedLayerIds: string[], layerTree: TypeGeoviewLayerConfig, groupLayer: TypeGeoviewLayerConfig | GroupLayerEntryConfig | GroupLayerEntryConfigProps, allowCollapse?: boolean): LayerEntryConfigShell;
    /**
     * Builds a GeoView layer configuration from selected layer IDs.
     *
     * @param inputProps - The selected layer metadata and source tree context
     * @returns The map configuration layer entry to add to the map config
     */
    static buildGeoLayerToAdd(inputProps: BuildGeoViewLayerInput): MapConfigLayerEntry;
}
export {};
//# sourceMappingURL=add-layer-utils.d.ts.map