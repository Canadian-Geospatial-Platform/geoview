import { TypeLegendResultsSetEntry } from '@/api/events/payloads';
import {
  isClassBreakStyleConfig,
  isImageStaticLegend,
  isSimpleStyleConfig,
  isUniqueValueStyleConfig,
  isVectorLegend,
  isWmsLegend,
  layerEntryIsGroupLayer,
  TypeGeoviewLayerType,
  TypeLegend,
  TypeStyleGeometry,
} from '@/geo';
import { TypeLegendLayer, TypeLegendLayerIcons, TypeLegendLayerItem, TypeLegendItem } from '@/core/components/layers/types';
import { api, getLocalizedValue, ILayerState } from '@/app';
import { delay } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';

import { AbstractEventProcessor } from '../abstract-event-processor';

export class LegendEventProcessor extends AbstractEventProcessor {
  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  //! Typescript MUST always use the defined store actions below to modify store - NEVER use setState!
  //! Some action does state modifications AND map actions.
  //! ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

  // #region
  // Indicate if the processor has been propagated once yet
  private static propagatedOnce = false;

  // The time delay before selecting a layer in the store upon first legend propagation.
  // The longer the delay, the more chances layers will be loaded state at the time of picking a layer to be selected.
  // The longer the delay, the later a layer will be selected in the store upon initial propagation.
  private static timeDelayBeforeSelectingLayerInStore = 2000;

  /**
   * Shortcut to get the Layer state for a given map id
   * @param {string} mapId The mapId
   * @returns {ILayerState} The Layer state
   */
  protected static getLayerState(mapId: string): ILayerState {
    // Return the layer state
    return super.getState(mapId).layerState;
  }

  private static getLayerIconImage(mapId: string, layerPath: string, layerLegend: TypeLegend | null): TypeLegendLayerIcons | undefined {
    const iconDetails: TypeLegendLayerIcons = [];
    if (layerLegend) {
      if (layerLegend.legend === null) {
        if (layerLegend.styleConfig === null) iconDetails[0] = { iconImage: 'config not found' };
        else if (layerLegend.styleConfig === undefined) iconDetails[0] = { iconImage: 'undefined style config' };
      } else if (Object.keys(layerLegend.legend).length === 0) iconDetails[0] = { iconImage: 'no data' };
      else if (isWmsLegend(layerLegend) || isImageStaticLegend(layerLegend)) {
        iconDetails[0].iconType = 'simple';
        iconDetails[0].iconImage = layerLegend.legend ? layerLegend.legend.toDataURL() : '';
      } else if (isVectorLegend(layerLegend)) {
        Object.entries(layerLegend.legend).forEach(([key, styleRepresentation]) => {
          const geometryType = key as TypeStyleGeometry;
          const styleSettings = layerLegend.styleConfig![geometryType]!;
          const iconDetailsEntry: TypeLegendLayerItem = {};
          iconDetailsEntry.geometryType = geometryType;

          if (isSimpleStyleConfig(styleSettings)) {
            iconDetailsEntry.iconType = 'simple';
            iconDetailsEntry.iconImage = (styleRepresentation.defaultCanvas as HTMLCanvasElement).toDataURL();
            iconDetailsEntry.name = styleSettings.label;

            // TODO Adding icons list, to be verified by backend devs
            const legendLayerListItem: TypeLegendItem = {
              geometryType,
              icon: iconDetailsEntry.iconImage,
              name: iconDetailsEntry.name,
              isVisible: 'yes',
              default: true,
            };
            iconDetailsEntry.iconList = [legendLayerListItem];
            iconDetails.push(iconDetailsEntry);
          } else {
            iconDetailsEntry.iconType = 'list';
            if (isClassBreakStyleConfig(styleSettings)) {
              iconDetailsEntry.iconList = styleRepresentation.arrayOfCanvas!.map((canvas, i) => {
                const legendLayerListItem: TypeLegendItem = {
                  geometryType,
                  icon: canvas ? canvas.toDataURL() : null,
                  name: styleSettings.classBreakStyleInfo[i].label,
                  isVisible: styleSettings.classBreakStyleInfo[i].visible!,
                  default: false,
                };
                return legendLayerListItem;
              });
              if (styleRepresentation.defaultCanvas) {
                const legendLayerListItem: TypeLegendItem = {
                  geometryType,
                  icon: styleRepresentation.defaultCanvas.toDataURL(),
                  name: styleSettings.defaultLabel!,
                  isVisible: styleSettings.defaultVisible!,
                  default: true,
                };
                iconDetailsEntry.iconList.push(legendLayerListItem);
              }
            } else if (isUniqueValueStyleConfig(styleSettings)) {
              iconDetailsEntry.iconList = styleRepresentation.arrayOfCanvas!.map((canvas, i) => {
                const legendLayerListItem: TypeLegendItem = {
                  geometryType,
                  icon: canvas ? canvas.toDataURL() : null,
                  name: styleSettings.uniqueValueStyleInfo[i].label,
                  isVisible: styleSettings.uniqueValueStyleInfo[i].visible || 'yes',
                  default: false,
                };
                return legendLayerListItem;
              });
              if (styleRepresentation.defaultCanvas) {
                const legendLayerListItem: TypeLegendItem = {
                  geometryType,
                  icon: styleRepresentation.defaultCanvas.toDataURL(),
                  name: styleSettings.defaultLabel!,
                  isVisible: styleSettings.defaultVisible!,
                  default: true,
                };
                iconDetailsEntry.iconList.push(legendLayerListItem);
              }
            }
            if (iconDetailsEntry.iconList?.length) iconDetailsEntry.iconImage = iconDetailsEntry.iconList[0].icon;
            if (iconDetailsEntry.iconList && iconDetailsEntry.iconList.length > 1)
              iconDetailsEntry.iconImageStacked = iconDetailsEntry.iconList[1].icon;
            iconDetails.push(iconDetailsEntry);
          }
        });
      }
      return iconDetails;
    }
    return undefined;
  }

  public static async propagateLegendToStore(
    mapId: string,
    layerPath: string,
    legendResultsSetEntry: TypeLegendResultsSetEntry
  ): Promise<void> {
    const layerPathNodes = layerPath.split('/');
    const createNewLegendEntries = async (
      layerPathBeginning: string,
      currentLevel: number,
      existingEntries: TypeLegendLayer[]
    ): Promise<void> => {
      const entryLayerPath = `${layerPathBeginning}/${layerPathNodes[currentLevel]}`;
      const layerConfig = api.maps[mapId].layer.registeredLayers[entryLayerPath];
      let entryIndex = existingEntries.findIndex((entry) => entry.layerPath === entryLayerPath);
      if (layerEntryIsGroupLayer(layerConfig)) {
        if (entryIndex === -1) {
          const legendLayerEntry: TypeLegendLayer = {
            bounds: undefined,
            layerId: layerConfig.layerId,
            order:
              api.maps[mapId].layer.initialLayerOrder.indexOf(entryLayerPath) !== -1 && !layerConfig.parentLayerConfig
                ? api.maps[mapId].layer.initialLayerOrder.indexOf(entryLayerPath)
                : existingEntries.length,
            // TODO: Why do we have the following line in the store? Do we have to fetch the metadata again since the GeoView layer read and keep them?
            metadataAccessPath: getLocalizedValue(layerConfig.geoviewLayerConfig?.metadataAccessPath, mapId) || '',
            layerPath: entryLayerPath,
            layerStatus: legendResultsSetEntry.layerStatus,
            layerName: getLocalizedValue(layerConfig.layerName, mapId) || layerConfig.layerId,
            type: layerConfig.entryType as TypeGeoviewLayerType,
            isVisible: layerConfig.initialSettings?.visible ? layerConfig.initialSettings.visible : 'yes',
            canToggle: legendResultsSetEntry.data?.type !== 'esriImage',
            opacity: layerConfig.initialSettings?.opacity ? layerConfig.initialSettings.opacity : 1,
            items: [] as TypeLegendItem[],
            children: [] as TypeLegendLayer[],
          };
          existingEntries.push(legendLayerEntry);
          entryIndex = existingEntries.length - 1;
        } // else
        // We don't need to update it because basic information of a group node is not supposed to change after its creation.
        // Only the children may change and this is handled by the following call.
        createNewLegendEntries(entryLayerPath, currentLevel + 1, existingEntries[entryIndex].children);
      } else if (layerConfig) {
        const newLegendLayer: TypeLegendLayer = {
          bounds: undefined,
          layerId: layerPathNodes[currentLevel],
          order:
            api.maps[mapId].layer.initialLayerOrder.indexOf(entryLayerPath) !== -1 && !layerConfig.parentLayerConfig
              ? api.maps[mapId].layer.initialLayerOrder.indexOf(entryLayerPath)
              : existingEntries.length,
          layerPath: entryLayerPath,
          layerAttribution: api.maps[mapId].layer.geoviewLayers[layerPathNodes[0]].attributions,
          // ! Why do we have metadataAccessPath here? Do we need to fetch the metadata again? The GeoView layer fetch them and store them in this.metadata.
          metadataAccessPath: getLocalizedValue(layerConfig.geoviewLayerConfig?.metadataAccessPath, mapId) || '',
          layerName: getLocalizedValue(legendResultsSetEntry.data?.layerName, mapId) || layerConfig.layerId!,
          layerStatus: legendResultsSetEntry.layerStatus,
          layerPhase: legendResultsSetEntry.layerPhase,
          querySent: legendResultsSetEntry.querySent,
          styleConfig: legendResultsSetEntry.data?.styleConfig,
          type: legendResultsSetEntry.data?.type,
          isVisible: layerConfig.initialSettings?.visible || 'yes',
          canToggle: legendResultsSetEntry.data?.type !== 'esriImage',
          opacity: layerConfig.initialSettings?.opacity || 1,
          items: [] as TypeLegendItem[],
          children: [] as TypeLegendLayer[],
          icons: LegendEventProcessor.getLayerIconImage(mapId, layerPath, legendResultsSetEntry.data!),
        };

        newLegendLayer.items = [];
        newLegendLayer.icons?.forEach((legendLayerItem) => {
          if (legendLayerItem.iconList)
            legendLayerItem.iconList.forEach((legendLayerListItem) => {
              newLegendLayer.items.push(legendLayerListItem);
            });
        });
        if (entryIndex === -1) existingEntries.push(newLegendLayer);
        // eslint-disable-next-line no-param-reassign
        else existingEntries[entryIndex] = newLegendLayer;

        // TODO: find the best place to calculate layers item and assign https://github.com/Canadian-Geospatial-Platform/geoview/issues/1566
        try {
          // Await for the Geoview layer in loaded state
          const myLayer = await api.maps[mapId].layer.getGeoviewLayerByIdAsync(layerPathNodes[0], true);

          try {
            // Calculate the bounds
            newLegendLayer.bounds = myLayer.calculateBounds(layerPath);
          } catch (error) {
            // Log
            logger.logError(`Couldn't calculate bounds on layer ${layerPath}`, error);
            newLegendLayer.bounds = undefined;
          }
        } catch (error) {
          // Log
          logger.logError(`Couldn't initialize legend information on layer ${layerPath}`, error);
        }
      }
    };

    // Obtain the list of layers currently in the store
    const layers = this.getLayerState(mapId).legendLayers;

    // Process creation of legend entries
    createNewLegendEntries(layerPathNodes[0], 1, layers);

    // Update the legend layers with the updated array, triggering the subscribe
    this.getLayerState(mapId).actions.setLegendLayers(layers);

    // Check if this is an initial load
    if (!LegendEventProcessor.propagatedOnce) {
      // Flag so this is only executed once after initial load
      LegendEventProcessor.propagatedOnce = true;

      // Give it some time so that each layer has their chance to load on time
      await delay(LegendEventProcessor.timeDelayBeforeSelectingLayerInStore);

      // Find the layers that are processed
      const validFirstLayer = layers.find((layer) => {
        return layer.layerStatus === 'processed';
      });

      // If found a valid first layer to select
      if (validFirstLayer) {
        // Set the selected layer path in the store
        this.getLayerState(mapId).actions.setSelectedLayerPath(validFirstLayer.layerPath);
        // Log
        logger.logDebug(`Selected layer ${validFirstLayer.layerPath}`);
      } else {
        // Log
        logger.logError(`Couldn't select a layer as none were processed in time`);
      }
    }
  }
  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  //! NEVER add a store action who does set state AND map action at a same time.
  //! Review the action in store state to make sure
}
