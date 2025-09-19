import { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import {
  CONST_LAYER_TYPES,
  CONST_LAYER_ENTRY_TYPES,
  GeoPackageLayerConfig,
  ShapefileLayerConfig,
  TypeGeoviewLayerType,
  TypeLayerEntryConfig,
  MapConfigLayerEntry,
  TypeGeoviewLayerConfig,
  ConfigClassOrType,
} from '@/api/types/layer-schema-types';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { GroupLayerEntryConfigProps } from '@/api/config/validation-classes/group-layer-entry-config';
import { generateId, getLocalizedMessage } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';

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

export class UtilAddLayer {
  /**
   * Returns an array of tuples representing available GeoView layer types and their localized display names.
   *
   * @param {TypeDisplayLanguage} language - The display language to use for localization.
   * @param {boolean} includeStatic - True if we need to include static image layers, false otherwise.
   * @returns {Array<[string, string]>} An array where each item is a tuple: [layerType, localizedName].
   */
  static getLocalizeLayerType(language: TypeDisplayLanguage, includeStatic: boolean): Array<[string, string]> {
    const { CSV, ESRI_DYNAMIC, ESRI_FEATURE, ESRI_IMAGE, GEOJSON, WMS, WFS, OGC_FEATURE, XYZ_TILES, VECTOR_TILES } = CONST_LAYER_TYPES;
    const { GEOCORE, GEOPACKAGE, SHAPEFILE } = CONST_LAYER_ENTRY_TYPES;
    const layerOptions: [string, string][] = [
      [CSV, getLocalizedMessage(language, 'layers.serviceCSV')],
      [SHAPEFILE, getLocalizedMessage(language, 'layers.serviceEsriShapefile')],
      [ESRI_DYNAMIC, getLocalizedMessage(language, 'layers.serviceEsriDynamic')],
      [ESRI_FEATURE, getLocalizedMessage(language, 'layers.serviceEsriFeature')],
      [ESRI_IMAGE, getLocalizedMessage(language, 'layers.serviceEsriImage')],
      [GEOJSON, getLocalizedMessage(language, 'layers.serviceGeoJSON')],
      [GEOPACKAGE, getLocalizedMessage(language, 'layers.serviceGeoPackage')],
      [WMS, getLocalizedMessage(language, 'layers.serviceOgcWMS')],
      [WFS, getLocalizedMessage(language, 'layers.serviceOgcWFS')],
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
   * Finds a layer entry config from an array with the given ID.
   * @param {TypeGeoviewLayerConfig | undefined} layerTree - The layer config to start searching from.
   * @param {string} layerId - The ID of the layer to find.
   * @returns The layer entry config of the found layer or null if none is found.
   */
  static getLayerById(
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
        const found = UtilAddLayer.getLayerById(layer as unknown as TypeGeoviewLayerConfig, layerId);
        if (found) return found;
      }
    }

    // Not found
    return undefined;
  }

  /**
   * Finds a layer name from an array of layer entry configs with the given ID.
   * @param {TypeGeoviewLayerConfig | undefined} layerTree - The layer config to start searching from.
   * @param {string} layerId - The ID of the layer to find.
   * @returns The name of the layer or undefined if none is found.
   */
  static getLayerNameById(layerTree: TypeGeoviewLayerConfig | undefined, layerId: string): string | undefined {
    const foundLayerEntry = UtilAddLayer.getLayerById(layerTree, layerId);
    // Using as ConfigClassOrType, because of the types confusion between class instance and regular object
    if (foundLayerEntry) return ConfigBaseClass.getClassOrTypeLayerName(foundLayerEntry as ConfigClassOrType);
    return undefined;
  }

  /**
   * Checks if all of a groups sublayers are to be added to the map.
   * @param {TypeGeoviewLayerConfig} layerTree - The group layer to check
   * @param {string[]} layerIds - The la
   * @returns {boolean} Whether or not all of the sublayers are included
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
   * Creates a layer entry config shell for a group layer.
   * @param {GroupLayerEntryConfig} groupLayer - The group layer
   * @returns {LayerEntryConfigShell} The resulting layer entry config shell
   */
  static createLayerEntryConfigForGroupLayer(
    layerName: string,
    layerType: string,
    layerIds: string[],
    layersToAdd: (TypeGeoviewLayerConfig | TypeLayerEntryConfig)[],
    layerIdsToAdd: string[],
    removedLayerIds: string[],
    groupLayer: TypeGeoviewLayerConfig | GroupLayerEntryConfigProps
  ): LayerEntryConfigShell {
    // Casts
    const groupLayerAsGeoviewLayerConfig = groupLayer as TypeGeoviewLayerConfig;
    const groupLayerAsLayerEntryConfig = groupLayer as GroupLayerEntryConfigProps;

    // The ID depending on the config type
    const groupLayerId = `${groupLayerAsLayerEntryConfig.layerId || groupLayerAsGeoviewLayerConfig.geoviewLayerId}`;

    // Add IDs of sublayers to the layerIdsToRemove array so they are not added multiple times
    const longLayerIdsToRemove = layerIdsToAdd.filter((layerId) => layerId.split('/').includes(groupLayerId));
    if (longLayerIdsToRemove.length) {
      const layerIdsToRemove = longLayerIdsToRemove.map((layerId) => layerId.split('/').pop()).filter((id) => id !== undefined);
      removedLayerIds.push(...layerIdsToRemove);
    }

    // If all sub layers are included, simply add the layer
    if (layerType === CONST_LAYER_TYPES.ESRI_DYNAMIC && UtilAddLayer.allSubLayersAreIncluded(groupLayer, layerIds)) {
      return {
        layerId: groupLayerAsLayerEntryConfig?.layerId,
        layerName: layersToAdd.length === 1 ? layerName : groupLayerAsLayerEntryConfig?.layerName,
      };
    }

    // Not all sublayers are included, so we construct a group layer with the included sublayers
    const layerToAddEntryConfig = {
      layerId: `group-${groupLayerAsLayerEntryConfig?.layerId}`,
      isLayerGroup: true,
      entryType: 'group',
      layerName: layersToAdd.length === 1 ? layerName : groupLayerAsLayerEntryConfig?.layerName,
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
              ConfigBaseClass.getClassOrTypeGeoviewLayerConfig(layerEntryConfig)
            );
          if (layerIds.includes(layerEntryConfig.layerId))
            return {
              layerId: layerEntryConfig?.layerId,
              layerName: layersToAdd.length === 1 ? layerName : layerEntryConfig?.getLayerName(),
            };
          return undefined;
        })
        .filter((newEntryConfig) => newEntryConfig !== undefined),
    };

    return layerToAddEntryConfig;
  }

  /**
   * Builds a geoview layer config from provided layer IDs.
   * @param {BuildGeoViewLayerInput} inputProps - The layer information
   * @returns {MapConfigLayerEntry} The geoview layer config
   */
  static buildGeoLayerToAdd(inputProps: BuildGeoViewLayerInput): MapConfigLayerEntry {
    const { layerIdsToAdd, layerName, layerType, layerURL, layerTree } = inputProps;
    logger.logDebug(layerTree, layerIdsToAdd);

    if (layerType === 'shapefile') {
      return {
        geoviewLayerName: layerName,
        geoviewLayerId: generateId(18),
        geoviewLayerType: 'shapefile',
        metadataAccessPath: layerURL,
      } as ShapefileLayerConfig;
    }

    if (layerType === 'GeoPackage') {
      return {
        geoviewLayerName: layerName,
        geoviewLayerId: generateId(18),
        geoviewLayerType: 'GeoPackage',
        metadataAccessPath: layerURL,
      } as GeoPackageLayerConfig;
    }

    const listOfLayerEntryConfig: LayerEntryConfigShell[] = [];
    const layersToAdd = layerIdsToAdd.map((layerId) => UtilAddLayer.getLayerById(layerTree, layerId)).filter((layerToAdd) => !!layerToAdd);

    // If the layers to add is only 1 and it's already a group, go as-is
    if (layersToAdd.length === 1 && layersToAdd[0].listOfLayerEntryConfig?.length > 0) {
      // Return it
      return {
        geoviewLayerId: generateId(18),
        geoviewLayerName: layerName,
        geoviewLayerType: layerType as TypeGeoviewLayerType,
        metadataAccessPath: layerURL,
        listOfLayerEntryConfig: layersToAdd[0].listOfLayerEntryConfig as unknown as TypeLayerEntryConfig[],
      };
    }

    if (layersToAdd.length) {
      const removedLayerIds: string[] = [];
      const layerIds = layerIdsToAdd.map((layerId) => layerId.split('/').pop()!);

      // Create an entry config shell for each layer if it is not in the removedLayerIds
      layersToAdd.forEach((layerToAdd) => {
        // Casts
        const layerToAddAsGeoviewLayerConfig = layerToAdd as TypeGeoviewLayerConfig;
        const layerToAddAsLayerEntryConfig = layerToAdd as TypeLayerEntryConfig;

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
              layerToAddAsGeoviewLayerConfig
            )
          );
        } else if (!removedLayerIds.includes(layerToAddAsLayerEntryConfig.layerId)) {
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
        layerId: generateId(8),
        layerName,
      });

    // Return it
    return {
      geoviewLayerId: generateId(18),
      geoviewLayerName: layerName,
      geoviewLayerType: layerType as TypeGeoviewLayerType,
      metadataAccessPath: layerURL,
      listOfLayerEntryConfig: listOfLayerEntryConfig as unknown as TypeLayerEntryConfig[],
    };
  }
}
