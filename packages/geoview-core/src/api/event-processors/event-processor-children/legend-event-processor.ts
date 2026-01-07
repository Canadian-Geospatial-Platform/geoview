import type { Extent, TypeStyleGeometry } from '@/api/types/map-schema-types';
import type { TemporalMode, TimeDimension, TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import type { TypeGeoviewLayerType, TypeLayerControls } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { TypeLegendLayer, TypeLegendLayerItem, TypeLegendItem } from '@/core/components/layers/types';
import { isGeoTIFFLegend, isImageStaticLegend, isVectorLegend } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { ILayerState, TypeLegend, TypeLegendResultSetEntry } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';

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
   * @param {string} mapId - The mapId
   * @returns {ILayerState} The Layer state
   * @static
   * @protected
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
   * @static
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
   * @static
   */
  static getLegendLayerInfo(mapId: string, layerPath: string): TypeLegendLayer | undefined {
    const layers = LegendEventProcessor.getLayerState(mapId).legendLayers;
    return this.findLayerByPath(layers, layerPath);
  }

  /**
   * Gets the full legend layers list
   * @param {string} mapId - The mapId
   * @returns {TypeLegendLayer[]} The list of legend layers
   * @static
   */
  static getLegendLayers(mapId: string): TypeLegendLayer[] {
    return LegendEventProcessor.getLayerState(mapId).legendLayers;
  }

  /**
   * Gets the layer bounds for a layer path
   * @param {string} mapId - The map id
   * @param {string} layerPath - The layer path
   * @returns {Extent | undefined} The extent of the layer at the given path
   * @static
   */
  static getLayerBounds(mapId: string, layerPath: string): Extent | undefined {
    // Find the layer for the given layer path
    const layers = LegendEventProcessor.getLayerState(mapId).legendLayers;
    const layer = this.findLayerByPath(layers, layerPath);
    return layer?.bounds;
  }

  /**
   * Calculates the geographic bounds of a layer identified by its layer path
   * and stores the result in the layer's state within the legend.
   * This method:
   *  1. Calls the MapViewer API to compute the layer's bounds.
   *  2. Validates that the computed bounds are finite.
   *  3. Locates the corresponding legend layer by its path.
   *  4. Updates the layer's `bounds` property.
   *  5. Persists the updated legend state.
   * @param {string} mapId - Identifier of the map instance containing the layer.
   * @param {string} layerPath - The unique hierarchical path of the layer whose
   *   bounds should be calculated and stored.
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
   * Retrieves the projection code for a specific layer.
   *
   * @param {string} mapId - The unique identifier of the map instance.
   * @param {string} layerPath - The path to the layer.
   * @returns {string | undefined} - The projection code of the layer, or `undefined` if not available.
   * @description
   * This method fetches the Geoview layer for the specified layer path and checks if it has a `getMetadataProjection` method.
   * If the method exists, it retrieves the projection object and returns its code using the `getCode` method.
   * If the projection or its code is not available, the method returns `undefined`.
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
   * Sets the layer bounds for a layer path
   * @param {string} mapId - The map id
   * @param {string} layerPath - The layer path
   * @param {Extent | undefined} bounds - The extent of the layer at the given path
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
   * Sets the layer queryable.
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path of the layer to change.
   * @param {boolean} queryable - The queryable state to set.
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
   * Updates the "queryable" state of a layer in the store for a given map.
   * Finds the layer by its `layerPath` in the legend layers of the specified `mapId`.
   * If the layer exists, updates its `queryable` property and writes the updated
   * legend layers back to the store.
   * @param {string} mapId - The ID of the map whose layer state should be updated.
   * @param {string} layerPath - The unique path/identifier of the layer to update.
   * @param {boolean} queryable - The new queryable state to set for the layer.
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
   * Sets the layer hoverable.
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path of the layer to change.
   * @param {boolean} queryable - The queryable state to set.
   * @static
   */
  static setLayerHoverable(mapId: string, layerPath: string, queryable: boolean): void {
    MapEventProcessor.getMapViewerLayerAPI(mapId).setLayerHoverable(layerPath, queryable);
  }

  /**
   * Updates the "hoverable" state of a layer in the store for a given map.
   * Finds the layer by its `layerPath` in the legend layers of the specified `mapId`.
   * If the layer exists, updates its `hoverable` property and writes the updated
   * legend layers back to the store.
   * @param {string} mapId - The ID of the map whose layer state should be updated.
   * @param {string} layerPath - The unique path/identifier of the layer to update.
   * @param {boolean} hoverable - The new hoverable state to set for the layer.
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
   * Retrieves the display date format configured for a specific layer.
   * @param {string} mapId - The unique identifier of the map.
   * @param {string} layerPath - The unique path identifying the layer.
   * @returns {TypeDisplayDateFormat | undefined} The configured display date format
   * for the layer, or `undefined` if the layer is not found or no format is set.
   * @static
   */
  static getLayerDisplayDateFormat(mapId: string, layerPath: string): TypeDisplayDateFormat | undefined {
    // Find the layer for the given layer path
    const layers = LegendEventProcessor.getLayerState(mapId).legendLayers;
    return this.findLayerByPath(layers, layerPath)?.displayDateFormat;
  }

  /**
   * Applies a display date format to a layer through the map viewer layer API.
   * This method forwards the request to the map viewer, allowing the layer
   * implementation to react to the new display date format (e.g. for rendering
   * or querying purposes).
   * @param {string} mapId - The unique identifier of the map.
   * @param {string} layerPath - The unique path identifying the layer.
   * @param {TypeDisplayDateFormat} displayDateFormat - The date format to apply
   * when displaying date values for the layer.
   * @static
   */
  static setLayerDisplayDateFormat(mapId: string, layerPath: string, displayDateFormat: TypeDisplayDateFormat): void {
    MapEventProcessor.getMapViewerLayerAPI(mapId).setLayerDisplayDateFormat(layerPath, displayDateFormat);
  }

  /**
   * Persists the display date format for a specific layer in the application store.
   * This updates the legend layer state so that the selected display date format
   * is retained and can be reused by UI components (e.g. legends, tooltips)
   * without directly interacting with the map viewer.
   * @param {string} mapId - The unique identifier of the map.
   * @param {string} layerPath - The unique path identifying the layer.
   * @param {TypeDisplayDateFormat} displayDateFormat - The date format to store
   * for displaying date values associated with the layer.
   * @static
   */
  static setLayerDisplayDateFormatInStore(mapId: string, layerPath: string, displayDateFormat: TypeDisplayDateFormat): void {
    // Find the layer for the given layer path
    const layers = LegendEventProcessor.getLayerState(mapId).legendLayers;
    const layer = this.findLayerByPath(layers, layerPath);

    if (layer) {
      // Set layer display date format
      layer.displayDateFormat = displayDateFormat;
      // Set updated legend layers
      this.getLayerState(mapId).setterActions.setLegendLayers(layers);
    }
  }

  /**
   * Persists the display date format (short) for a specific layer in the application store.
   * Short means the date should be displayed in a more compact format.
   * This updates the legend layer state so that the selected display date format
   * is retained and can be reused by UI components (e.g. legends, tooltips)
   * without directly interacting with the map viewer.
   * @param {string} mapId - The unique identifier of the map.
   * @param {string} layerPath - The unique path identifying the layer.
   * @param {TypeDisplayDateFormat} displayDateFormat - The date format to store
   * for displaying date values associated with the layer.
   * @static
   */
  static setLayerDisplayDateFormatShortInStore(mapId: string, layerPath: string, displayDateFormat: TypeDisplayDateFormat): void {
    // Find the layer for the given layer path
    const layers = LegendEventProcessor.getLayerState(mapId).legendLayers;
    const layer = this.findLayerByPath(layers, layerPath);

    if (layer) {
      // Set layer display date format short
      layer.displayDateFormatShort = displayDateFormat;
      // Set updated legend layers
      this.getLayerState(mapId).setterActions.setLegendLayers(layers);
    }
  }

  /**
   * Persists the date temporal mode for a specific layer in the application store.
   * This updates the legend layer state so that the selected temporal mode
   * is retained and can be reused by UI components (e.g. legends, tooltips)
   * without directly interacting with the map viewer.
   * @param {string} mapId - The unique identifier of the map.
   * @param {string} layerPath - The unique path identifying the layer.
   * @param {TemporalMode} temporalMode - The date format to store
   * for displaying date values associated with the layer.
   * @static
   */
  static setLayerDateTemporalInStore(mapId: string, layerPath: string, temporalMode: TemporalMode): void {
    // Find the layer for the given layer path
    const layers = LegendEventProcessor.getLayerState(mapId).legendLayers;
    const layer = this.findLayerByPath(layers, layerPath);

    if (layer) {
      // Set layer queryable
      layer.dateTemporalMode = temporalMode;
      // Set updated legend layers
      this.getLayerState(mapId).setterActions.setLegendLayers(layers);
    }
  }

  /**
   * Sets the layersAreLoading flag in the store
   * @param {string} mapId - The map id
   * @param {boolean} areLoading - Indicator if any layer is currently loading
   * @static
   */
  static setLayersAreLoading(mapId: string, areLoading: boolean): void {
    // Update the store
    this.getLayerState(mapId).setterActions.setLayersAreLoading(areLoading);
  }

  /**
   * Gets the extent of a feature or group of features
   * @param {string} mapId - The map identifier
   * @param {string} layerPath - The layer path
   * @param {number[]} objectIds - The IDs of features to get extents from.
   * @param {string} outfield - ID field to return for services that require a value in outfields.
   * @returns {Promise<Extent>} The extent of the feature, if available
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer was of wrong type.
   * @static
   */
  static getExtentFromFeatures(mapId: string, layerPath: string, objectIds: number[], outfield?: string): Promise<Extent> {
    // Get the layer api
    const layerApi = MapEventProcessor.getMapViewerLayerAPI(mapId);

    // Get the layer
    const layer = layerApi.getGeoviewLayerRegular(layerPath);

    // Get extent from features calling the GV Layer method
    return layer.getExtentFromFeatures(objectIds, layerApi.mapViewer.getProjection(), outfield);
  }

  /**
   * Retrieves the native time dimension metadata for a specific layer.
   * This method looks up the GeoView layer associated with the provided
   * `layerPath` and, if available, returns its time dimension information
   * via the layer's `getTimeDimension()` implementation.
   * @param {string} mapId - The unique identifier of the map instance.
   * @param {string} layerPath - The fully qualified path identifying the layer.
   * @returns The layer's {@link TimeDimension} metadata if supported;
   * otherwise `undefined` if the layer does not exist or does not expose
   * temporal dimension information.
   * @remarks
   * This method does not return time-slider state or processed slider values.
   * For time-slider–related logic, see `TimeSliderEventProcessor.getInitialTimeSliderValues`.
   * @static
   */
  static getLayerTimeDimension(mapId: string, layerPath: string): TimeDimension | undefined {
    // Get the layer api
    const layerApi = MapEventProcessor.getMapViewerLayerAPI(mapId);

    // Get the layer
    const layer = layerApi.getGeoviewLayerIfExists(layerPath);

    // If right type
    if (layer instanceof AbstractGVLayer) {
      // Return the temporal dimension if any
      return layer.getTimeDimension();
    }

    // None
    return undefined;
  }

  /**
   * Gets the legend icon images for a given layer legend
   * @param {TypeLegend | null | undefined} layerLegend - The legend of the layer
   * @returns {TypeLegendLayerItem[] | undefined} The legend icon images details
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
   * This method propagates the information stored in the legend layer set to the store.
   *
   * @param {string} mapId - The map identifier.
   * @param {TypeLegendResultSetEntry} legendResultSetEntry - The legend result set that triggered the propagation.
   * @static
   */
  static propagateLegendToStore(mapId: string, legendResultSetEntry: TypeLegendResultSetEntry): void {
    // TODO: REFACTOR - This whole function should be refactored to an initial propagation into the store and then only specific propagations in the store.
    // TO.DOCONT: Right now things like bounds and many more are all recalculated for every single propagation in the store...
    // TO.DOCONT: Partially related to issue #3237

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
        // Not a group
        const layerConfigCasted = layerConfig as AbstractBaseLayerEntryConfig;

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

        // If layer is regular (not group)
        if (layer instanceof AbstractGVLayer) {
          // Store the layer filter
          legendLayerEntry.layerFilter = layer.getLayerFilters().getInitialFilter();
          legendLayerEntry.layerFilterClass = layer.getLayerFilters().getClassFilter();
          legendLayerEntry.dateTemporalMode = layerConfigCasted.getServiceDateTemporalMode();
          legendLayerEntry.displayDateFormat = layerConfigCasted.getDisplayDateFormat();
          legendLayerEntry.displayDateFormatShort = layerConfigCasted.getDisplayDateFormatShort();
          legendLayerEntry.displayDateTimezone = layerConfigCasted.getDisplayDateTimezone();
        }

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
   * @param {string} mapId - The ID of the map
   * @param {string} layerPath - The layer path to set as the highlighted layer
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
   * @returns {TypeLegendLayer | undefined}
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
   * Recursively traverses a hierarchy of legend layers and returns a flat lookup
   * object indexed by `layerPath`.
   * All layers that contain a defined `layerPath` will be included in the result,
   * including nested children at any depth.
   * If duplicate `layerPath` values exist (shouldn't happen by design), later occurrences will overwrite earlier ones.
   * @param {TypeLegendLayer[]} layers - The top-level legend layers to traverse.
   * @returns {Record<string, TypeLegendLayer>} A record keyed by `layerPath`, where each value is the corresponding `TypeLegendLayer`.
   * @static
   */
  static findAllLayers(layers: TypeLegendLayer[]): Record<string, TypeLegendLayer> {
    // The complete object that will be returned
    const total: Record<string, TypeLegendLayer> = {};

    // Collect the layers recursively
    this.#findAllLayersRec(total, layers);

    // Return the total
    return total;
  }

  /**
   * Internal recursive helper used by {@link findAllLayers} to flatten
   * a tree of legend layers into a lookup object.
   * This method mutates the provided `total` accumulator by adding entries
   * for each layer that has a defined `layerPath`.
   * @param {Record<string, TypeLegendLayer>} total - The accumulator object being populated with flattened layers.
   * @param {TypeLegendLayer[]} layers - The current collection of layers to process.
   * @returns {void}
   * @private
   * @static
   */
  static #findAllLayersRec(total: Record<string, TypeLegendLayer>, layers: TypeLegendLayer[]): void {
    // For each layer at the current level
    layers.forEach((layer) => {
      if (layer.layerPath) {
        // eslint-disable-next-line no-param-reassign
        total[layer.layerPath] = layer;
      }

      // If any children
      if (layer.children?.length) {
        this.#findAllLayersRec(total, layer.children);
      }
    });
  }

  /**
   * Delete layer from legend layers.
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path of the layer to change.
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
   * @param {string} mapId - The ID of the map.
   * @param {TypeLegendLayer[]} legendLayers - The legend layers list to remove layer from.
   * @param {string} layerPath - The layer path of the layer to change.
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
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path of the layer to change.
   * @static
   */
  static deleteLayer(mapId: string, layerPath: string): void {
    // Delete layer through layer API
    MapEventProcessor.getMapViewerLayerAPI(mapId).removeLayerUsingPath(layerPath);
  }

  /**
   * Reload layer.
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path of the layer to reload.
   * @static
   */
  static reloadLayer(mapId: string, layerPath: string): void {
    // Delete layer through layer API
    MapEventProcessor.getMapViewerLayerAPI(mapId).reloadLayer(layerPath);
  }

  /**
   * Refreshes a layer and resets its states to their original configuration.
   * This method performs the following steps:
   * 1. Retrieves the layer using the MapViewerLayer API.
   * 2. Calls the layer's `refresh` method to reload or redraw its data.
   * 3. Resets the layer's opacity and visibility to the values defined in its
   *    initial settings (defaulting to 1 for opacity and true for visibility).
   * 4. Updates all legend items' visibility if the layer is set to visible.
   * @param {string} mapId - The unique identifier of the map containing the layer.
   * @param {string} layerPath - The path identifying the layer to refresh.
   * @returns {Promise<void>} A promise that resolves once the layer has been refreshed,
   * its states reset, and its items rendered if visible.
   * @throws {LayerNotFoundError} If the layer could not be found at the specified layer path.
   * @static
   */
  static refreshLayer(mapId: string, layerPath: string): Promise<void> {
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

    if (visibility) {
      // Return the promise that all items visibility will be renderered if layer is set to visible
      return LegendEventProcessor.setAllItemsVisibility(mapId, layerPath, visibility, true);
    }

    // Resolve right away
    return Promise.resolve();
  }

  /**
   * Retrieves a legend item by name for a specific map layer.
   * Looks up the legend layer information from the store using the provided
   * map and layer identifiers, then searches for a matching legend item.
   * @param {string} mapId - The unique identifier of the map.
   * @param {string} layerPath - The path identifying the layer within the map.
   * @param {string} name - The name of the legend item to retrieve.
   * @returns {TypeLegendItem | undefined} The matching legend item if found; otherwise `undefined`.
   * @static
   */
  static getItemVisibility(mapId: string, layerPath: string, name: string): TypeLegendItem | undefined {
    // Get the particular object holding the items array itself from the store
    const layer = this.getLegendLayerInfo(mapId, layerPath);

    // Return the item
    return layer?.items.find((item) => item.name === name);
  }

  /**
   * Set visibility of an item in legend layers.
   * @param {string} mapId - The ID of the map.
   * @param {TypeLegendItem} item - The item to change.
   * @param {boolean} visibility - The new visibility.
   * @param {string | undefined} classFilter - The new class filter.
   * @static
   */
  static setItemVisibility(
    mapId: string,
    layerPath: string,
    item: TypeLegendItem,
    visibility: boolean,
    classFilter: string | undefined
  ): void {
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
      layer.layerFilterClass = classFilter;
    }

    // Set updated legend layers
    this.getLayerState(mapId).setterActions.setLegendLayers(curLayers);
  }

  /**
   * Toggles the visibility of a legend item on a specific layer of a map.
   * This method inverts the current visibility of the given item and updates the
   * corresponding layer. It delegates to the layer API and can optionally wait
   * for the layer to finish rendering before resolving.
   * @param {string} mapId - The unique identifier of the map containing the layer.
   * @param {string} layerPath - The path identifying the target layer within the map.
   * @param {TypeLegendItem} item - The legend item whose visibility will be toggled.
   * @param {boolean} waitForRender - If `true`, the returned promise resolves only
   * after the layer has completed its next render cycle.
   * @returns {Promise<void>} A promise that resolves once the visibility change
   * has been applied, and the layer has rendered if requested.
   * @static
   */
  static toggleItemVisibility(mapId: string, layerPath: string, item: TypeLegendItem, waitForRender: boolean): Promise<void> {
    // Redirect to layer API
    return MapEventProcessor.getMapViewerLayerAPI(mapId).setItemVisibility(layerPath, item, !item.isVisible, true, waitForRender);
  }

  /**
   * Sets the visibility of all legend items in a specific layer and optionally waits for rendering.
   *
   * This method performs the following steps:
   * 1. Ensures the layer itself is visible on the map.
   * 2. Updates the visibility of each item in the legend layer store and on the map.
   * 3. Triggers a re-render of the layer.
   * 4. Optionally waits for the next render cycle to complete before resolving.
   *
   * @param {string} mapId - The unique identifier of the map containing the layer.
   * @param {string} layerPath - The path identifying the target layer within the map.
   * @param {boolean} visibility - Whether all items in the layer should be visible.
   * @param {boolean} waitForRender - If `true`, the returned promise resolves only after the layer has completed its next render cycle.
   * @returns {Promise<void>} A promise that resolves once all item visibilities have been updated and the layer has rendered if requested.
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer was of wrong type.
   * @static
   */
  static async setAllItemsVisibility(mapId: string, layerPath: string, visibility: boolean, waitForRender: boolean): Promise<void> {
    // Set layer to visible
    MapEventProcessor.setOrToggleMapLayerVisibility(mapId, layerPath, true);

    // Get legend layers and legend layer to update
    // GV This object is about to get mutated multiple times, that's why we can use it to set legend layers later... (pattern should be changed..)
    const curLayers = this.getLayerState(mapId).legendLayers;

    // Get the particular object holding the items array itself from the store
    const layerStore = this.getLegendLayerInfo(mapId, layerPath);

    // Set item visibility on map and in legend layer item for each item in layer
    if (layerStore) {
      // For each
      const promisesVisibility: Promise<void>[] = [];
      layerStore.items.forEach((item) => {
        // Set the item visibility and send refresh to false to not refresh right away for performance
        const promiseVis = MapEventProcessor.getMapViewerLayerAPI(mapId).setItemVisibility(layerPath, item, visibility, false, false);
        // eslint-disable-next-line no-param-reassign
        item.isVisible = visibility;
        // Add the promise
        promisesVisibility.push(promiseVis);
      });

      // Wait for all promises (should be instant in our case)
      await Promise.all(promisesVisibility);

      // Shadow-copy this specific array so that the hooks are triggered for this items array and this one only
      layerStore.items = [...layerStore.items];
    }

    // Now that it's done, apply the layer visibility
    MapEventProcessor.applyLayerFilters(mapId, layerPath);

    // Set updated legend layers
    this.getLayerState(mapId).setterActions.setLegendLayers(curLayers);

    // If must wait for the renderer
    if (waitForRender) {
      // Get the layer
      const layer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayerRegular(layerPath);
      await layer.waitForRender();
    }
  }

  /**
   * Recursively updates the opacity in provided legend layers of a layer and its children.
   * @param {string} mapId - The ID of the map.
   * @param {TypeLegendLayer[]} curLayers - The current legend layers.
   * @param {string} layerPath - The layer path.
   * @param {number} opacity - The opacity to set.
   * @param {boolean} isChild - Is the layer a child layer.
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
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path of the layer to change.
   * @param {number} opacity - The opacity to set.
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
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path of the layer to change.
   * @param {number} opacity - The opacity to set.
   * @param {boolean} updateLegendLayers - Whether to update the legend layers or not
   * @static
   */
  static setLayerOpacity(mapId: string, layerPath: string, opacity: number, updateLegendLayers?: boolean): void {
    // Redirect
    MapEventProcessor.getMapViewerLayerAPI(mapId).setLayerOpacity(layerPath, opacity, updateLegendLayers);
  }

  /**
   * Sorts legend layers children recursively in given legend layers list.
   * @param {string} mapId - The ID of the map.
   * @param {TypeLegendLayer[]} legendLayerList - The list to sort.
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
