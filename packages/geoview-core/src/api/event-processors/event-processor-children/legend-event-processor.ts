import { TypeLayerControls } from '@config/types/map-schema-types';
import _ from 'lodash';
import { TypeLegendLayer, TypeLegendLayerIcons, TypeLegendLayerItem, TypeLegendItem } from '@/core/components/layers/types';
import {
  CONST_LAYER_TYPES,
  TypeGeoviewLayerType,
  isImageStaticLegend,
  isVectorLegend,
  isWmsLegend,
} from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { ILayerState, TypeLegend, TypeLegendResultSetEntry } from '@/core/stores/store-interface-and-intial-values/layer-state';
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
    // TODO: Refactor - Move this function to a utility class instead of at the 'processor' level so it's safer to call from a layer framework level class
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
   * @param {TypeLegendResultSetEntry} legendResultSetEntry The legend result set that triggered the propagation.
   */
  public static propagateLegendToStore(mapId: string, legendResultSetEntry: TypeLegendResultSetEntry): void {
    const { layerPath } = legendResultSetEntry;
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

    const createNewLegendEntries = (currentLevel: number, existingEntries: TypeLegendLayer[]): void => {
      const suffix = layerPathNodes.slice(0, currentLevel);
      const entryLayerPath = suffix.join('/');
      const layerConfig = MapEventProcessor.getMapViewerLayerAPI(mapId).getLayerEntryConfig(entryLayerPath);

      // If not found, skip
      if (!layerConfig) return;

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
              getLocalizedValue(layerConfig.layerName, AppEventProcessor.getDisplayLanguage(mapId)) ||
              getLocalizedValue(layerConfig.geoviewLayerConfig.geoviewLayerName, AppEventProcessor.getDisplayLanguage(mapId)) ||
              layerConfig.layerPath,
            legendQueryStatus: legendResultSetEntry.legendQueryStatus,
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
        createNewLegendEntries(currentLevel + 1, existingEntries[entryIndex].children);
      } else {
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
            getLocalizedValue(layerConfig.geoviewLayerConfig.geoviewLayerName, AppEventProcessor.getDisplayLanguage(mapId)) ||
            layerConfig.layerPath,
          layerStatus: legendResultSetEntry.layerStatus,
          legendQueryStatus: legendResultSetEntry.legendQueryStatus,
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
    createNewLegendEntries(2, layers);

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
    LegendEventProcessor.#deleteLayersFromLegendLayersAndChildren(mapId, curLayers, layerPath);
  }

  /**
   * Delete layer from legend layers.
   * @param {string} mapId - The ID of the map.
   * @param {TypeLegendLayer[]} legendLayers - The legend layers list to remove layer from.
   * @param {string} layerPath - The layer path of the layer to change.
   * @private
   */
  static #deleteLayersFromLegendLayersAndChildren(mapId: string, legendLayers: TypeLegendLayer[], layerPath: string): void {
    // Find index of layer and remove it
    const layersIndexToDelete = legendLayers.findIndex((l) => l.layerPath === layerPath);
    if (layersIndexToDelete >= 0) {
      legendLayers.splice(layersIndexToDelete, 1);
    } else {
      // Check for layer to remove in children
      legendLayers.forEach((layer) => {
        if (layer.children && layer.children.length > 0) {
          LegendEventProcessor.#deleteLayersFromLegendLayersAndChildren(mapId, layer.children, layerPath);
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
    MapEventProcessor.getMapViewerLayerAPI(mapId).removeLayerUsingPath(layerPath);
  }

  /**
   * Set visibility of an item in legend layers.
   * @param {string} mapId - The ID of the map.
   * @param {TypeLegendItem} item - The item to change.
   * @param {boolean} visibility - The new visibility.
   */
  static setItemVisibility(mapId: string, item: TypeLegendItem, visibility: boolean = true): void {
    // Get current layer legends and set item visibility
    const curLayers = this.getLayerState(mapId).legendLayers;
    // eslint-disable-next-line no-param-reassign
    item.isVisible = visibility;

    // Set updated legend layers
    this.getLayerState(mapId).setterActions.setLegendLayers(curLayers);
  }

  /**
   * Toggle visibility of an item.
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path of the layer to change.
   * @param {TypeLegendItem} item - The item to change.
   */
  static toggleItemVisibility(mapId: string, layerPath: string, item: TypeLegendItem): void {
    MapEventProcessor.getMapViewerLayerAPI(mapId).setItemVisibility(layerPath, item, !item.isVisible);
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
    // Get legend layers and legend layer to update
    const curLayers = this.getLayerState(mapId).legendLayers;
    const layer = this.findLayerByPath(curLayers, layerPath);

    // Set item visibility on map and in legend layer item for each item in layer
    if (layer) {
      layer.items.forEach((item) => {
        MapEventProcessor.getMapViewerLayerAPI(mapId).setItemVisibility(layerPath, item, visibility, false);
        // eslint-disable-next-line no-param-reassign
        item.isVisible = visibility;
      });
    }

    // Set updated legend layers
    this.getLayerState(mapId).setterActions.setLegendLayers(curLayers);
  }

  /**
   * Sets the opacity of the layer.
   * @param {string} mapId - The ID of the map.
   * @param {string} layer - The layer to set the opacity.
   * @param {number} opacity - The opacity to set.
   * @param {boolean} isChild - Is the layer a child layer.
   * @private
   */
  static #setOpacityInLayerAndChildren(mapId: string, layer: TypeLegendLayer, opacity: number, isChild = false): void {
    _.set(layer, 'opacity', opacity);
    MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayer(layer.layerPath)?.setOpacity(opacity, layer.layerPath);
    if (isChild) {
      _.set(layer, 'opacityFromParent', opacity);
    }
    if (layer.children && layer.children.length > 0) {
      layer.children.forEach((child) => {
        this.#setOpacityInLayerAndChildren(mapId, child, opacity, true);
      });
    }
  }

  /**
   * Sets the opacity of the layer.
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path of the layer to change.
   * @param {number} opacity - The opacity to set.
   */
  static setLayerOpacity(mapId: string, layerPath: string, opacity: number): void {
    const curLayers = this.getLayerState(mapId).legendLayers;
    const layer = LegendEventProcessor.findLayerByPath(curLayers, layerPath);
    if (layer) {
      layer.opacity = opacity;
      this.#setOpacityInLayerAndChildren(mapId, layer, opacity);
    }

    // Set updated legend layers
    this.getLayerState(mapId).setterActions.setLegendLayers(curLayers);
  }
}
