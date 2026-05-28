import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import type {
  MapConfigLayerEntry,
  TypeGeoviewLayerConfig,
  TypeInitialGeoviewLayerType,
  TypeLayerEntryConfig,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES, CONST_LAYER_ENTRY_TYPES } from '@/api/types/layer-schema-types';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { GroupLayerEntryConfig, GroupLayerEntryConfigProps } from '@/api/config/validation-classes/group-layer-entry-config';
import { generateId, getLocalizedMessage } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';

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

export class UtilAddLayer {
  /**
   * Returns an array of tuples representing available GeoView layer types and their localized display names.
   *
   * @param language - The display language to use for localization
   * @param includeStatic - Indicates whether static image layers should be included
   * @returns An array where each item is a tuple containing [layerType, localizedName]
   */
  static getLocalizeLayerType(language: TypeDisplayLanguage, includeStatic: boolean): Array<[string, string]> {
    const {
      CSV,
      ESRI_DYNAMIC,
      ESRI_FEATURE,
      ESRI_IMAGE,
      GEOJSON,
      GEOTIFF,
      KML,
      WMS,
      WMTS,
      WFS,
      WKB,
      OGC_FEATURE,
      XYZ_TILES,
      VECTOR_TILES,
    } = CONST_LAYER_TYPES;
    const { GEOCORE, GEOPACKAGE, SHAPEFILE } = CONST_LAYER_ENTRY_TYPES;
    const layerOptions: [string, string][] = [
      [CSV, getLocalizedMessage(language, 'layers.serviceCSV')],
      [SHAPEFILE, getLocalizedMessage(language, 'layers.serviceEsriShapefile')],
      [ESRI_DYNAMIC, getLocalizedMessage(language, 'layers.serviceEsriDynamic')],
      [ESRI_FEATURE, getLocalizedMessage(language, 'layers.serviceEsriFeature')],
      [ESRI_IMAGE, getLocalizedMessage(language, 'layers.serviceEsriImage')],
      [GEOJSON, getLocalizedMessage(language, 'layers.serviceGeoJSON')],
      [GEOPACKAGE, getLocalizedMessage(language, 'layers.serviceGeoPackage')],
      [GEOTIFF, getLocalizedMessage(language, 'layers.serviceGeoTIFF')],
      [KML, getLocalizedMessage(language, 'layers.serviceKML')],
      [WMS, getLocalizedMessage(language, 'layers.serviceOgcWMS')],
      [WMTS, getLocalizedMessage(language, 'layers.serviceOgcWMTS')],
      [WFS, getLocalizedMessage(language, 'layers.serviceOgcWFS')],
      [WKB, getLocalizedMessage(language, 'layers.serviceWKB')],
      [OGC_FEATURE, getLocalizedMessage(language, 'layers.serviceOgcFeature')],
      [XYZ_TILES, getLocalizedMessage(language, 'layers.serviceRasterTile')],
      [VECTOR_TILES, getLocalizedMessage(language, 'layers.serviceVectorTile')],
      [GEOCORE, getLocalizedMessage(language, 'layers.serviceGeoCore')],
    ];

    if (includeStatic) {
      layerOptions.push([CONST_LAYER_TYPES.IMAGE_STATIC, getLocalizedMessage(language, 'layers.serviceImageStatic')]);
    }

    return layerOptions;
  }

  /**
   * Finds a layer or layer entry configuration by ID.
   *
   * @param layerTree - The layer tree to start searching from
   * @param layerId - The layer ID or view ID to resolve
   * @returns The matching layer configuration or layer entry configuration, or undefined when not found
   */
  static findLayerById(
    layerTree: TypeGeoviewLayerConfig | undefined,
    layerId: string
  ): TypeGeoviewLayerConfig | TypeLayerEntryConfig | undefined {
    // If none
    if (!layerTree) return undefined;

    // The target id
    const targetId = layerId.split('/').pop();

    // If current
    if (layerTree.geoviewLayerId === targetId) return layerTree;

    // For each layer entries
    for (const layer of layerTree.listOfLayerEntryConfig) {
      const currentId = layer.layerId.split('/').pop();
      if (currentId === targetId) {
        return layer;
      }

      if (layer.listOfLayerEntryConfig) {
        // Go recursive as it's actually a TypeGeoviewLayerConfig, not a TypeLayerEntryConfig
        const found = UtilAddLayer.findLayerById(layer as unknown as TypeGeoviewLayerConfig, layerId);
        if (found) return found;
      }
    }

    // Not found
    return undefined;
  }

  /**
   * Finds a layer display name by ID.
   *
   * @param layerTree - The layer tree to start searching from
   * @param layerId - The layer ID or view ID to resolve
   * @returns The resolved layer name, or undefined when no matching layer is found
   */
  static findLayerNameById(layerTree: TypeGeoviewLayerConfig | undefined, layerId: string): string | undefined {
    const foundLayerEntry = UtilAddLayer.findLayerById(layerTree, layerId);
    // Using as ConfigClassOrType, because of the types confusion between class instance and regular object
    if (foundLayerEntry) return ConfigBaseClass.getClassOrTypeLayerName(foundLayerEntry);
    return undefined;
  }

  /**
   * Checks whether all sublayers of a group are included in the selected IDs.
   *
   * @param layerTree - The group layer or root layer entry to validate
   * @param layerIds - The selected layer IDs to compare against
   * @returns True when every descendant layer entry is included in the selection
   */
  static allSubLayersAreIncluded(
    layerTree: TypeGeoviewLayerConfig | TypeLayerEntryConfig | GroupLayerEntryConfigProps,
    layerIds: (string | undefined)[]
  ): boolean {
    const subLayers = layerTree.listOfLayerEntryConfig;
    if (!subLayers) return true; // No children to check

    return subLayers.every((layerEntryConfig) => {
      const layerIdIncluded = layerIds.includes(layerEntryConfig.layerId);

      // Recursively check if this entry has sublayers and if they are all included
      const allChildrenIncluded = UtilAddLayer.allSubLayersAreIncluded(layerEntryConfig, layerIds);

      return layerIdIncluded && allChildrenIncluded;
    });
  }

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
  static createLayerEntryConfigForGroupLayer(
    layerName: string,
    layerType: TypeInitialGeoviewLayerType,
    layerIds: string[],
    layersToAdd: (TypeGeoviewLayerConfig | TypeLayerEntryConfig)[],
    layerIdsToAdd: string[],
    removedLayerIds: string[],
    layerTree: TypeGeoviewLayerConfig,
    groupLayer: TypeGeoviewLayerConfig | GroupLayerEntryConfig | GroupLayerEntryConfigProps,
    allowCollapse = true
  ): LayerEntryConfigShell {
    // Casts
    const groupLayerAsLayerEntryConfig = groupLayer as GroupLayerEntryConfig;

    // The ID depending on the config type
    const groupLayerId = `${groupLayerAsLayerEntryConfig.layerId || (groupLayer as TypeGeoviewLayerConfig).geoviewLayerId}`;

    // Find the current group view id from the actual tree structure.
    const findLayerViewId = (entries: TypeLayerEntryConfig[], parentViewId?: string): string | undefined => {
      for (const entry of entries) {
        const entryViewId = `${parentViewId ? `${parentViewId}/` : ''}${entry.layerId}`;
        if (entry === groupLayerAsLayerEntryConfig) return entryViewId;
        if (entry.listOfLayerEntryConfig?.length) {
          const found = findLayerViewId(entry.listOfLayerEntryConfig, entryViewId);
          if (found) return found;
        }
      }
      return undefined;
    };

    const treeGroupViewId = findLayerViewId(layerTree.listOfLayerEntryConfig);
    const groupLayerViewId = treeGroupViewId || groupLayerId;

    // Add IDs of sublayers to the layerIdsToRemove array so they are not added multiple times
    const layerPathPrefix = `${groupLayerViewId}/`;
    const childLayerIdsToRemove = layerIdsToAdd.filter((layerId) => layerId.startsWith(layerPathPrefix));
    const groupedSelectionCount = childLayerIdsToRemove.length + 1;
    if (childLayerIdsToRemove.length) {
      removedLayerIds.push(...childLayerIdsToRemove);
    }

    // If all sub layers are included, simply add the layer
    if (allowCollapse && layerType === CONST_LAYER_TYPES.ESRI_DYNAMIC && UtilAddLayer.allSubLayersAreIncluded(groupLayer, layerIds)) {
      return {
        layerId: groupLayerAsLayerEntryConfig?.layerId,
        // If there is only one layer, or a single group layer, use the provided name from the text field
        layerName:
          layersToAdd.length === 1 || layersToAdd.length === groupedSelectionCount
            ? layerName
            : ConfigBaseClass.getClassOrTypeLayerName(groupLayer),
      };
    }

    // Not all sublayers are included, so we construct a group layer with the included sublayers
    const layerToAddEntryConfig = {
      layerId: `group-${groupLayerAsLayerEntryConfig?.layerId}`,
      isLayerGroup: true,
      entryType: 'group',
      // If there is only one layer, or a single group layer, use the provided name from the text field
      layerName:
        layersToAdd.length === 1 || layersToAdd.length === groupedSelectionCount
          ? layerName
          : ConfigBaseClass.getClassOrTypeLayerName(groupLayer),
      listOfLayerEntryConfig: groupLayer.listOfLayerEntryConfig
        .map((layerEntryConfig) => {
          if (layerEntryConfig.listOfLayerEntryConfig?.length && layerIds.includes(layerEntryConfig.layerId))
            return UtilAddLayer.createLayerEntryConfigForGroupLayer(
              layerName,
              layerType,
              layerIds,
              layersToAdd,
              layerIdsToAdd,
              removedLayerIds,
              layerTree,
              layerEntryConfig as GroupLayerEntryConfig,
              false
            );
          if (layerIds.includes(layerEntryConfig.layerId))
            return {
              layerId: layerEntryConfig?.layerId,
              layerName: layersToAdd.length === 1 ? layerName : ConfigBaseClass.getClassOrTypeLayerName(layerEntryConfig),
            };
          return undefined;
        })
        .filter((newEntryConfig) => newEntryConfig !== undefined),
    };

    return layerToAddEntryConfig;
  }

  /**
   * Builds a GeoView layer configuration from selected layer IDs.
   *
   * @param inputProps - The selected layer metadata and source tree context
   * @returns The map configuration layer entry to add to the map config
   */
  static buildGeoLayerToAdd(inputProps: BuildGeoViewLayerInput): MapConfigLayerEntry {
    const { layerIdsToAdd, layerName, layerType, layerURL, layerTree, isGeoCore } = inputProps;
    logger.logDebug(layerTree, layerIdsToAdd);

    // Generate layer id or keep id from geocore layer type
    const geoviewLayerId = isGeoCore ? layerTree.geoviewLayerId : generateId(18);

    if (layerType === 'shapefile') {
      return {
        geoviewLayerName: layerName,
        geoviewLayerId: geoviewLayerId,
        geoviewLayerType: 'shapefile',
        metadataAccessPath: layerURL,
      };
    }

    if (layerType === 'GeoPackage') {
      return {
        geoviewLayerName: layerName,
        geoviewLayerId: geoviewLayerId,
        geoviewLayerType: 'GeoPackage',
        metadataAccessPath: layerURL,
      };
    }

    const listOfLayerEntryConfig: LayerEntryConfigShell[] = [];
    const selectedLayers = layerIdsToAdd
      .map((layerViewId) => ({ layerViewId, layerToAdd: UtilAddLayer.findLayerById(layerTree, layerViewId) }))
      .filter(
        (selectedLayer): selectedLayer is { layerViewId: string; layerToAdd: TypeGeoviewLayerConfig | TypeLayerEntryConfig } =>
          !!selectedLayer.layerToAdd
      );
    const layersToAdd = selectedLayers.map((selectedLayer) => selectedLayer.layerToAdd);

    // If the layers to add is only 1 and it's already a group, go as-is
    if (layersToAdd.length === 1 && layersToAdd[0].listOfLayerEntryConfig?.length > 0) {
      // Return it
      return {
        geoviewLayerId: geoviewLayerId,
        geoviewLayerName: layerName,
        geoviewLayerType: layerType,
        metadataAccessPath: layerURL,
        listOfLayerEntryConfig: layersToAdd[0].listOfLayerEntryConfig,
      };
    }

    if (layersToAdd.length) {
      const removedLayerIds: string[] = [];
      const layerIds = layersToAdd.map((layerEntry) => ConfigBaseClass.getClassOrTypeLayerId(layerEntry)!);

      // Create an entry config shell for each layer if it is not in the removedLayerIds
      selectedLayers.forEach(({ layerViewId, layerToAdd }) => {
        // Casts
        const layerToAddAsGeoviewLayerConfig = layerToAdd as TypeGeoviewLayerConfig;
        const layerToAddAsLayerEntryConfig = layerToAdd as TypeLayerEntryConfig;

        // Skip if the layer is in the list of layer ids to be removed
        if (removedLayerIds.includes(layerViewId) || removedLayerIds.includes(layerToAddAsLayerEntryConfig.layerId)) return;

        // If it's a TypeGeoviewLayerConfig or a entry group
        if ((layerToAdd as TypeGeoviewLayerConfig).geoviewLayerId || layerToAddAsLayerEntryConfig.getEntryTypeIsGroup()) {
          // Create a group layer for the layers
          listOfLayerEntryConfig.push(
            UtilAddLayer.createLayerEntryConfigForGroupLayer(
              layerName,
              layerType,
              layerIds,
              layersToAdd,
              layerIdsToAdd,
              removedLayerIds,
              layerTree,
              layerToAddAsGeoviewLayerConfig
            )
          );
        } else {
          listOfLayerEntryConfig.push({
            layerId: layerToAddAsLayerEntryConfig?.layerId,
            layerName: layersToAdd.length === 1 ? layerName : layerToAddAsLayerEntryConfig?.getLayerName(),
          });
        }
      });
    }

    // If none, create one
    if (!listOfLayerEntryConfig.length)
      listOfLayerEntryConfig.push({
        layerId: layerIdsToAdd[0],
        layerName,
      });

    // Return it
    return {
      geoviewLayerId: geoviewLayerId,
      geoviewLayerName: layerName,
      geoviewLayerType: layerType,
      metadataAccessPath: layerURL,
      listOfLayerEntryConfig: listOfLayerEntryConfig as unknown as TypeLayerEntryConfig[],
    };
  }
}
