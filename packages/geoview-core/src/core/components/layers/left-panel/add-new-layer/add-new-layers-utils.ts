import { GroupLayerEntryConfig, TypeGeoviewLayerType, TypeLocalizedString } from '@/api/config/types/map-schema-types';
import { createLocalizedString, generateId } from '@/core/utils/utilities';
import { TypeGeoviewLayerConfig } from '@/geo/map/map-schema-types';

type ListOfLayerEntry = {
  layerId: string;
  layerName?: TypeLocalizedString;
  entryType?: string;
  listOfLayerEntryConfig?: ListOfLayerEntry[];
};
type GeoViewLayerToAdd = {
  geoviewLayerId: string;
  geoviewLayerName: TypeLocalizedString;
  geoviewLayerType: TypeGeoviewLayerType;
  metadataAccessPath: TypeLocalizedString;
  listOfLayerEntryConfig: ListOfLayerEntry[];
};

type BuildGeoViewLayerInput = {
  layerIdsToAdd: string[];
  layerName: string;
  layerType: string;
  layerURL: string;
  layersList: GroupLayerEntryConfig[];
};

const getLayerNameById = (layersList: GroupLayerEntryConfig[], layerId: string): string | null | undefined => {
  function searchBranchForLayer(branchGroup: GroupLayerEntryConfig): string | null | undefined {
    if (branchGroup.layerId === layerId) return branchGroup.layerName;

    const layer = branchGroup.listOfLayerEntryConfig?.find((childLayer) => childLayer.layerId === layerId);
    if (layer) return layer.layerName;
    if (branchGroup.listOfLayerEntryConfig) {
      let foundName = null;
      for (let i = 0; i < branchGroup.listOfLayerEntryConfig.length; i++) {
        const layer2 = branchGroup.listOfLayerEntryConfig[i] as GroupLayerEntryConfig;
        if (layer2.listOfLayerEntryConfig) {
          const name = searchBranchForLayer(layer2 as GroupLayerEntryConfig);
          if (name) {
            foundName = name;
            break;
          }
        }
      }
      return foundName;
    }
    return null;
  }

  for (let i = 0; i < layersList.length; i++) {
    const layer = layersList[i];
    const name = searchBranchForLayer(layer);
    if (name) return name;
  }

  return null;
};

export const buildGeoLayerToAdd = function (inputProps: BuildGeoViewLayerInput): TypeGeoviewLayerConfig {
  const { layerIdsToAdd, layerName, layerType, layerURL, layersList } = inputProps;

  const geoviewLayerConfig: GeoViewLayerToAdd = {
    geoviewLayerId: generateId(),
    geoviewLayerName: createLocalizedString(layerName),
    geoviewLayerType: layerType as TypeGeoviewLayerType,
    metadataAccessPath: createLocalizedString(layerURL),
    listOfLayerEntryConfig: [],
  };

  function appendChildLayerNode(treeRoot: ListOfLayerEntry, layerId: string, parentLayerId: string) {
    if (treeRoot.layerId === parentLayerId) {
      // eslint-disable-next-line no-param-reassign
      treeRoot.entryType = 'group';
      // eslint-disable-next-line no-param-reassign
      treeRoot.layerName = createLocalizedString(getLayerNameById(layersList, treeRoot.layerId) ?? 'unknown');
      if (!treeRoot.listOfLayerEntryConfig) {
        // eslint-disable-next-line no-param-reassign
        treeRoot.listOfLayerEntryConfig = [];
      }
      treeRoot.listOfLayerEntryConfig.push({ layerId });
      return;
    }

    if (treeRoot.listOfLayerEntryConfig) {
      for (let i = 0; i < treeRoot.listOfLayerEntryConfig.length; i++) {
        const layer = treeRoot.listOfLayerEntryConfig[i] as ListOfLayerEntry;
        if (layer.listOfLayerEntryConfig) {
          appendChildLayerNode(layer, layerId, parentLayerId);
        }
      }
    }
  }

  function addRootLayerNode(layerId: string) {
    const exists = geoviewLayerConfig.listOfLayerEntryConfig.find((entry) => entry.layerId === layerId);
    if (exists) return;
    geoviewLayerConfig.listOfLayerEntryConfig.push({ layerId });
  }

  layerIdsToAdd.forEach((layerId) => {
    const layerTokens = layerId.split('/');
    layerTokens.forEach((layerToken, index) => {
      if (index === 0) {
        addRootLayerNode(layerToken);
      } else {
        geoviewLayerConfig.listOfLayerEntryConfig.forEach((entry) => {
          appendChildLayerNode(entry, layerToken, layerTokens[index - 1]);
        });
      }
    });
  });

  return geoviewLayerConfig as unknown as TypeGeoviewLayerConfig;
};