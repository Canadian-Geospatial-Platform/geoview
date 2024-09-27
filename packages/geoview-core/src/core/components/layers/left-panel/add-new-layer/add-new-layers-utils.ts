import { Cast, toJsonObject } from '@config/types/config-types';
import {
  EntryConfigBaseClass,
  GroupLayerEntryConfig,
  MapFeatureConfig,
  TypeDisplayLanguage,
  TypeGeoviewLayerType,
} from '@config/types/map-schema-types';
import { layerEntryIsGroupLayer } from '@config/types/type-guards';
import { createLocalizedString, generateId } from '@/core/utils/utilities';
import { TypeGeoviewLayerConfig } from '@/geo/map/map-schema-types';
import { logger } from '@/core/utils/logger';
import { TypeJsonArray, TypeJsonObject } from '@/app';

type BuildGeoViewLayerInput = {
  layerIdsToAdd: string[];
  layerName: string;
  layerType: string;
  layerURL: string;
  layersList: GroupLayerEntryConfig[];
  language: TypeDisplayLanguage;
};

export const getLayerById = (layersList: GroupLayerEntryConfig[], layerId: string): GroupLayerEntryConfig | null | undefined => {
  function searchBranchForLayer(branchGroup: GroupLayerEntryConfig): GroupLayerEntryConfig | null | undefined {
    if (branchGroup.layerId === layerId) return branchGroup;

    const layer = branchGroup.listOfLayerEntryConfig?.find((childLayer) => childLayer.layerId === layerId);

    if (layer) return layer as GroupLayerEntryConfig;

    if (branchGroup.listOfLayerEntryConfig) {
      let foundLayer: GroupLayerEntryConfig | null = null;

      for (let i = 0; i < branchGroup.listOfLayerEntryConfig.length; i++) {
        const layer2 = branchGroup.listOfLayerEntryConfig[i] as GroupLayerEntryConfig;

        if (layer2.listOfLayerEntryConfig) {
          const name = searchBranchForLayer(layer2 as GroupLayerEntryConfig);

          if (name) {
            foundLayer = name;
            break;
          }
        }
      }

      return foundLayer;
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

export const getLayerNameById = (layersList: GroupLayerEntryConfig[], layerId: string): string | null | undefined => {
  return getLayerById(layersList, layerId)?.layerName;
};

export const buildGeoLayerToAdd = (inputProps: BuildGeoViewLayerInput): TypeGeoviewLayerConfig => {
  const { layerIdsToAdd, layerName, layerType, layerURL, layersList, language } = inputProps;
  logger.logDebug(layersList);

  // If a non empty layer tree is provided, get the geoview layer that contains it, otherwise create the geoview layer using
  // the parameters provided.
  const geoviewLayerConfig = layersList?.length
    ? layersList[0].getGeoviewLayerConfig()
    : MapFeatureConfig.nodeFactory(
        toJsonObject({
          geoviewLayerId: generateId(),
          geoviewLayerType: layerType as TypeGeoviewLayerType,
          metadataAccessPath: createLocalizedString(layerURL),
          listOfLayerEntryConfig: layerName ? [{ layerId: layerName, layerName: createLocalizedString(layerName) }] : [],
        }),
        language
      );
  geoviewLayerConfig!.geoviewLayerName = layerName;

  if (layersList?.length) {
    layerIdsToAdd.forEach((layerPath) => {
      const pathItems = layerPath.split('/');
      // get the layer node selected from the layer tree. We search from the root of the tree (layersList[0]).
      const layerNode = layersList[0].getSubLayerConfig(layerPath);
      // If it is a group layer, create it by cloning each node 0f the path if it is not already created.
      if (layerEntryIsGroupLayer(layerNode!)) {
        // Search the current node in the geoview layer.
        pathItems.forEach((nodeId, i) => {
          const groupNode = geoviewLayerConfig?.getSubLayerConfig(
            `${geoviewLayerConfig.geoviewLayerId}/${pathItems.slice(0, i + 1).join('/')}`
          );
          // if it is not already created, create it.
          if (!groupNode) {
            // If we are at the top of the tree (index i = 0) ...
            if (i === 0) {
              // Get a copy of the group and erase its list of layer entry config.
              const groupLayerToUse = layersList[0].getSubLayerConfig(nodeId)?.clone() as GroupLayerEntryConfig;
              // Insert the copy in the geoview list of layer entry config
              geoviewLayerConfig?.listOfLayerEntryConfig.push(groupLayerToUse as EntryConfigBaseClass);
            } else {
              // Get the parent group node list of sub-layers.
              const parentLayerGroup = Cast<GroupLayerEntryConfig>(
                geoviewLayerConfig?.getSubLayerConfig(`${geoviewLayerConfig.geoviewLayerId}/${pathItems.slice(0, i).join('/')}`)
              );
              // Get a copy of the group and erase its list of layer entry config.
              const groupLayerToUse = layersList[0]
                .getSubLayerConfig(pathItems.slice(0, i + 1).join('/'))!
                .clone(parentLayerGroup) as GroupLayerEntryConfig;
              // Insert the copy in the parent list of layer entry config
              parentLayerGroup.listOfLayerEntryConfig.push(groupLayerToUse as EntryConfigBaseClass);
            }
          }
        });
      } else {
        // The layer is not a group. Get the parent group node list of sub-layers. If we cannot find it,
        // use the geoview list of sub-layers.
        let parentLayerGroup: GroupLayerEntryConfig | undefined;
        for (let i = 1; i < pathItems.length && !parentLayerGroup; i++) {
          parentLayerGroup = Cast<GroupLayerEntryConfig>(
            geoviewLayerConfig?.getSubLayerConfig(
              `${geoviewLayerConfig.geoviewLayerId}/${pathItems.slice(0, pathItems.length - i).join('/')}`
            )
          );
        }
        const parentLayerGroupArray = parentLayerGroup?.listOfLayerEntryConfig || geoviewLayerConfig?.listOfLayerEntryConfig;
        // Insert a copy of the current node in the parent list of layer entry config
        parentLayerGroupArray!.push(layerNode!.clone(parentLayerGroup));
      }
    });

    const removeUnselectedGroups = (listOfLayerEntryConfig: EntryConfigBaseClass[]): EntryConfigBaseClass[] => {
      return listOfLayerEntryConfig.reduce((newList, subLayer) => {
        if (layerEntryIsGroupLayer(subLayer)) {
          const listOfNodes = removeUnselectedGroups(subLayer.listOfLayerEntryConfig);
          const pathItems = subLayer.getLayerPath().split('/');
          const nodePath = pathItems.slice(1).join('/');
          if (!layerIdsToAdd.includes(nodePath)) {
            listOfNodes.forEach((node) => {
              newList.push(node);
            });
          } else newList.push(subLayer);
        } else newList.push(subLayer);
        return newList;
      }, [] as EntryConfigBaseClass[]);
    };
    geoviewLayerConfig!.listOfLayerEntryConfig = removeUnselectedGroups(geoviewLayerConfig!.listOfLayerEntryConfig!);
  }

  // GV: The following section of code must be deleted when the layer API will be able to consume the new config
  // GV: Beginning of the temporary code
  const patchForTheListOfLayerEntryConfig = (listOfLayerEntryConfig: EntryConfigBaseClass[]): EntryConfigBaseClass[] => {
    return Cast<EntryConfigBaseClass[]>(
      listOfLayerEntryConfig.map((layer) => {
        if (layerEntryIsGroupLayer(layer)) {
          const groupLayerToUse = {
            layerId: layer.layerId,
            layerName: createLocalizedString(layer.layerName!),
            isLayerGroup: layer.isLayerGroup,
            entryType: 'group',
            listOfLayerEntryConfig: patchForTheListOfLayerEntryConfig(layer.listOfLayerEntryConfig!),
          };
          return groupLayerToUse;
        }

        const leafToUse = toJsonObject(layer);
        leafToUse.schemaTag = Cast<TypeJsonObject>(geoviewLayerConfig?.geoviewLayerType);
        if (leafToUse.layerName) leafToUse.layerName = toJsonObject(createLocalizedString(layer.layerName!));
        if (leafToUse.source) {
          const { source } = leafToUse;
          if ('maxRecordCount' in source) delete source.maxRecordCount;
          if ('layerFilter' in source) leafToUse.layerFilter = source.layerFilter;
          delete leafToUse.maxRecordCount;
          if ('projection' in source) {
            source.dataProjection = source.projection;
            delete source.projection;
          }
          if (!source.dataAccessPath) {
            if (!geoviewLayerConfig!.metadataAccessPath.toLowerCase().endsWith('.xml'))
              if (geoviewLayerConfig!.metadataAccessPath.toLowerCase().endsWith('.meta')) {
                const metadataAccessPathItems = geoviewLayerConfig!.metadataAccessPath.split('/');
                source.dataAccessPath = Cast<TypeJsonObject>(
                  createLocalizedString(metadataAccessPathItems.slice(0, metadataAccessPathItems.length - 1).join('/'))
                );
              } else source.dataAccessPath = Cast<TypeJsonObject>(createLocalizedString(geoviewLayerConfig!.metadataAccessPath));
          }
          // ===================================================================================================
          if (source.featureInfo) {
            const { featureInfo } = source;
            if ('nameField' in featureInfo) featureInfo.nameField = toJsonObject(createLocalizedString(featureInfo.nameField));
            if (featureInfo?.outfields?.length) {
              if (featureInfo.outfields[0].type)
                featureInfo.fieldTypes = (featureInfo.outfields as TypeJsonArray)
                  .map((item) => {
                    return item.type;
                  })
                  .join(',') as TypeJsonObject;
              if (featureInfo.outfields[0].alias)
                featureInfo.aliasFields = toJsonObject(
                  createLocalizedString(
                    (featureInfo.outfields as TypeJsonArray)
                      .map((item) => {
                        return item.alias;
                      })
                      .join(',')
                  )
                );
              if (featureInfo.outfields[0].name)
                featureInfo.outfields = toJsonObject(
                  createLocalizedString(
                    (featureInfo.outfields as TypeJsonArray)
                      .map((item) => {
                        return item.name;
                      })
                      .join(',')
                  )
                );
            }
            leafToUse.source.dataProjection = leafToUse.source.projection;
            delete leafToUse.source.projection;
          }
        }
        // =====================================================================================================
        if (leafToUse.style) {
          const { style } = leafToUse;
          const geometryStyle = {} as TypeJsonObject;
          const geometryType = (leafToUse.geometryType as string) === 'linestring' ? 'LineString' : (leafToUse.geometryType as string);
          style[`${geometryType.slice(0, 1).toUpperCase()}${geometryType.slice(1)}`] = geometryStyle;
          if (style.type === 'simple') {
            geometryStyle.styleType = 'simple' as TypeJsonObject;
            geometryStyle.label = style?.info?.label;
            geometryStyle.settings = style?.info[0]?.settings;
          } else if (style.type === 'uniqueValue') {
            geometryStyle.styleType = 'uniqueValue' as TypeJsonObject;
            geometryStyle.fields = style?.fields;
            const defaultIndex = (style.info.length as number) - 1;
            (geometryStyle.uniqueValueStyleInfo as TypeJsonArray) = (
              (style.info as TypeJsonArray).slice(0, style.hasDefault ? defaultIndex : undefined) as TypeJsonArray
            ).map((item) => {
              return {
                label: item.label,
                visible: item.visible,
                values: item.values,
                settings: item.settings,
              };
            }) as TypeJsonArray;
            if (style.hasDefault) {
              geometryStyle.defaultLabel = (style.info as TypeJsonArray)[defaultIndex].label;
              geometryStyle.defaultVisible = (style.info as TypeJsonArray)[defaultIndex].visible;
              geometryStyle.defaultSettings = (style.info as TypeJsonArray)[defaultIndex].settings;
            }
          } else {
            geometryStyle.styleType = 'classBreaks' as TypeJsonObject;
            geometryStyle.fields = style?.fields[0];
            const defaultIndex = (style.info.length as number) - 1;
            (geometryStyle.classBreakStyleInfo as TypeJsonArray) = (
              (style.info as TypeJsonArray).slice(0, style.hasDefault ? defaultIndex : undefined) as TypeJsonArray
            ).map((item) => {
              return {
                label: item.label,
                visible: item.visible,
                minValue: (item.values as TypeJsonArray)[0],
                miaxValue: (item.values as TypeJsonArray)[1],
                settings: item.settings,
              };
            }) as TypeJsonArray;
            if (leafToUse.hasDefault) {
              geometryStyle.defaultLabel = (style.info as TypeJsonArray)[defaultIndex].label;
              geometryStyle.defaultVisible = (style.info as TypeJsonArray)[defaultIndex].visible;
              geometryStyle.defaultSettings = (style.info as TypeJsonArray)[defaultIndex].settings;
            }
          }
          delete style.type;
          delete style.info;
          delete style.fields;
          delete style.hasDefault;
        }
        return leafToUse;
      })
    );
  };
  geoviewLayerConfig!.listOfLayerEntryConfig = patchForTheListOfLayerEntryConfig(geoviewLayerConfig!.listOfLayerEntryConfig);
  geoviewLayerConfig!.metadataAccessPath = Cast<string>(createLocalizedString(geoviewLayerConfig!.metadataAccessPath));
  // GV: End of temporary code

  return Cast<TypeGeoviewLayerConfig>(geoviewLayerConfig!);
};
