import { Extent, TypeLayerStyleSettings, TypeFeatureInfoEntry, TypeStyleGeometry } from '@/api/types/map-schema-types';
import { TimeDimension } from '@/core/utils/date-mgt';
import { CONST_LAYER_TYPES, TypeLayerControls } from '@/api/types/layer-schema-types';
import { TypeLegendLayer, TypeLegendLayerItem, TypeLegendItem } from '@/core/components/layers/types';
import { TypeWmsLegend, isImageStaticLegend, isVectorLegend, isWmsLegend } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { ILayerState, TypeLegend, TypeLegendResultSetEntry } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { LayerNotFoundError, LayerWrongTypeError } from '@/core/exceptions/layer-exceptions';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';

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

  static reorderLegendLayers(mapId: string): void {
    // Sort the layers
    const sortedLayers = this.getLayerState(mapId).legendLayers.sort(
      (a, b) =>
        MapEventProcessor.getMapIndexFromOrderedLayerInfo(mapId, a.layerPath) -
        MapEventProcessor.getMapIndexFromOrderedLayerInfo(mapId, b.layerPath)
    );

    // Save in store
    this.getLayerState(mapId).setterActions.setLegendLayers(sortedLayers);
  }

  /**
   * Gets a specific state.
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
   * Gets a legend layer.
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
   * @param {string} mapId - The map id
   * @param {string} layerPath - The layer path
   * @returns {Extent | undefined} The extent of the layer at the given path
   */
  static getLayerBounds(mapId: string, layerPath: string): Extent | undefined {
    // Find the layer for the given layer path
    const layers = LegendEventProcessor.getLayerState(mapId).legendLayers;
    const layer = this.findLayerByPath(layers, layerPath);

    // If layer bounds are not set, or have infinity (can be due to setting before features load), recalculate
    if (layer && (!layer.bounds || layer.bounds?.includes(Infinity))) {
      const newBounds = MapEventProcessor.getMapViewerLayerAPI(mapId).calculateBounds(layerPath);

      if (newBounds && (!newBounds.includes(Infinity) || !layer.bounds)) {
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
   * Retrieves the default filter configuration for a specific layer entry.
   *
   * @param {string} mapId - The unique identifier of the map instance.
   * @param {string} layerPath - The path to the layer in the map configuration.
   * @returns {string | undefined} - The default filter for the layer entry, or `undefined` if not available.
   *
   * @description
   * This method fetches the layer entry configuration for the specified layer path and checks if it contains a `layerFilter` property.
   * If the property exists, its value is returned; otherwise, `undefined` is returned.
   */
  static getLayerEntryConfigDefaultFilter(mapId: string, layerPath: string): string | undefined {
    const entryConfig = MapEventProcessor.getMapViewerLayerAPI(mapId).getLayerEntryConfig(layerPath) as AbstractBaseLayerEntryConfig;

    // Check if entryConfig exists and has layerFilter property
    return entryConfig && 'layerFilter' in entryConfig ? (entryConfig.layerFilter as string) : undefined;
  }

  /**
   * Retrieves the projection code for a specific layer.
   *
   * @param {string} mapId - The unique identifier of the map instance.
   * @param {string} layerPath - The path to the layer.
   * @returns {string | undefined} - The projection code of the layer, or `undefined` if not available.
   *
   * @description
   * This method fetches the Geoview layer for the specified layer path and checks if it has a `getMetadataProjection` method.
   * If the method exists, it retrieves the projection object and returns its code using the `getCode` method.
   * If the projection or its code is not available, the method returns `undefined`.
   */
  static getLayerServiceProjection(mapId: string, layerPath: string): string | undefined {
    const geoviewLayer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayer(layerPath);

    if (geoviewLayer && 'getMetadataProjection' in geoviewLayer && typeof geoviewLayer.getMetadataProjection === 'function') {
      const projection = geoviewLayer.getMetadataProjection();
      return projection && typeof projection.getCode === 'function' ? projection.getCode() : undefined;
    }

    return undefined;
  }

  /**
   * Sets the layer bounds for a layer path
   * @param {string} mapId - The map id
   * @param {string} layerPath - The layer path
   * @param {Extent | undefined} bounds - The extent of the layer at the given path
   */
  static setLayerBounds(mapId: string, layerPath: string, bounds: Extent | undefined): void {
    // Find the layer for the given layer path
    const layers = LegendEventProcessor.getLayerState(mapId).legendLayers;
    const layer = this.findLayerByPath(layers, layerPath);

    if (layer) {
      // Set layer bounds
      layer.bounds = bounds;
      // Set updated legend layers
      this.getLayerState(mapId).setterActions.setLegendLayers(layers);
    }
  }

  /**
   * Sets the layersAreLoading flag in the store
   * @param {string} mapId - The map id
   * @param {boolean} areLoading - Indicator if any layer is currently loading
   */
  static setLayersAreLoading(mapId: string, areLoading: boolean): void {
    // Update the store
    this.getLayerState(mapId).setterActions.setLayersAreLoading(areLoading);
  }

  /**
   * Gets the extent of a feature or group of features
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path
   * @param {string[]} objectIds - The IDs of features to get extents from.
   * @param {string} outfield - ID field to return for services that require a value in outfields.
   * @returns {Promise<Extent>} The extent of the feature, if available
   */
  static getExtentFromFeatures(mapId: string, layerPath: string, objectIds: string[], outfield?: string): Promise<Extent> {
    // Get the layer api
    const layerApi = MapEventProcessor.getMapViewerLayerAPI(mapId);

    // Get the layer
    const layer = layerApi.getGeoviewLayer(layerPath);
    if (!layer) throw new LayerNotFoundError(layerPath);

    // If not a GVLayer
    if (!(layer instanceof AbstractGVLayer)) throw new LayerWrongTypeError(layerPath, layer.getLayerName());

    // Get extent from features calling the GV Layer method
    return layer.getExtentFromFeatures(objectIds, layerApi.mapViewer.getProjection(), outfield);
  }

  /**
   * Retrieves the time dimension information for a specific layer.
   *
   * @param {string} mapId - The unique identifier of the map instance.
   * @param {string} layerPath - The path to the layer.
   * @returns {TimeDimension | undefined} - The temporal dimension information of the layer, or `undefined` if not available.
   *
   * @description
   * This method fetches the Geoview layer for the specified layer path and checks if it has a `getTimeDimension` method.
   * If the method exists, it retrieves the temporal dimension information for the layer.
   * If the layer doesn't support temporal dimensions, the method returns `undefined`.
   *
   * @throws {LayerNotFoundError} - If the specified layer cannot be found.
   */
  static getLayerTimeDimension(mapId: string, layerPath: string): TimeDimension | undefined {
    // Get the layer api
    const layerApi = MapEventProcessor.getMapViewerLayerAPI(mapId);

    // Get the layer
    const layer = layerApi.getGeoviewLayer(layerPath);
    if (!layer) throw new LayerNotFoundError(layerPath);

    // Get the temporal dimension calling the GV Layer method, check if getTimeDimension exists and is a function
    if (layer instanceof AbstractGVLayer) return layer.getTimeDimension();
    return undefined;
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

          if (styleSettings.type === 'simple') {
            iconDetailsEntry.iconType = 'simple';
            iconDetailsEntry.iconImage = (styleRepresentation.defaultCanvas as HTMLCanvasElement).toDataURL();
            iconDetailsEntry.name = styleSettings.info[0].label;

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
            iconDetailsEntry.iconList = [];
            styleRepresentation.arrayOfCanvas!.forEach((canvas, i) => {
              // Check if there is already an entry for this label before adding it.
              if (!iconDetailsEntry.iconList?.find((listItem) => listItem.name === styleSettings.info[i].label)) {
                const legendLayerListItem: TypeLegendItem = {
                  geometryType,
                  icon: canvas ? canvas.toDataURL() : null,
                  name: styleSettings.info[i].label,
                  isVisible: styleSettings.info[i].visible !== false,
                };
                iconDetailsEntry.iconList?.push(legendLayerListItem);
              }
            });
            if (styleRepresentation.defaultCanvas) {
              const legendLayerListItem: TypeLegendItem = {
                geometryType,
                icon: styleRepresentation.defaultCanvas.toDataURL(),
                name: styleSettings.info[styleSettings.info.length - 1].label,
                isVisible: styleSettings.info[styleSettings.info.length - 1].visible !== false,
              };
              iconDetailsEntry.iconList.push(legendLayerListItem);
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

  /**
   * This method propagates the information stored in the legend layer set to the store.
   *
   * @param {string} mapId The map identifier.
   * @param {TypeLegendResultSetEntry} legendResultSetEntry The legend result set that triggered the propagation.
   */
  public static propagateLegendToStore(mapId: string, legendResultSetEntry: TypeLegendResultSetEntry): void {
    const { layerPath } = legendResultSetEntry;
    const layerPathNodes = layerPath.split('/');

    const setLayerControls = (layerConfig: ConfigBaseClass, isChild: boolean = false): TypeLayerControls => {
      const removeDefault = isChild ? MapEventProcessor.getGeoViewMapConfig(mapId)?.globalSettings?.canRemoveSublayers !== false : true;

      // Get the initial settings
      const initialSettings = layerConfig.getInitialSettings();

      // Get the layer controls using default values when needed
      return {
        highlight: initialSettings?.controls?.highlight ?? true, // default: true
        hover: initialSettings?.controls?.hover ?? false, // default: false
        opacity: initialSettings?.controls?.opacity ?? true, // default: true
        query: initialSettings?.controls?.query ?? false, // default: false
        remove: initialSettings?.controls?.remove ?? removeDefault, // default: removeDefault
        table: initialSettings?.controls?.table ?? true, // default: true
        visibility: initialSettings?.controls?.visibility ?? true, // default: true
        zoom: initialSettings?.controls?.zoom ?? true, // default: true
      };
    };

    // TODO: refactor - avoid nested function relying on outside parameter like layerPathNodes
    // TODO.CONT: The layerId set by this array has the map identifier in front... remove
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
      const layer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayer(entryLayerPath);

      // Interpret the layer name the best we can
      const layerName = layer?.getLayerName() || layerConfig.getLayerNameCascade();

      let entryIndex = existingEntries.findIndex((entry) => entry.layerPath === entryLayerPath);
      if (layerConfig.getEntryTypeIsGroup()) {
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
            type: layerConfig.getSchemaTag(),
            canToggle: legendResultSetEntry.data?.type !== CONST_LAYER_TYPES.ESRI_IMAGE,
            opacity: layerConfig.getInitialSettings()?.states?.opacity ?? 1, // default: 1
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

        // Read the icons
        const icons = LegendEventProcessor.getLayerIconImage(legendResultSetEntry.data!);

        const controls: TypeLayerControls = setLayerControls(layerConfig, currentLevel > 2);
        const legendLayerEntry: TypeLegendLayer = {
          bounds,
          controls,
          layerId: layerPathNodes[currentLevel - 1],
          layerPath: entryLayerPath,
          layerAttribution: layer?.getAttributions(),
          layerName,
          layerStatus: legendResultSetEntry.layerStatus,
          legendQueryStatus: legendResultSetEntry.legendQueryStatus,
          styleConfig: legendResultSetEntry.data?.styleConfig,
          type: legendResultSetEntry.data?.type || layerConfig.getSchemaTag(),
          canToggle: legendResultSetEntry.data?.type !== CONST_LAYER_TYPES.ESRI_IMAGE,
          opacity: layerConfig.getInitialSettings()?.states?.opacity ?? 1,
          hoverable: layerConfig.getInitialSettings()?.states?.hoverable,
          queryable: layerConfig.getInitialSettings()?.states?.queryable,
          items: [] as TypeLegendItem[],
          children: [] as TypeLegendLayer[],
          icons: icons || [],
          url: layerConfig.geoviewLayerConfig.metadataAccessPath,
        };

        // Add the icons as items on the layer entry
        legendLayerEntry.icons.forEach((legendLayerItem) => {
          if (legendLayerItem.iconList)
            legendLayerItem.iconList.forEach((legendLayerListItem) => {
              legendLayerEntry.items.push(legendLayerListItem);
            });
        });

        // Also take care of image static by storing the iconImage into the icon property on-the-fly
        if (isImageStaticLegend(legendResultSetEntry.data!) && icons && icons.length > 0) {
          legendLayerEntry.items.push({
            geometryType: 'Point',
            name: 'image',
            icon: icons[0].iconImage || null,
            isVisible: true,
          });
        }

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
    // Reorder the array so legend tab is in synch
    const sortedLayers = layers.sort(
      (a, b) =>
        MapEventProcessor.getMapIndexFromOrderedLayerInfo(mapId, a.layerPath) -
        MapEventProcessor.getMapIndexFromOrderedLayerInfo(mapId, b.layerPath)
    );
    this.sortLegendLayersChildren(mapId, sortedLayers);

    this.getLayerState(mapId).setterActions.setLegendLayers(sortedLayers);
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

      if (layerPath.startsWith(`${layer.layerPath}/`) && layer.children?.length > 0) {
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

    // Set updated legend layers after delete
    this.getLayerState(mapId).setterActions.setLegendLayers(curLayers);
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
   * Reload layer.
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path of the layer to reload.
   */
  static reloadLayer(mapId: string, layerPath: string): void {
    // Delete layer through layer API
    MapEventProcessor.getMapViewerLayerAPI(mapId).reloadLayer(layerPath);
  }

  /**
   * Refresh layer and reset states.
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path of the layer to refresh.
   */
  static refreshLayer(mapId: string, layerPath: string): void {
    // Get the layer through layer API
    const layer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayer(layerPath);

    // Refresh the layer
    layer?.refresh(MapEventProcessor.getMapViewer(mapId).getProjection());

    // TODO Update after refactor, layerEntryConfig will not know initial settings
    const layerEntryConfig = MapEventProcessor.getMapViewerLayerAPI(mapId).getLayerEntryConfig(layerPath);

    // Reset layer states to original values
    const opacity = layerEntryConfig?.getInitialSettings().states?.opacity ?? 1; // default: 1
    const visibility = layerEntryConfig?.getInitialSettings().states?.visible ?? true; // default: true
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
  static setItemVisibility(mapId: string, layerPath: string, item: TypeLegendItem, visibility: boolean = true): void {
    // Get current layer legends
    const curLayers = this.getLayerState(mapId).legendLayers;

    // Get the particular object holding the items array itself from the store
    const layer = this.getLegendLayerInfo(mapId, layerPath);

    // If found
    if (layer) {
      // ! Change the visibility of the given item.
      // ! which happens to be the same object reference as the one in the items array here
      // TODO: Refactor - Rethink this pattern to find a better cohesive solution for ALL 'set' that go in the store and change them all
      // eslint-disable-next-line no-param-reassign
      item.isVisible = visibility;

      // Shadow-copy this specific array so that the hooks are triggered for this items array and this one only
      layer.items = [...layer.items];
    }

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

    // Get the particular object holding the items array itself from the store
    const layer = this.getLegendLayerInfo(mapId, layerPath);

    // Set item visibility on map and in legend layer item for each item in layer
    if (layer) {
      layer.items.forEach((item) => {
        MapEventProcessor.getMapViewerLayerAPI(mapId).setItemVisibility(layerPath, item, visibility, false);
        // eslint-disable-next-line no-param-reassign
        item.isVisible = visibility;
      });

      // Shadow-copy this specific array so that the hooks are triggered for this items array and this one only
      layer.items = [...layer.items];
    }

    // Set updated legend layers
    this.getLayerState(mapId).setterActions.setLegendLayers(curLayers);
  }

  /**
   * Recursively updates the opacity in provided legend layers of a layer and its children.
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
    isChild: boolean = false
  ): void {
    const layer = LegendEventProcessor.findLayerByPath(curLayers, layerPath);
    if (layer) {
      layer.opacity = opacity;
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
   * Sets the opacity of the layer and its children in the store.
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path of the layer to change.
   * @param {number} opacity - The opacity to set.
   */
  static setOpacityInStore(mapId: string, layerPath: string, opacity: number): void {
    const curLayers = this.getLayerState(mapId).legendLayers;
    this.#setOpacityInLayerAndChildren(mapId, curLayers, layerPath, opacity);

    // Set updated legend layers
    this.getLayerState(mapId).setterActions.setLegendLayers(curLayers);
  }

  /**
   * Sets the opacity of a layer.
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path of the layer to change.
   * @param {number} opacity - The opacity to set.
   * @param {boolean} updateLegendLayers - Whether to update the legend layers or not
   */
  static setLayerOpacity(mapId: string, layerPath: string, opacity: number, updateLegendLayers?: boolean): void {
    MapEventProcessor.getMapViewerLayerAPI(mapId).setLayerOpacity(layerPath, opacity, updateLegendLayers);
  }

  /**
   * Sets the layer hoverable capacity.
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path of the layer to change.
   * @param {boolean} hoverable - The hoverable state to set.
   */
  static setLayerHoverable(mapId: string, layerPath: string, hoverable: boolean): void {
    if (hoverable) MapEventProcessor.getMapViewerLayerAPI(mapId).hoverFeatureInfoLayerSet.enableHoverListener(layerPath);
    else MapEventProcessor.getMapViewerLayerAPI(mapId).hoverFeatureInfoLayerSet.disableHoverListener(layerPath);

    // ! Wrong pattern, need to be look at...
    // TODO: These setters take curLayers, modify an object indirectly (which happens to affect an object inside curLayers!),
    // TODO.CONT: and then return curLayers—making it appear unchanged when reading the code. This behavior needs careful review.
    const curLayers = this.getLayerState(mapId).legendLayers;
    this.getLegendLayerInfo(mapId, layerPath)!.hoverable = hoverable;

    // Set updated legend layers
    this.getLayerState(mapId).setterActions.setLegendLayers(curLayers);
  }

  /**
   * Sets the layer queryable capacity.
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path of the layer to change.
   * @param {boolean} queryable - The queryable state to set.
   */
  static setLayerQueryable(mapId: string, layerPath: string, queryable: boolean): void {
    if (queryable) MapEventProcessor.getMapViewerLayerAPI(mapId).featureInfoLayerSet.enableClickListener(layerPath);
    else MapEventProcessor.getMapViewerLayerAPI(mapId).featureInfoLayerSet.disableClickListener(layerPath);

    // ! Wrong pattern, need to be look at...
    // TODO: These setters take curLayers, modify an object indirectly (which happens to affect an object inside curLayers!),
    // TODO.CONT: and then return curLayers—making it appear unchanged when reading the code. This behavior needs careful review.
    const curLayers = this.getLayerState(mapId).legendLayers;
    this.getLegendLayerInfo(mapId, layerPath)!.queryable = queryable;

    // Set updated legend layers
    this.getLayerState(mapId).setterActions.setLegendLayers(curLayers);
  }

  /**
   * Filters features based on their visibility settings defined in the layer's unique value or class break style configuration.
   *
   * @static
   * @param {string} mapId - The unique identifier of the map instance
   * @param {string} layerPath - The path to the layer in the map configuration
   * @param {TypeFeatureInfoEntry[]} features - Array of features to filter
   *
   * @returns {TypeFeatureInfoEntry[]} Filtered array of features based on their visibility settings
   *
   * @description
   * This function processes features based on the layer's unique value style configuration:
   * - If the layer doesn't use unique value or class break styling, returns all features unchanged
   * - Features matching visible styles are included
   * - Features matching invisible styles are excluded
   * - Features with no matching style follow the defaultVisible setting
   */
  static getFeatureVisibleFromClassVibility(mapId: string, layerPath: string, features: TypeFeatureInfoEntry[]): TypeFeatureInfoEntry[] {
    // Get the layer config and geometry type
    const layerConfig = MapEventProcessor.getMapViewerLayerAPI(mapId).getLayerEntryConfig(layerPath) as AbstractBaseLayerEntryConfig;
    const [geometryType] = layerConfig.getTypeGeometries();

    // Get the style
    const layerStyle = layerConfig.getLayerStyle()?.[geometryType];
    let filteredFeatures = features;
    if (layerStyle && layerStyle.type === 'uniqueValue') {
      filteredFeatures = this.#processClassVisibilityUniqueValue(layerStyle, features);
    } else if (layerStyle && layerStyle.type === 'classBreaks') {
      filteredFeatures = this.#processClassVisibilityClassBreak(layerStyle, features);
    }

    return filteredFeatures;
  }

  /**
   * Processes features based on unique value style configuration to determine their visibility.
   *
   * @param {TypeUniqueValueStyleConfig} uniqueValueStyle - The unique value style configuration
   * @param {TypeFeatureInfoEntry[]} features - Array of features to process
   * @returns {TypeFeatureInfoEntry[]} Filtered array of features based on visibility rules
   *
   * @description
   * This function filters features based on their field values and the unique value style configuration:
   * - Creates sets of visible and invisible values for efficient lookup
   * - Combines multiple field values using semicolon separator
   * - Determines feature visibility based on:
   *   - Explicit visibility rules in the style configuration
   *   - Default visibility for values not matching any style rule
   *
   * @static
   * @private
   */
  static #processClassVisibilityUniqueValue(
    uniqueValueStyle: TypeLayerStyleSettings,
    features: TypeFeatureInfoEntry[]
  ): TypeFeatureInfoEntry[] {
    const styleUnique = uniqueValueStyle.info;

    // Create sets for visible and invisible values for faster lookup
    const visibleValues = new Set(styleUnique.filter((style) => style.visible).map((style) => style.values.join(';')));
    const unvisibleValues = new Set(styleUnique.filter((style) => !style.visible).map((style) => style.values.join(';')));

    // GV: Some esri layer has uniqueValue renderer but there is no field define in their metadata (i.e. e2424b6c-db0c-4996-9bc0-2ca2e6714d71).
    // TODO: The fields contain undefined, it should be empty. Check in new config api
    // TODO: This is a workaround
    if (uniqueValueStyle.fields[0] === undefined) uniqueValueStyle.fields.pop();

    // Filter features based on visibility
    return features.filter((feature) => {
      const fieldValues = uniqueValueStyle.fields.map((field) => feature.fieldInfo[field]?.value).join(';');

      return (
        visibleValues.has(fieldValues.toString()) ||
        (uniqueValueStyle.info[uniqueValueStyle.info.length - 1].visible && !unvisibleValues.has(fieldValues.toString()))
      );
    });
  }

  /**
   * Processes features based on class break style configuration to determine their visibility.
   *
   * @private
   *
   * @param {TypeClassBreakStyleConfig} classBreakStyle - The class break style configuration
   * @param {TypeFeatureInfoEntry[]} features - Array of features to process
   * @returns {TypeFeatureInfoEntry[]} Filtered array of features based on class break visibility rules
   *
   * @description
   * This function filters features based on numeric values falling within defined class breaks:
   * - Sorts class breaks by minimum value for efficient binary search
   * - Creates optimized lookup structure for break points
   * - Uses binary search to find the appropriate class break for each feature
   * - Determines feature visibility based on:
   *   - Whether the feature's value falls within a class break range
   *   - The visibility setting of the matching class break
   *   - Default visibility for values not matching any class break
   *
   * @static
   * @private
   */
  static #processClassVisibilityClassBreak(
    classBreakStyle: TypeLayerStyleSettings,
    features: TypeFeatureInfoEntry[]
  ): TypeFeatureInfoEntry[] {
    const classBreaks = classBreakStyle.info;

    // Sort class breaks by minValue for binary search
    // GV: Values can be number, date, string, null or undefined. Should it be only Date or Number
    // GV: undefined or null should not be allowed in class break style
    const sortedBreaks = [...classBreaks].sort((a, b) => (a.values[0] as number) - (b.values[0] as number));

    // Create an optimized lookup structure
    interface ClassBreakPoint {
      minValue: number;
      maxValue: number;
      visible: boolean;
    }
    const breakPoints = sortedBreaks.map(
      (brk): ClassBreakPoint => ({
        minValue: brk.values[0] as number,
        maxValue: brk.values[1] as number,
        visible: brk.visible,
      })
    );

    // Binary search function to find the appropriate class break
    const findClassBreak = (value: number): ClassBreakPoint | null => {
      let left = 0;
      let right = breakPoints.length - 1;

      // Binary search through sorted break points to find matching class break
      while (left <= right) {
        // Calculate middle index to divide search space
        const mid = Math.floor((left + right) / 2);
        const breakPoint = breakPoints[mid];

        // Check if value falls within current break point's range
        if (value >= breakPoint.minValue && value <= breakPoint.maxValue) {
          // Found matching break point, return it
          return breakPoint;
        }

        // If value is less than current break point's minimum,
        // search in lower half of remaining range
        if (value < breakPoint.minValue) {
          right = mid - 1;
        } else {
          // If value is greater than current break point's maximum,
          // search in upper half of remaining range
          left = mid + 1;
        }
      }

      return null;
    };

    // Filter features using binary search
    return features.filter((feature) => {
      const val = feature.fieldInfo[String(classBreakStyle.fields[0])]?.value;
      // eslint-disable-next-line eqeqeq
      const fieldValue = val != null ? parseFloat(String(val)) : 0;

      // eslint-disable-next-line no-restricted-globals
      if (isNaN(fieldValue)) {
        return classBreakStyle.info[classBreakStyle.info.length - 1].visible;
      }

      const matchingBreak = findClassBreak(fieldValue);
      return matchingBreak ? matchingBreak.visible : classBreakStyle.info[classBreakStyle.info.length - 1].visible;
    });
  }

  /**
   * Sorts legend layers children recursively in given legend layers list.
   * @param {string} mapId - The ID of the map.
   * @param {TypeLegendLayer[]} legendLayerList - The list to sort.
   */
  static sortLegendLayersChildren = (mapId: string, legendLayerList: TypeLegendLayer[]): void => {
    legendLayerList.forEach((legendLayer) => {
      if (legendLayer.children.length)
        legendLayer.children.sort(
          (a, b) =>
            MapEventProcessor.getMapIndexFromOrderedLayerInfo(mapId, a.layerPath) -
            MapEventProcessor.getMapIndexFromOrderedLayerInfo(mapId, b.layerPath)
        );
      this.sortLegendLayersChildren(mapId, legendLayer.children);
    });
  };
}
