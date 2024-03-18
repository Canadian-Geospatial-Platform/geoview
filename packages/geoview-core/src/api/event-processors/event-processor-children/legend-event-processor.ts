import { TypeLegendResultSetEntry } from '@/api/events/payloads';
import {
  isClassBreakStyleConfig,
  isImageStaticLegend,
  isSimpleStyleConfig,
  isUniqueValueStyleConfig,
  isVectorLegend,
  isWmsLegend,
  layerEntryIsGroupLayer,
  TypeGeoviewLayerType,
  TypeLayerControls,
  TypeLayerEntryConfig,
  TypeLegend,
  TypeStyleGeometry,
} from '@/geo';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeLegendLayer, TypeLegendLayerIcons, TypeLegendLayerItem, TypeLegendItem } from '@/core/components/layers/types';
import { api, getLocalizedValue, ILayerState } from '@/app';

import { AbstractEventProcessor } from '../abstract-event-processor';

export class LegendEventProcessor extends AbstractEventProcessor {
  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  //! Typescript MUST always use the defined store actions below to modify store - NEVER use setState!
  //! Some action does state modifications AND map actions.
  //! ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

  // #region

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
              isVisible: true,
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
                };
                return legendLayerListItem;
              });
              if (styleRepresentation.defaultCanvas) {
                const legendLayerListItem: TypeLegendItem = {
                  geometryType,
                  icon: styleRepresentation.defaultCanvas.toDataURL(),
                  name: styleSettings.defaultLabel!,
                  isVisible: styleSettings.defaultVisible!,
                };
                iconDetailsEntry.iconList.push(legendLayerListItem);
              }
            } else if (isUniqueValueStyleConfig(styleSettings)) {
              iconDetailsEntry.iconList = styleRepresentation.arrayOfCanvas!.map((canvas, i) => {
                const legendLayerListItem: TypeLegendItem = {
                  geometryType,
                  icon: canvas ? canvas.toDataURL() : null,
                  name: styleSettings.uniqueValueStyleInfo[i].label,
                  isVisible: styleSettings.uniqueValueStyleInfo[i].visible !== false,
                };
                return legendLayerListItem;
              });
              if (styleRepresentation.defaultCanvas) {
                const legendLayerListItem: TypeLegendItem = {
                  geometryType,
                  icon: styleRepresentation.defaultCanvas.toDataURL(),
                  name: styleSettings.defaultLabel!,
                  isVisible: styleSettings.defaultVisible!,
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

  /** ***************************************************************************************************************************
   * This method propagates the information stored in the legend layer set to the store.
   *
   * @param {string} mapId The map identifier.
   * @param {string} layerPath The layer path that changed.
   * @param {TypeLegendResultSetEntry} legendResultSetEntry The legend result set that triggered the propagation.
   */
  public static propagateLegendToStore(mapId: string, layerPath: string, legendResultSetEntry: TypeLegendResultSetEntry) {
    const layerPathNodes = layerPath.split('/');
    const setLayerControls = (layerConfig: TypeLayerEntryConfig): TypeLayerControls => {
      const controls: TypeLayerControls = {
        highlight: layerConfig.initialSettings?.controls?.highlight !== undefined ? layerConfig.initialSettings?.controls?.highlight : true,
        hover: layerConfig.initialSettings?.controls?.hover !== undefined ? layerConfig.initialSettings?.controls?.hover : true,
        opacity: layerConfig.initialSettings?.controls?.opacity !== undefined ? layerConfig.initialSettings?.controls?.opacity : true,
        query: layerConfig.initialSettings?.controls?.query !== undefined ? layerConfig.initialSettings?.controls?.query : true,
        remove: layerConfig.initialSettings?.controls?.remove !== undefined ? layerConfig.initialSettings?.controls?.remove : true,
        table: layerConfig.initialSettings?.controls?.table !== undefined ? layerConfig.initialSettings?.controls?.table : true,
        visibility:
          layerConfig.initialSettings?.controls?.visibility !== undefined ? layerConfig.initialSettings?.controls?.visibility : true,
        zoom: layerConfig.initialSettings?.controls?.zoom !== undefined ? layerConfig.initialSettings?.controls?.zoom : true,
      };
      return controls;
    };
    const createNewLegendEntries = (layerPathBeginning: string, currentLevel: number, existingEntries: TypeLegendLayer[]) => {
      const entryLayerPath = `${layerPathBeginning}/${layerPathNodes[currentLevel]}`;
      const layerConfig = api.maps[mapId].layer.registeredLayers[entryLayerPath] as TypeLayerEntryConfig;
      let entryIndex = existingEntries.findIndex((entry) => entry.layerPath === entryLayerPath);
      if (layerEntryIsGroupLayer(layerConfig)) {
        const controls: TypeLayerControls = setLayerControls(layerConfig);
        if (entryIndex === -1) {
          const legendLayerEntry: TypeLegendLayer = {
            bounds: undefined,
            controls,
            layerId: layerConfig.layerId,
            layerPath: entryLayerPath,
            layerStatus: legendResultSetEntry.layerStatus,
            layerName:
              legendResultSetEntry.layerName ||
              getLocalizedValue(layerConfig.layerName, mapId) ||
              getLocalizedValue(layerConfig.geoviewLayerInstance?.geoviewLayerName, mapId) ||
              layerConfig.layerPath,
            type: layerConfig.entryType as TypeGeoviewLayerType,
            canToggle: legendResultSetEntry.data?.type !== CONST_LAYER_TYPES.ESRI_IMAGE,
            opacity: layerConfig.initialSettings?.states?.opacity ? layerConfig.initialSettings.states.opacity : 1,
            items: [] as TypeLegendItem[],
            children: [] as TypeLegendLayer[],
          };
          existingEntries.push(legendLayerEntry);
          entryIndex = existingEntries.length - 1;
        }
        // eslint-disable-next-line no-param-reassign
        else existingEntries[entryIndex].layerStatus = layerConfig.layerStatus;
        createNewLegendEntries(entryLayerPath, currentLevel + 1, existingEntries[entryIndex].children);
      } else if (layerConfig) {
        const controls: TypeLayerControls = setLayerControls(layerConfig);
        const newLegendLayer: TypeLegendLayer = {
          bounds: undefined,
          controls,
          layerId: layerPathNodes[currentLevel],
          layerPath: entryLayerPath,
          layerAttribution: api.maps[mapId].layer.geoviewLayers[layerPathNodes[0]].attributions,
          layerName:
            legendResultSetEntry.layerName ||
            getLocalizedValue(layerConfig.layerName, mapId) ||
            getLocalizedValue(layerConfig.geoviewLayerInstance?.geoviewLayerName, mapId) ||
            layerConfig.layerPath,
          layerStatus: legendResultSetEntry.layerStatus,
          querySent: legendResultSetEntry.querySent,
          styleConfig: legendResultSetEntry.data?.styleConfig,
          type: legendResultSetEntry.data?.type,
          canToggle: legendResultSetEntry.data?.type !== CONST_LAYER_TYPES.ESRI_IMAGE,
          opacity: layerConfig.initialSettings?.states?.opacity || 1,
          items: [] as TypeLegendItem[],
          children: [] as TypeLegendLayer[],
          icons: LegendEventProcessor.getLayerIconImage(mapId, layerPath, legendResultSetEntry.data!),
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

        const myLayer = api.maps[mapId].layer.geoviewLayers[layerPathNodes[0]];
        // TODO: calculateBounds issue will be tackle ASAP in a next PR
        newLegendLayer.bounds = myLayer.allLayerStatusAreGreaterThanOrEqualTo('loaded') ? myLayer.calculateBounds(layerPath) : undefined;
      }
    };

    // Obtain the list of layers currently in the store
    const layers = this.getLayerState(mapId).legendLayers;

    // Process creation of legend entries
    createNewLegendEntries(layerPathNodes[0], 1, layers);

    // Update the legend layers with the updated array, triggering the subscribe
    this.getLayerState(mapId).actions.setLegendLayers(layers);
  }
  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  //! NEVER add a store action who does set state AND map action at a same time.
  //! Review the action in store state to make sure
}
