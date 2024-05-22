import { TypeClassBreakStyleConfig, TypeLayerControls, TypeUniqueValueStyleConfig } from '@config/types/map-schema-types';
import { TypeLegendLayer, TypeLegendLayerIcons, TypeLegendLayerItem, TypeLegendItem } from '@/core/components/layers/types';
import {
  CONST_LAYER_TYPES,
  TypeGeoviewLayerType,
  TypeLegend,
  isImageStaticLegend,
  isVectorLegend,
  isWmsLegend,
} from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeLegendResultSetEntry } from '@/geo/layer/layer-sets/legends-layer-set';
import { ILayerState } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { getLocalizedValue } from '@/core/utils/utilities';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';

import {
  TypeLayerEntryConfig,
  TypeStyleGeometry,
  isClassBreakStyleConfig,
  isSimpleStyleConfig,
  isUniqueValueStyleConfig,
  layerEntryIsGroupLayer,
} from '@/geo/map/map-schema-types';
import { AppEventProcessor } from './app-event-processor';
import { MapEventProcessor } from './map-event-processor';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with UIEventProcessor vs UIState

export class LegendEventProcessor extends AbstractEventProcessor {
  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  // GV Typescript MUST always use the defined store actions below to modify store - NEVER use setState!
  // GV Some action does state modifications AND map actions.
  // GV ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

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

  static getLayerIconImage(layerLegend: TypeLegend | null): TypeLegendLayerIcons | undefined {
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
  public static propagateLegendToStore(mapId: string, layerPath: string, legendResultSetEntry: TypeLegendResultSetEntry): void {
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
    const createNewLegendEntries = (layerPathBeginning: string, currentLevel: number, existingEntries: TypeLegendLayer[]): void => {
      const entryLayerPath = `${layerPathBeginning}/${layerPathNodes[currentLevel]}`;
      const layerConfig = MapEventProcessor.getMapViewerLayerAPI(mapId).getLayerEntryConfig(entryLayerPath)!;
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
              getLocalizedValue(layerConfig.layerName, AppEventProcessor.getDisplayLanguage(mapId)) ||
              getLocalizedValue(layerConfig.geoviewLayerInstance?.geoviewLayerName, AppEventProcessor.getDisplayLanguage(mapId)) ||
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
          layerAttribution: MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayer(layerPathNodes[0])!.attributions,
          layerName:
            legendResultSetEntry.layerName ||
            getLocalizedValue(layerConfig.layerName, AppEventProcessor.getDisplayLanguage(mapId)) ||
            getLocalizedValue(layerConfig.geoviewLayerInstance?.geoviewLayerName, AppEventProcessor.getDisplayLanguage(mapId)) ||
            layerConfig.layerPath,
          layerStatus: legendResultSetEntry.layerStatus,
          styleConfig: legendResultSetEntry.data?.styleConfig,
          type: legendResultSetEntry.data?.type,
          canToggle: legendResultSetEntry.data?.type !== CONST_LAYER_TYPES.ESRI_IMAGE,
          opacity: layerConfig.initialSettings?.states?.opacity || 1,
          items: [] as TypeLegendItem[],
          children: [] as TypeLegendLayer[],
          icons: LegendEventProcessor.getLayerIconImage(legendResultSetEntry.data!),
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

        const myLayer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayer(layerPathNodes[0])!;
        // TODO: calculateBounds issue will be tackle ASAP in a next PR
        newLegendLayer.bounds = myLayer.allLayerStatusAreGreaterThanOrEqualTo('loaded') ? myLayer.calculateBounds(layerPath) : undefined;
      }
    };

    // Obtain the list of layers currently in the store
    const layers = this.getLayerState(mapId).legendLayers;

    // Process creation of legend entries
    createNewLegendEntries(layerPathNodes[0], 1, layers);

    // Update the legend layers with the updated array, triggering the subscribe
    this.getLayerState(mapId).setterActions.setLegendLayers(layers);
  }
  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure

  /**
   * Sets the highlighted layer state.
   * @param {string} mapId - The ID of the map
   * @param {string} layerPath - The layer path to set as the highlighted layer
   */
  static setHighlightLayer(mapId: string, layerPath: string): void {
    // Get highlighted layer to set active button state because there can only be one highlighted layer at a time.
    const currentHighlight = this.getLayerState(mapId).highlightedLayer;
    // Highlight layer and get new highlighted layer path from map event processor.
    const highlightedLayerpath = MapEventProcessor.changeOrRemoveLayerHighlight(mapId, layerPath, currentHighlight);
    this.getLayerState(mapId).setterActions.setHighlightLayer(highlightedLayerpath);
  }

  /**
   * Finds a legend layer by a layerPath.
   * @param {TypeLegendLayer[]} layers - The legend layers to search.
   * @param {string} layerPath - The path of the layer.
   * @returns {TypeLegendLayer | undefined}
   */
  static findLayerByPath(layers: TypeLegendLayer[], layerPath: string): TypeLegendLayer | undefined {
    let foundLayer: TypeLegendLayer | undefined;

    layers.forEach((layer) => {
      if (layerPath === layer.layerPath) {
        foundLayer = layer;
      }

      if (layerPath?.startsWith(layer.layerPath) && layer.children?.length > 0) {
        const result: TypeLegendLayer | undefined = LegendEventProcessor.findLayerByPath(layer.children, layerPath);
        if (result) {
          foundLayer = result;
        }
      }
    });

    return foundLayer;
  }

  /**
   * Delete layer from legend layers.
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path of the layer to change.
   */
  static deleteLayerFromLegendLayers(mapId: string, layerPath: string): void {
    // Get legend layers to pass to recursive function
    const curLayers = this.getLayerState(mapId).legendLayers;
    // Remove layer and children
    LegendEventProcessor.deleteLayersFromLegendLayersAndChildren(mapId, curLayers, layerPath);
  }

  /**
   * Delete layer from legend layers.
   * @param {string} mapId - The ID of the map.
   * @param {TypeLegendLayer[]} legendLayers - The legend layers list to remove layer from.
   * @param {string} layerPath - The layer path of the layer to change.
   */
  static deleteLayersFromLegendLayersAndChildren(mapId: string, legendLayers: TypeLegendLayer[], layerPath: string): void {
    // Find index of layer and remove it
    const layersIndexToDelete = legendLayers.findIndex((l) => l.layerPath === layerPath);
    if (layersIndexToDelete >= 0) {
      legendLayers.splice(layersIndexToDelete, 1);
    } else {
      // Check for layer to remove in children
      legendLayers.forEach((layer) => {
        if (layer.children && layer.children.length > 0) {
          LegendEventProcessor.deleteLayersFromLegendLayersAndChildren(mapId, layer.children, layerPath);
        }
      });
    }
  }

  /**
   * Delete layer.
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path of the layer to change.
   */
  static deleteLayer(mapId: string, layerPath: string): void {
    // Delete layer through layer API
    MapEventProcessor.getMapViewerLayerAPI(mapId).removeLayersUsingPath(layerPath);
  }

  /**
   * Toggle visibility of an item.
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path of the layer to change.
   * @param {TypeStyleGeometry} geometryType - The geometry type of the item.
   * @param {string} itemName - The name of the item to change.
   */
  static toggleItemVisibility(mapId: string, layerPath: string, geometryType: TypeStyleGeometry, itemName: string): void {
    // Get legend layers, registered layer config, and legend layer
    const curLayers = this.getLayerState(mapId).legendLayers;
    const registeredLayer = MapEventProcessor.getMapViewerLayerAPI(mapId).registeredLayers[layerPath] as VectorLayerEntryConfig;
    const layer = this.findLayerByPath(curLayers, layerPath);

    if (layer) {
      layer.items.forEach((item) => {
        if (item.geometryType === geometryType && item.name === itemName) {
          // eslint-disable-next-line no-param-reassign
          item.isVisible = !item.isVisible;

          if (item.isVisible && MapEventProcessor.getMapVisibilityFromOrderedLayerInfo(mapId, layerPath)) {
            MapEventProcessor.setOrToggleMapLayerVisibility(mapId, layerPath, true);
          }

          // assign value to registered layer. This is use by applyFilter function to set visibility
          // TODO: check if we need to refactor to centralize attribute setting....
          // TODO: know issue when we toggle a default visibility item https://github.com/Canadian-Geospatial-Platform/geoview/issues/1564
          if (registeredLayer.style![geometryType]?.styleType === 'classBreaks') {
            const geometryStyleConfig = registeredLayer.style![geometryType]! as TypeClassBreakStyleConfig;
            const classBreakStyleInfo = geometryStyleConfig.classBreakStyleInfo.find((styleInfo) => styleInfo.label === itemName);
            if (classBreakStyleInfo) classBreakStyleInfo.visible = item.isVisible;
            else geometryStyleConfig.defaultVisible = item.isVisible;
          } else if (registeredLayer.style![geometryType]?.styleType === 'uniqueValue') {
            const geometryStyleConfig = registeredLayer.style![geometryType]! as TypeUniqueValueStyleConfig;
            const uniqueStyleInfo = geometryStyleConfig.uniqueValueStyleInfo.find((styleInfo) => styleInfo.label === itemName);
            if (uniqueStyleInfo) uniqueStyleInfo.visible = item.isVisible;
            else geometryStyleConfig.defaultVisible = item.isVisible;
          }
        }
      });

      // Set updated legend layers
      this.getLayerState(mapId).setterActions.setLegendLayers(curLayers);

      // Apply filter to layer
      (MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayer(layerPath) as AbstractGeoViewVector).applyViewFilter(layerPath, '');
    }
  }

  /**
   * Sets the visibility of all items in the layer.
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path of the layer to change.
   * @param {boolean} visibility - The visibility.
   */
  static setAllItemsVisibility(mapId: string, layerPath: string, visibility: boolean): void {
    // Set layer to visible
    MapEventProcessor.setOrToggleMapLayerVisibility(mapId, layerPath, true);
    // Get legend layers, registered layer config, and legend layer
    const curLayers = this.getLayerState(mapId).legendLayers;
    const registeredLayer = MapEventProcessor.getMapViewerLayerAPI(mapId).registeredLayers[layerPath] as VectorLayerEntryConfig;
    const layer = this.findLayerByPath(curLayers, layerPath);

    if (layer) {
      layer.items.forEach((item) => {
        // eslint-disable-next-line no-param-reassign
        item.isVisible = visibility;
      });
      // assign value to registered layer. This is use by applyFilter function to set visibility
      // TODO: check if we need to refactor to centralize attribute setting....
      if (registeredLayer.style) {
        ['Point', 'LineString', 'Polygon'].forEach((geometry) => {
          if (registeredLayer.style![geometry as TypeStyleGeometry]) {
            if (registeredLayer.style![geometry as TypeStyleGeometry]?.styleType === 'classBreaks') {
              const geometryStyleConfig = registeredLayer.style![geometry as TypeStyleGeometry]! as TypeClassBreakStyleConfig;
              if (geometryStyleConfig.defaultVisible !== undefined) geometryStyleConfig.defaultVisible = visibility;
              geometryStyleConfig.classBreakStyleInfo.forEach((styleInfo) => {
                // eslint-disable-next-line no-param-reassign
                styleInfo.visible = visibility;
              });
            } else if (registeredLayer.style![geometry as TypeStyleGeometry]?.styleType === 'uniqueValue') {
              const geometryStyleConfig = registeredLayer.style![geometry as TypeStyleGeometry]! as TypeUniqueValueStyleConfig;
              if (geometryStyleConfig.defaultVisible !== undefined) geometryStyleConfig.defaultVisible = visibility;
              geometryStyleConfig.uniqueValueStyleInfo.forEach((styleInfo) => {
                // eslint-disable-next-line no-param-reassign
                styleInfo.visible = visibility;
              });
            }
          }
        });
      }
    }

    // Set updated legend layers
    this.getLayerState(mapId).setterActions.setLegendLayers(curLayers);

    // GV try to make reusable store actions....
    // GV create a function setItemVisibility called with layer path and this function set the registered layer (from store values) then apply the filter.
    (MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayer(layerPath) as AbstractGeoViewVector).applyViewFilter(layerPath, '');
  }
}
