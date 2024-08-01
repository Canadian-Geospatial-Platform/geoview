import { Extent, TypeLayerControls } from '@config/types/map-schema-types';
import { TypeLegendLayer, TypeLegendLayerItem, TypeLegendItem } from '@/core/components/layers/types';
import {
  CONST_LAYER_TYPES,
  TypeGeoviewLayerType,
  TypeWmsLegend,
  isImageStaticLegend,
  isVectorLegend,
  isWmsLegend,
} from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { ILayerState, TypeLegend, TypeLegendResultSetEntry } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { getLocalizedValue } from '@/core/utils/utilities';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';

import {
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

  static setSelectedLayersTabLayer(mapId: string, layerPath: string): void {
    // Save in store
    this.getLayerState(mapId).setterActions.setSelectedLayerPath(layerPath);
  }

  /**
   * Get a specific state.
   * @param {string} mapId - The mapId
   * @param {'highlightedLayer' | 'selectedLayerPath' | 'displayState' | 'layerDeleteInProgress'} state - The state to get
   * @returns {string | boolean | null | undefined} The requested state
   */
  static getLayerPanelState(
    mapId: string,
    state: 'highlightedLayer' | 'selectedLayerPath' | 'displayState' | 'layerDeleteInProgress'
  ): string | boolean | null | undefined {
    return this.getLayerState(mapId)[state];
  }

  /**
   * Get a legend layer.
   * @param {string} mapId - The mapId
   * @param {string} layerPath - The path of the layer to get
   * @returns {TypeLegendLayer | undefined} The requested legend layer
   */
  static getLegendLayerInfo(mapId: string, layerPath: string): TypeLegendLayer | undefined {
    const layers = LegendEventProcessor.getLayerState(mapId).legendLayers;
    return this.findLayerByPath(layers, layerPath);
  }

  /**
   * Gets the layer bounds for a layer path
   * @param mapId - The map id
   * @param layerPath - The layer path
   * @returns {Extent | undefined} The extent of the layer at the given path
   */
  static getLayerBounds(mapId: string, layerPath: string): Extent | undefined {
    // Find the layer for the given layer path
    const layers = LegendEventProcessor.getLayerState(mapId).legendLayers;
    const layer = this.findLayerByPath(layers, layerPath);

    // If layer bounds are not set, or have infinity (can be due to setting before features load), recalculate
    if (layer && (!layer.bounds || layer.bounds?.includes(Infinity))) {
      const newBounds = MapEventProcessor.getMapViewerLayerAPI(mapId).calculateBounds(layerPath);
      if (newBounds) {
        // Set layer bounds
        layer.bounds = newBounds;

        // Set updated legend layers
        this.getLayerState(mapId).setterActions.setLegendLayers(layers);
      }
    }

    // If found and bounds found
    if (layer && layer.bounds) {
      return layer.bounds;
    }

    // No bounds found
    return undefined;
  }

  /**
   * Get the extent of a feature or group of features
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path
   * @param {string[]} objectIds - The IDs of features to get extents from.
   * @returns {Promise<Extent | undefined>} The extent of the feature, if available
   */
  static getExtentFromFeatures(mapId: string, layerPath: string, objectIds: string[]): Promise<Extent | undefined> | undefined {
    return MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayerHybrid(layerPath)?.getExtentFromFeatures(layerPath, objectIds);
  }

  static getLayerIconImage(layerLegend: TypeLegend | null): TypeLegendLayerItem[] | undefined {
    // TODO: Refactor - Move this function to a utility class instead of at the 'processor' level so it's safer to call from a layer framework level class
    const iconDetails: TypeLegendLayerItem[] = [];
    if (layerLegend) {
      if (isWmsLegend(layerLegend) || isImageStaticLegend(layerLegend)) {
        const iconDetailsEntry: TypeLegendLayerItem = {};
        iconDetailsEntry.iconType = 'simple';
        // Use icon image if available
        if (layerLegend.legend) iconDetailsEntry.iconImage = layerLegend.legend.toDataURL();
        // Otherwise use image from first style
        else if ((layerLegend as TypeWmsLegend).styles && (layerLegend as TypeWmsLegend).styles![0].legend)
          iconDetailsEntry.iconImage = (layerLegend as TypeWmsLegend).styles![0].legend!.toDataURL();
        // No styles or image, no icon
        else iconDetailsEntry.iconImage = 'no data';
        iconDetails.push(iconDetailsEntry);
      } else if (layerLegend.legend === null || Object.keys(layerLegend.legend).length === 0) iconDetails[0] = { iconImage: 'no data' };
      else if (isVectorLegend(layerLegend)) {
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

    const setLayerControls = (layerConfig: ConfigBaseClass, isChild: boolean = false): TypeLayerControls => {
      const removeDefault = !(isChild && MapEventProcessor.getGeoViewMapConfig(mapId)?.globalSettings?.canRemoveSublayers === false);
      // console.log(layerConfig.layerPath, isChild, removeDefault, MapEventProcessor.getGeoViewMapConfig(mapId));
      const controls: TypeLayerControls = {
        highlight: layerConfig.initialSettings?.controls?.highlight !== undefined ? layerConfig.initialSettings?.controls?.highlight : true,
        hover: layerConfig.initialSettings?.controls?.hover !== undefined ? layerConfig.initialSettings?.controls?.hover : true,
        opacity: layerConfig.initialSettings?.controls?.opacity !== undefined ? layerConfig.initialSettings?.controls?.opacity : true,
        query: layerConfig.initialSettings?.controls?.query !== undefined ? layerConfig.initialSettings?.controls?.query : true,
        remove: layerConfig.initialSettings?.controls?.remove !== undefined ? layerConfig.initialSettings?.controls?.remove : removeDefault,
        table: layerConfig.initialSettings?.controls?.table !== undefined ? layerConfig.initialSettings?.controls?.table : true,
        visibility:
          layerConfig.initialSettings?.controls?.visibility !== undefined ? layerConfig.initialSettings?.controls?.visibility : true,
        zoom: layerConfig.initialSettings?.controls?.zoom !== undefined ? layerConfig.initialSettings?.controls?.zoom : true,
      };
      return controls;
    };

    const createNewLegendEntries = (currentLevel: number, existingEntries: TypeLegendLayer[]): void => {
      // If outside of range of layer paths, stop
      if (layerPathNodes.length < currentLevel) return;

      const suffix = layerPathNodes.slice(0, currentLevel);
      const entryLayerPath = suffix.join('/');

      // Get the layer config
      const layerConfig = MapEventProcessor.getMapViewerLayerAPI(mapId).getLayerEntryConfig(entryLayerPath);

      // If not found, skip
      if (!layerConfig) return;

      // Get the layer
      const layer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayerHybrid(entryLayerPath);

      // Interpret the layer name the best we can
      const layerName =
        getLocalizedValue(layer?.getLayerName(entryLayerPath), AppEventProcessor.getDisplayLanguage(mapId)) ||
        getLocalizedValue(layerConfig.layerName, AppEventProcessor.getDisplayLanguage(mapId)) ||
        getLocalizedValue(layerConfig.geoviewLayerConfig.geoviewLayerName, AppEventProcessor.getDisplayLanguage(mapId)) ||
        layerConfig.layerPath;

      let entryIndex = existingEntries.findIndex((entry) => entry.layerPath === entryLayerPath);
      if (layerEntryIsGroupLayer(layerConfig)) {
        // If all loaded
        let bounds;
        if (ConfigBaseClass.allLayerStatusAreGreaterThanOrEqualTo('loaded', layerConfig.listOfLayerEntryConfig)) {
          // Calculate the bounds
          bounds = MapEventProcessor.getMapViewerLayerAPI(mapId).calculateBounds(layerConfig.layerPath);
        }

        const controls: TypeLayerControls = setLayerControls(layerConfig, currentLevel > 2);
        if (entryIndex === -1) {
          const legendLayerEntry: TypeLegendLayer = {
            bounds,
            controls,
            layerId: layerConfig.layerId,
            layerPath: entryLayerPath,
            layerName,
            layerStatus: legendResultSetEntry.layerStatus,
            legendQueryStatus: legendResultSetEntry.legendQueryStatus,
            type: layerConfig.entryType as TypeGeoviewLayerType,
            canToggle: legendResultSetEntry.data?.type !== CONST_LAYER_TYPES.ESRI_IMAGE,
            opacity: layerConfig.initialSettings?.states?.opacity ? layerConfig.initialSettings.states.opacity : 1,
            icons: [] as TypeLegendLayerItem[],
            items: [] as TypeLegendItem[],
            children: [] as TypeLegendLayer[],
          };
          existingEntries.push(legendLayerEntry);
          entryIndex = existingEntries.length - 1;
        } else {
          // TODO: Check - Is it missing group layer entry config properties in the store?
          // TO.DOCONT: At the time of writing this, it was just updating the layerStatus on the group layer entry.
          // TO.DOCONT: It seemed to me it should also at least update the name and the bounds (the bounds are tricky, as they get generated only when the children are loaded)
          // TO.DOCONT: Is there any other group layer entry attributes we would like to propagate in the legends store? I'd think so?
          // eslint-disable-next-line no-param-reassign
          existingEntries[entryIndex].layerStatus = layerConfig.layerStatus;
          // eslint-disable-next-line no-param-reassign
          existingEntries[entryIndex].layerName = layerName;
          // eslint-disable-next-line no-param-reassign
          existingEntries[entryIndex].bounds = bounds;
        }

        // Continue recursively
        createNewLegendEntries(currentLevel + 1, existingEntries[entryIndex].children);
      } else {
        // If loaded
        let bounds;
        if (layerConfig.layerStatus === 'loaded') {
          // Calculate the bounds
          bounds = MapEventProcessor.getMapViewerLayerAPI(mapId).calculateBounds(layerConfig.layerPath);
        }

        const controls: TypeLayerControls = setLayerControls(layerConfig, currentLevel > 2);
        const legendLayerEntry: TypeLegendLayer = {
          bounds,
          controls,
          layerId: layerPathNodes[currentLevel],
          layerPath: entryLayerPath,
          layerAttribution: layer?.getAttributions(),
          layerName,
          layerStatus: legendResultSetEntry.layerStatus,
          legendQueryStatus: legendResultSetEntry.legendQueryStatus,
          styleConfig: legendResultSetEntry.data?.styleConfig,
          type: legendResultSetEntry.data?.type || (layerConfig.entryType as TypeGeoviewLayerType),
          canToggle: legendResultSetEntry.data?.type !== CONST_LAYER_TYPES.ESRI_IMAGE,
          opacity: layerConfig.initialSettings?.states?.opacity || 1,
          items: [] as TypeLegendItem[],
          children: [] as TypeLegendLayer[],
          icons: LegendEventProcessor.getLayerIconImage(legendResultSetEntry.data!) || [],
        };

        // Add the icons as items on the layer entry
        legendLayerEntry.icons.forEach((legendLayerItem) => {
          if (legendLayerItem.iconList)
            legendLayerItem.iconList.forEach((legendLayerListItem) => {
              legendLayerEntry.items.push(legendLayerListItem);
            });
        });

        // If non existing in the store yet
        if (entryIndex === -1) {
          // Add it
          existingEntries.push(legendLayerEntry);
        } else {
          // Replace it
          // eslint-disable-next-line no-param-reassign
          existingEntries[entryIndex] = legendLayerEntry;
        }
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
   * Refresh layer and reset states.
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path of the layer to refresh.
   */
  static refreshLayer(mapId: string, layerPath: string): void {
    // Get base layer through layer API
    const baseLayer = MapEventProcessor.getMapViewerLayerAPI(mapId).getOLLayer(layerPath);

    // Refresh layer through layer API
    if (baseLayer) MapEventProcessor.getMapViewerLayerAPI(mapId).refreshBaseLayer(baseLayer);

    // TODO Update after refactor, layerEntryConfig will not know initial settings
    const layerEntryConfig = MapEventProcessor.getMapViewerLayerAPI(mapId).getLayerEntryConfig(layerPath);

    // If layer is group, refresh child layers
    if (layerEntryConfig && layerEntryIsGroupLayer(layerEntryConfig))
      layerEntryConfig.listOfLayerEntryConfig.forEach((entryConfig) => this.refreshLayer(mapId, entryConfig.layerPath));

    // Reset layer states to original values
    const opacity = layerEntryConfig?.initialSettings.states?.opacity || 1;
    const visibility = layerEntryConfig?.initialSettings.states?.visible || true;
    LegendEventProcessor.setLayerOpacity(mapId, layerPath, opacity);
    MapEventProcessor.setOrToggleMapLayerVisibility(mapId, layerPath, visibility);

    if (visibility) LegendEventProcessor.setAllItemsVisibility(mapId, layerPath, visibility);
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
   * @param {TypeLegendLayer[]} curLayers - The current legend layers.
   * @param {string} layerPath - The layer path.
   * @param {number} opacity - The opacity to set.
   * @param {boolean} isChild - Is the layer a child layer.
   * @private
   */
  static #setOpacityInLayerAndChildren(
    mapId: string,
    curLayers: TypeLegendLayer[],
    layerPath: string,
    opacity: number,
    isChild = false
  ): void {
    const layer = LegendEventProcessor.findLayerByPath(curLayers, layerPath);
    if (layer) {
      layer.opacity = opacity;
      MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayerHybrid(layerPath)?.setOpacity(opacity, layerPath);
      if (isChild) {
        layer.opacityFromParent = opacity;
      }
      if (layer.children && layer.children.length > 0) {
        layer.children.forEach((child) => {
          this.#setOpacityInLayerAndChildren(mapId, curLayers, child.layerPath, opacity, true);
        });
      }
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
    this.#setOpacityInLayerAndChildren(mapId, curLayers, layerPath, opacity);

    // Set updated legend layers
    this.getLayerState(mapId).setterActions.setLegendLayers(curLayers);
  }
}
