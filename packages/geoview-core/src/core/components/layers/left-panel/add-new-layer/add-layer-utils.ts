import { GroupLayerEntryConfig, MapFeatureConfig, TypeGeoviewLayerType, TypeGeoviewLayerConfig } from '@/api/config/types/map-schema-types';
import { Cast, toJsonObject } from '@/api/config/types/config-types';
import { generateId } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import { CV_CONST_LAYER_TYPES } from '@/api/config/types/config-constants';

type BuildGeoViewLayerInput = {
  layerIdsToAdd: string[];
  layerName: string;
  layerType: string;
  layerURL: string;
  layerList: GroupLayerEntryConfig[];
};

type LayerEntryConfigShell = {
  layerId: string;
  layerName: string | undefined;
  listOfLayerEntryConfig?: LayerEntryConfigShell[];
};

/**
 * Finds a layer entry config from an array with the given ID.
 * @param {GroupLayerEntryConfig[]} layerList - The array of layerEntryConfigs.
 * @param {string} layerId - The ID of the layer to find.
 * @returns The layer entry config of the found layer or null if none is found.
 */
export const getLayerById = (layerList: GroupLayerEntryConfig[], layerId: string): GroupLayerEntryConfig | null => {
  const layer = layerList.find((childLayer) => childLayer.layerId.split('/').pop() === layerId.split('/').pop());
  if (layer) return layer as GroupLayerEntryConfig;

  let foundLayer: GroupLayerEntryConfig | null = null;
  for (let i = 0; i < layerList.length; i++) {
    const branch = layerList[i];
    if (branch.listOfLayerEntryConfig) {
      foundLayer = getLayerById(branch.listOfLayerEntryConfig as GroupLayerEntryConfig[], layerId);
    }
    if (foundLayer) break;
  }

  return foundLayer;
};

/**
 * Finds a layer name from an array of layer entry configs with the given ID.
 * @param {GroupLayerEntryConfig[]} layersList - The array of layerEntryConfigs.
 * @param {string} layerId - The ID of the layer to find.
 * @returns The name of the layer or undefined if none is found.
 */
export const getLayerNameById = (layersList: GroupLayerEntryConfig[], layerId: string): string | undefined => {
  return getLayerById(layersList, layerId)?.layerName;
};

/**
 * Checks if all of a groups sublayers are to be added to the map.
 * @param {GroupLayerEntryConfig} groupLayer - The group layer to check
 * @param {string[]} layerIds - The la
 * @returns {boolean} Whether or not all of the sublayers are included
 */
const allSubLayersAreIncluded = (groupLayer: GroupLayerEntryConfig, layerIds: (string | undefined)[]): boolean => {
  return groupLayer.listOfLayerEntryConfig.every((layerEntryConfig) =>
    !layerEntryConfig.isLayerGroup
      ? layerIds.includes(layerEntryConfig.layerId)
      : layerIds.includes(layerEntryConfig.layerId) && allSubLayersAreIncluded(layerEntryConfig as GroupLayerEntryConfig, layerIds)
  );
};

/**
 * Builds a geoview layer config from provided layer IDs.
 * @param {BuildGeoViewLayerInput} inputProps - The layer information
 * @returns {TypeGeoviewLayerConfig} The geoview layer config
 */
export const buildGeoLayerToAdd = (inputProps: BuildGeoViewLayerInput): TypeGeoviewLayerConfig => {
  const { layerIdsToAdd, layerName, layerType, layerURL, layerList } = inputProps;
  logger.logDebug(layerList, layerIdsToAdd);

  const listOfLayerEntryConfig: LayerEntryConfigShell[] = [];
  const layersToAdd = layerIdsToAdd.map((layerId) => getLayerById(layerList, layerId)).filter((layerToAdd) => !!layerToAdd);

  if (layersToAdd.length) {
    const removedLayerIds: string[] = [];
    const layerIds = layerIdsToAdd.map((layerId) => layerId.split('/').pop());

    /**
     * Creates a layer entry config shell for a group layer.
     * @param {GroupLayerEntryConfig} groupLayer - The group layer
     * @returns {LayerEntryConfigShell} The resulting layer entry config shell
     */
    const createLayerEntryConfigForGroupLayer = (groupLayer: GroupLayerEntryConfig): LayerEntryConfigShell => {
      // Add IDs of sublayers to the layerIdsToRemove array so they are not added multiple times
      const longLayerIdsToRemove = layerIdsToAdd.filter((layerId) => layerId.split('/').includes(groupLayer.layerId));
      if (longLayerIdsToRemove.length) {
        const layerIdsToRemove = longLayerIdsToRemove.map((layerId) => layerId.split('/').pop()).filter((id) => id !== undefined);
        removedLayerIds.push(...layerIdsToRemove);
      }

      // If all sub layers are included, simply add the layer
      if (allSubLayersAreIncluded(groupLayer, layerIds) && layerType === CV_CONST_LAYER_TYPES.ESRI_DYNAMIC) {
        return {
          layerId: groupLayer?.layerId,
          layerName: layersToAdd.length === 1 ? layerName : groupLayer?.layerName,
        };
      }

      // Not all sublayers are included, so we construct a group layer with the included sublayers
      const layerToAddEntryConfig = {
        layerId: `group-${groupLayer?.layerId}`,
        isLayerGroup: true,
        entryType: 'group',
        layerName: layersToAdd.length === 1 ? layerName : groupLayer?.layerName,
        listOfLayerEntryConfig: groupLayer.listOfLayerEntryConfig
          .map((layerEntryConfig) => {
            if (layerEntryConfig.isLayerGroup && layerIds.includes(layerEntryConfig.layerId))
              return createLayerEntryConfigForGroupLayer(layerEntryConfig as GroupLayerEntryConfig);
            if (layerIds.includes(layerEntryConfig.layerId))
              return {
                layerId: layerEntryConfig?.layerId,
                layerName: layersToAdd.length === 1 ? layerName : layerEntryConfig?.layerName,
              };
            return undefined;
          })
          .filter((newEntryConfig) => newEntryConfig !== undefined),
      };

      return layerToAddEntryConfig;
    };

    // Create an entry config shell for each layer if it is not in the removedLayerIds
    layersToAdd.forEach((layerToAdd) => {
      if (layerToAdd.isLayerGroup && !removedLayerIds.includes(layerToAdd.layerId)) {
        listOfLayerEntryConfig.push(createLayerEntryConfigForGroupLayer(layerToAdd));
      } else if (!removedLayerIds.includes(layerToAdd.layerId)) {
        listOfLayerEntryConfig.push({
          layerId: layerToAdd?.layerId,
          layerName: layersToAdd.length === 1 ? layerName : layerToAdd?.layerName,
        });
      }
    });
  }

  if (!listOfLayerEntryConfig.length)
    listOfLayerEntryConfig.push({
      layerId: generateId(8),
      layerName,
    });

  const geoviewLayerConfig = MapFeatureConfig.nodeFactory(
    toJsonObject({
      geoviewLayerId: generateId(),
      geoviewLayerName: layerName,
      geoviewLayerType: layerType as TypeGeoviewLayerType,
      metadataAccessPath: layerURL,
      listOfLayerEntryConfig,
    })
  );

  return Cast<TypeGeoviewLayerConfig>(geoviewLayerConfig!);
};
