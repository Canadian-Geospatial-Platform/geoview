import type { Extent, TypeLayerStyleSettings, TypeFeatureInfoEntry, TypeStyleGeometry } from '@/api/types/map-schema-types';
import type { TimeDimension } from '@/core/utils/date-mgt';
import type { TypeGeoviewLayerType, TypeLayerControls } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { TypeLegendLayer, TypeLegendLayerItem, TypeLegendItem } from '@/core/components/layers/types';
import { isGeoTIFFLegend, isImageStaticLegend, isVectorLegend } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { ILayerState, TypeLegend, TypeLegendResultSetEntry } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { LayerWrongTypeError } from '@/core/exceptions/layer-exceptions';
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
   * Gets the layer state slice from the store for the specified map.
   * Provides access to legend layers, selection state, and layer panel configuration.
   * @param {string} mapId - The map identifier
   * @return {ILayerState} The layer state slice
   * @static
   * @protected
   */
  protected static getLayerState(mapId: string): ILayerState {
    // Return the layer state
    return super.getState(mapId).layerState;
  }

  /**
   * Sets the selected layer path in the layers tab panel.
   * Updates which layer is currently selected in the legend/layers panel.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path to select
   * @return {void}
   * @static
   */
  static setSelectedLayersTabLayer(mapId: string, layerPath: string): void {
    // Save in store
    this.getLayerState(mapId).setterActions.setSelectedLayerPath(layerPath);
  }

  /**
   * Reorders legend layers based on their map rendering order.
   * Sorts the legend layers array to match the z-index order of layers on the map.
   * @param {string} mapId - The map identifier
   * @return {void}
   * @static
   */
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
   * Gets a specific property from the layer panel state.
   * Provides type-safe access to highlighted layer, selected path, display state, and deletion status.
   * @param {string} mapId - The map identifier
   * @param {'highlightedLayer' | 'selectedLayerPath' | 'displayState' | 'layerDeleteInProgress'} state - The state property key to retrieve
   * @return {string | boolean | null | undefined} The requested state property value
   * @static
   */
  static getLayerPanelState(
    mapId: string,
    state: 'highlightedLayer' | 'selectedLayerPath' | 'displayState' | 'layerDeleteInProgress'
  ): string | boolean | null | undefined {
    return this.getLayerState(mapId)[state];
  }

  /**
   * Gets a legend layer entry by its path.
   * Searches through the legend layers hierarchy to find the specified layer.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The path of the layer to retrieve
   * @return {TypeLegendLayer | undefined} The legend layer if found, undefined otherwise
   * @static
   */
  static getLegendLayerInfo(mapId: string, layerPath: string): TypeLegendLayer | undefined {
    const layers = LegendEventProcessor.getLayerState(mapId).legendLayers;
    return this.findLayerByPath(layers, layerPath);
  }

  /**
   * Gets the complete array of legend layers for the map.
   * Returns all root-level legend layers including their hierarchical children.
   * @param {string} mapId - The map identifier
   * @return {TypeLegendLayer[]} The array of legend layers
   * @static
   */
  static getLegendLayers(mapId: string): TypeLegendLayer[] {
    return LegendEventProcessor.getLayerState(mapId).legendLayers;
  }

  /**
   * Gets the geographic bounds (extent) for a specific layer.
   * Returns the extent as [minX, minY, maxX, maxY] in the map's projection.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path
   * @return {Extent | undefined} The extent of the layer, or undefined if not available
   * @static
   */
  static getLayerBounds(mapId: string, layerPath: string): Extent | undefined {
    // Find the layer for the given layer path
    const layers = LegendEventProcessor.getLayerState(mapId).legendLayers;
    const layer = this.findLayerByPath(layers, layerPath);
    return layer?.bounds;
  }

  /**
   * Calculates the geographic bounds of a layer and stores the result in the legend state.
   * This method:
   * - Computes layer bounds via MapViewer API
   * - Validates they are finite
   * - Locates the legend layer by path
   * - Updates its bounds property
   * - Persists to store
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The unique hierarchical path of the layer whose bounds should be calculated
   * @return {void}
   * @static
   */
  static calculateLayerBoundsAndSaveToStore(mapId: string, layerPath: string): void {
    // Calculate the bounds of the layer at the given layerPath
    const newBounds = MapEventProcessor.getMapViewerLayerAPI(mapId).calculateBounds(layerPath);

    // If calculated successfully
    if (newBounds && !newBounds.includes(Infinity)) {
      const layers = LegendEventProcessor.getLayerState(mapId).legendLayers;
      const layer = this.findLayerByPath(layers, layerPath);

      // If found
      if (layer) {
        // Set layer bounds
        layer.bounds = newBounds;

        // Set updated legend layers
        this.getLayerState(mapId).setterActions.setLegendLayers(layers);
      }
    }
  }

  /**
   * Retrieves the default filter configuration from layer entry config.
   * Checks the layer entry configuration for a layerFilter property and returns its value.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The path to the layer
   * @return {string | undefined} The default filter string, or undefined if not available
   * @static
   */
  static getLayerEntryConfigDefaultFilter(mapId: string, layerPath: string): string | undefined {
    const entryConfig = MapEventProcessor.getMapViewerLayerAPI(mapId).getLayerEntryConfigIfExists(layerPath);

    // Check if entryConfig exists and has layerFilter property
    return entryConfig && 'layerFilter' in entryConfig ? (entryConfig.layerFilter as string) : undefined;
  }

  /**
   * Retrieves the projection code from the layer's service metadata.
   * Fetches the GeoView layer and calls getMetadataProjection if available to obtain the projection code.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The path to the layer
   * @return {string | undefined} The projection code (e.g., 'EPSG:3857'), or undefined if not available
   * @static
   */
  static getLayerServiceProjection(mapId: string, layerPath: string): string | undefined {
    // TODO: Check - Do we want it to throw instead of handling when undefined? (call getGeoviewLayer instead of getGeoviewLayerIfExists)
    const geoviewLayer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayerIfExists(layerPath);

    if (geoviewLayer && 'getMetadataProjection' in geoviewLayer && typeof geoviewLayer.getMetadataProjection === 'function') {
      const projection = geoviewLayer.getMetadataProjection();
      return projection && typeof projection.getCode === 'function' ? projection.getCode() : undefined;
    }

    return undefined;
  }

  /**
   * Sets the geographic bounds for a specific layer in the legend.
   * Updates the layer's bounds property and persists changes to the store.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path
   * @param {Extent | undefined} bounds - The extent to set as [minX, minY, maxX, maxY], or undefined to clear
   * @return {void}
   * @static
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
   * Sets whether a layer is queryable (can be clicked for feature info).
   * Delegates to layer API which handles both layer state and store updates.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path
   * @param {boolean} queryable - True to make layer queryable, false otherwise
   * @return {void}
   * @static
   */
  // TODO: REFACTOR EVENT PROCESSOR - The 'EventProcessor' classes could use some rethinking, especially when they end up calling the layer api to execute something like
  // TO.DOCONT: here and in multiple other places. This TODO considers also the next function here 'setLayerQueryableInStore' which saves the state to the store.
  // TO.DOCONT: Is there a big benefit to having this function here which simply redirect the call to the layer api - which is basically hiding the coupling to the 'api'?
  // TO.DOCONT: It seems a bit convoluted that the event processor would both perform the action via layer api AND be responsible to update the store (which is a function also called by the layer api).
  // TO.DOCONT: Why not explicitely couple the layer api with the code needing it instead of hiding it via a jump to the event processor which
  static setLayerQueryable(mapId: string, layerPath: string, queryable: boolean): void {
    MapEventProcessor.getMapViewerLayerAPI(mapId).setLayerQueryable(layerPath, queryable);
  }

  /**
   * Updates the queryable state of a layer in the store without affecting the layer itself.
   * Finds the layer by path, updates its queryable property, and persists to store.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The unique path identifier of the layer
   * @param {boolean} queryable - The new queryable state
   * @return {void}
   * @static
   */
  static setLayerQueryableInStore(mapId: string, layerPath: string, queryable: boolean): void {
    // Find the layer for the given layer path
    const layers = LegendEventProcessor.getLayerState(mapId).legendLayers;
    const layer = this.findLayerByPath(layers, layerPath);

    if (layer) {
      // Set layer queryable
      layer.queryable = queryable;
      // Set updated legend layers
      this.getLayerState(mapId).setterActions.setLegendLayers(layers);
    }
  }

  /**
   * Sets whether a layer is hoverable (responds to mouse hover for tooltips/highlights).
   * Delegates to layer API which handles both layer state and store updates.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path
   * @param {boolean} queryable - True to make layer hoverable, false otherwise
   * @return {void}
   * @static
   */
  static setLayerHoverable(mapId: string, layerPath: string, queryable: boolean): void {
    MapEventProcessor.getMapViewerLayerAPI(mapId).setLayerHoverable(layerPath, queryable);
  }

  /**
   * Updates the hoverable state of a layer in the store without affecting the layer itself.
   * Finds the layer by path, updates its hoverable property, and persists to store.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The unique path identifier of the layer
   * @param {boolean} hoverable - The new hoverable state
   * @return {void}
   * @static
   */
  static setLayerHoverableInStore(mapId: string, layerPath: string, hoverable: boolean): void {
    // Find the layer for the given layer path
    const layers = LegendEventProcessor.getLayerState(mapId).legendLayers;
    const layer = this.findLayerByPath(layers, layerPath);

    if (layer) {
      // Set layer queryable
      layer.hoverable = hoverable;
      // Set updated legend layers
      this.getLayerState(mapId).setterActions.setLegendLayers(layers);
    }
  }

  /**
   * Sets the global loading indicator for whether any layers are currently loading.
   * Used to show/hide loading spinners in the layers panel.
   * @param {string} mapId - The map identifier
   * @param {boolean} areLoading - True if any layer is loading, false if all layers are loaded
   * @return {void}
   * @static
   */
  static setLayersAreLoading(mapId: string, areLoading: boolean): void {
    // Update the store
    this.getLayerState(mapId).setterActions.setLayersAreLoading(areLoading);
  }

  /**
   * Calculates the geographic extent containing the specified features.
   * Retrieves features by their object IDs and computes their combined bounding box.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path
   * @param {number[]} objectIds - The feature IDs to calculate extent for
   * @param {string} [outfield] - Optional ID field name for services requiring outfields parameter
   * @return {Promise<Extent>} Promise that resolves with the extent [minX, minY, maxX, maxY]
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
   * @static
   */
  static getExtentFromFeatures(mapId: string, layerPath: string, objectIds: number[], outfield?: string): Promise<Extent> {
    // Get the layer api
    const layerApi = MapEventProcessor.getMapViewerLayerAPI(mapId);

    // Get the layer
    const layer = layerApi.getGeoviewLayer(layerPath);

    // If not a GVLayer
    if (!(layer instanceof AbstractGVLayer)) throw new LayerWrongTypeError(layerPath, layer.getLayerName());

    // Get extent from features calling the GV Layer method
    return layer.getExtentFromFeatures(objectIds, layerApi.mapViewer.getProjection(), outfield);
  }

  /**
   * Retrieves the temporal dimension information for a layer if it supports time-based data.
   * Checks if the layer has a getTimeDimension method and returns its time dimension configuration.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The path to the layer
   * @return {TimeDimension | undefined} The temporal dimension information, or undefined if not available
   * @static
   */
  static getLayerTimeDimension(mapId: string, layerPath: string): TimeDimension | undefined {
    // Get the layer api
    const layerApi = MapEventProcessor.getMapViewerLayerAPI(mapId);

    // Get the layer
    const layer = layerApi.getGeoviewLayerIfExists(layerPath);

    // Get the temporal dimension calling the GV Layer method, check if getTimeDimension exists and is a function
    if (layer instanceof AbstractGVLayer) return layer.getTimeDimension();
    return undefined;
  }

  /**
   * Generates icon images from layer legend style information.
   * Converts legend canvas elements and style configurations into icon data URLs for display in the legend panel.
   * Handles both vector legends (with geometry-specific styles) and raster legends.
   * @param {TypeLegend | null | undefined} layerLegend - The layer legend containing style information
   * @return {TypeLegendLayerItem[] | undefined} Array of legend items with icon images, or undefined if no legend
   * @static
   */
  static getLayerIconImage(layerLegend: TypeLegend | null | undefined): TypeLegendLayerItem[] | undefined {
    // TODO: Refactor - Move this function to a utility class instead of at the 'processor' level so it's safer to call from a layer framework level class
    const iconDetails: TypeLegendLayerItem[] = [];
    if (layerLegend) {
      if (isVectorLegend(layerLegend)) {
        Object.entries(layerLegend.legend).forEach(([key, styleRepresentation]) => {
          const geometryType = key as TypeStyleGeometry;
          const styleSettings = layerLegend.styleConfig![geometryType]!;
          const iconDetailsEntry: TypeLegendLayerItem = {};
          iconDetailsEntry.geometryType = geometryType;

          if (styleSettings.type === 'simple') {
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
      } else {
        const iconDetailsEntry: TypeLegendLayerItem = {};
        // Use html canvas if available
        const htmlElement = layerLegend.legend as HTMLCanvasElement | undefined;
        if (htmlElement?.toDataURL) {
          iconDetailsEntry.iconImage = htmlElement.toDataURL();
        } else {
          // No styles or image, no icon
          iconDetailsEntry.iconImage = 'no data';
        }
        iconDetails.push(iconDetailsEntry);
      }

      return iconDetails;
    }
    return undefined;
  }

  /**
   * Propagates legend layer set information to the store.
   * Creates or updates legend layer entries with icons, controls, and metadata from the legend result set.
   * @param {string} mapId - The map identifier
   * @param {TypeLegendResultSetEntry} legendResultSetEntry - The legend result set entry to propagate
   * @return {void}
   * @static
   */
  static propagateLegendToStore(mapId: string, legendResultSetEntry: TypeLegendResultSetEntry): void {
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
    // TO.DOCONT: The layerId set by this array has the map identifier in front... remove
    const createNewLegendEntries = (currentLevel: number, existingEntries: TypeLegendLayer[]): void => {
      // If outside of range of layer paths, stop
      if (layerPathNodes.length < currentLevel) return;

      const suffix = layerPathNodes.slice(0, currentLevel);
      const entryLayerPath = suffix.join('/');

      // Get the layer config
      const layerConfig = MapEventProcessor.getMapViewerLayerAPI(mapId).getLayerEntryConfigIfExists(entryLayerPath);

      // If not found, skip
      if (!layerConfig) return;

      // Get the layer if exists
      const layer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayerIfExists(entryLayerPath);

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
            type: layerConfig.getEntryType() as TypeGeoviewLayerType, // TODO: Check - Bug - This typing is invalid, but we have to keep it for it to work for now...
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
        const icons = LegendEventProcessor.getLayerIconImage(legendResultSetEntry.data);

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
          opacity: layerConfig.getInitialSettings()?.states?.opacity ?? 1, // default: 1
          hoverable: layerConfig.getInitialSettings()?.states?.hoverable, // default: true
          queryable: layerConfig.getInitialSettings()?.states?.queryable, // default: true
          items: [] as TypeLegendItem[],
          children: [] as TypeLegendLayer[],
          icons: icons || [],
          url: layerConfig.getMetadataAccessPath(),
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

        // Also take care of GeoTIFF by storing the iconImage into the icon property on-the-fly
        if (isGeoTIFFLegend(legendResultSetEntry.data!) && icons && icons.length > 0) {
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
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path to set as the highlighted layer
   * @return {void}
   * @static
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
   * @return {TypeLegendLayer | undefined}
   * @static
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
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path of the layer to change.
   * @return {void}
   * @static
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
   * @param {string} mapId - The map identifier
   * @param {TypeLegendLayer[]} legendLayers - The legend layers list to remove layer from.
   * @param {string} layerPath - The layer path of the layer to change.
   * @return {void}
   * @static
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
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path of the layer to change.
   * @return {void}
   * @static
   */
  static deleteLayer(mapId: string, layerPath: string): void {
    // Delete layer through layer API
    MapEventProcessor.getMapViewerLayerAPI(mapId).removeLayerUsingPath(layerPath);
  }

  /**
   * Reload layer.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path of the layer to reload.
   * @return {void}
   * @static
   */
  static reloadLayer(mapId: string, layerPath: string): void {
    // Delete layer through layer API
    MapEventProcessor.getMapViewerLayerAPI(mapId).reloadLayer(layerPath);
  }

  /**
   * Refresh layer and reset states.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path of the layer to refresh.
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   */
  static refreshLayer(mapId: string, layerPath: string): void {
    // Get the layer through layer API
    const layer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayer(layerPath);

    // Refresh the layer
    layer.refresh(MapEventProcessor.getMapViewer(mapId).getProjection());

    // Get the layer config
    const layerConfig = layer.getLayerConfig();

    // Reset layer states to original values
    const opacity = layerConfig.getInitialSettings()?.states?.opacity ?? 1; // default: 1
    const visibility = layerConfig.getInitialSettings()?.states?.visible ?? true; // default: true
    LegendEventProcessor.setLayerOpacity(mapId, layerPath, opacity);
    MapEventProcessor.setOrToggleMapLayerVisibility(mapId, layerPath, visibility);

    if (visibility) LegendEventProcessor.setAllItemsVisibility(mapId, layerPath, visibility);
  }

  /**
   * Set visibility of an item in legend layers.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path of the layer to change.
   * @param {TypeLegendItem} item - The item to change.
   * @param {boolean} [visibility=true] - The new visibility.
   * @return {void}
   * @static
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
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path of the layer to change.
   * @param {TypeLegendItem} item - The item to change.
   * @return {void}
   * @static
   */
  static toggleItemVisibility(mapId: string, layerPath: string, item: TypeLegendItem): void {
    MapEventProcessor.getMapViewerLayerAPI(mapId).setItemVisibility(layerPath, item, !item.isVisible);
  }

  /**
   * Sets the visibility of all items in the layer.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path of the layer to change.
   * @param {boolean} visibility - The visibility.
   * @return {void}
   * @static
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
   * @param {string} mapId - The map identifier
   * @param {TypeLegendLayer[]} curLayers - The current legend layers.
   * @param {string} layerPath - The layer path.
   * @param {number} opacity - The opacity to set.
   * @param {boolean} [isChild=false] - Is the layer a child layer.
   * @return {void}
   * @static
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
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path of the layer to change.
   * @param {number} opacity - The opacity to set.
   * @return {void}
   * @static
   */
  static setOpacityInStore(mapId: string, layerPath: string, opacity: number): void {
    const curLayers = this.getLayerState(mapId).legendLayers;
    this.#setOpacityInLayerAndChildren(mapId, curLayers, layerPath, opacity);

    // Set updated legend layers
    this.getLayerState(mapId).setterActions.setLegendLayers(curLayers);
  }

  /**
   * Sets the opacity of a layer.
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path of the layer to change.
   * @param {number} opacity - The opacity to set.
   * @param {boolean} [updateLegendLayers] - Whether to update the legend layers or not
   * @return {void}
   * @static
   */
  static setLayerOpacity(mapId: string, layerPath: string, opacity: number, updateLegendLayers?: boolean): void {
    // Redirect
    MapEventProcessor.getMapViewerLayerAPI(mapId).setLayerOpacity(layerPath, opacity, updateLegendLayers);
  }

  /**
   * Filters features based on their visibility settings defined in the layer's unique value or class break style configuration.
   *
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The path to the layer in the map configuration
   * @param {TypeFeatureInfoEntry[]} features - Array of features to filter
   * @return {TypeFeatureInfoEntry[]} Filtered array of features based on their visibility settings
   *
   * @description
   * This function processes features based on the layer's unique value style configuration:
   * - If the layer doesn't use unique value or class break styling, returns all features unchanged
   * - Features matching visible styles are included
   * - Features matching invisible styles are excluded
   * - Features with no matching style follow the defaultVisible setting
   * @static
   */
  static processClassVisibility(mapId: string, layerPath: string, features: TypeFeatureInfoEntry[]): TypeFeatureInfoEntry[] {
    // Get the layer config and geometry type
    const layerConfig = MapEventProcessor.getMapViewerLayerAPI(mapId).getLayerEntryConfigRegular(layerPath);

    // Get the layer style settings
    const layerStyleSettings = layerConfig.getLayerStyleSettings();

    // If has geometry field
    let filteredFeatures = features;
    if (layerStyleSettings) {
      if (layerStyleSettings.type === 'uniqueValue') {
        filteredFeatures = this.#processClassVisibilityUniqueValue(layerStyleSettings, features);
      } else if (layerStyleSettings.type === 'classBreaks') {
        filteredFeatures = this.#processClassVisibilityClassBreak(layerStyleSettings, features);
      }
    }

    // Return the filtered features
    return filteredFeatures;
  }

  /**
   * Processes features based on unique value style configuration to determine their visibility.
   * @param {TypeUniqueValueStyleConfig} uniqueValueStyle - The unique value style configuration
   * @param {TypeFeatureInfoEntry[]} features - Array of features to process
   * @return {TypeFeatureInfoEntry[]} Filtered array of features based on visibility rules
   *
   * @description
   * This function filters features based on their field values and the unique value style configuration:
   * - Creates sets of visible and invisible values for efficient lookup
   * - Combines multiple field values using semicolon separator
   * - Determines feature visibility based on:
   *   - Explicit visibility rules in the style configuration
   *   - Default visibility for values not matching any style rule
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

    // TODO: COMMENTED CODE - This seems to be unnecessary now, commenting it for testing (2025-11-24)
    // // GV: Some esri layer has uniqueValue renderer but there is no field define in their metadata (i.e. e2424b6c-db0c-4996-9bc0-2ca2e6714d71).
    // // TODO: The fields contain undefined, it should be empty. Check in new config api
    // // TODO: This is a workaround
    // if (uniqueValueStyle.fields[0] === undefined) uniqueValueStyle.fields.pop();

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
   * @param {TypeClassBreakStyleConfig} classBreakStyle - The class break style configuration
   * @param {TypeFeatureInfoEntry[]} features - Array of features to process
   * @return {TypeFeatureInfoEntry[]} Filtered array of features based on class break visibility rules
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
   * @param {string} mapId - The map identifier
   * @param {TypeLegendLayer[]} legendLayerList - The list to sort.
   * @return {void}
   * @static
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
