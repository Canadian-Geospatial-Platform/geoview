import type { Projection as OLProjection } from 'ol/proj';

import type { Extent } from '@/api/types/map-schema-types';
import type { TemporalMode, TimeDimension, TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import type {
  TypeLayerControls,
  TypeLayerStatus,
  TypeMetadataEsriRasterFunctionInfos,
  TypeMetadataWMSCapabilityLayerStyle,
  TypeMosaicMethod,
  TypeMosaicRule,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { TypeLegendLayer, TypeLegendLayerItem, TypeLegendItem } from '@/core/components/layers/types';
import { MapViewer } from '@/geo/map/map-viewer';
import { GeoUtilities } from '@/geo/utils/utilities';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import type {
  ILayerState,
  LegendQueryStatus,
  TypeLegend,
  TypeLegendResultSetEntry,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import { Projection } from '@/geo/utils/projection';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import { logger } from '@/core/utils/logger';
import { doTimeout, type DelayJob } from '@/core/utils/utilities';

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

  /**
   * Sets the selected layer in the layers tab
   * @param mapId - The map id
   * @param layerPath - The layer path
   * @returns {void}
   * @static
   */
  static setSelectedLayersTabLayerInStore(mapId: string, layerPath: string): void {
    // Save in store
    this.getLayerState(mapId).setterActions.setSelectedLayerPath(layerPath);
  }

  /**
   * Reorders the legend layers based on the ordered layer info
   * @param mapId - The map id
   * @returns {void}
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
   * Gets a specific state.
   * @param {string} mapId - The mapId
   * @param {'highlightedLayer' | 'selectedLayerPath' | 'displayState'} state - The state to get
   * @returns {string | boolean | null | undefined} The requested state
   * @static
   */
  static getLayerPanelState(
    mapId: string,
    state: 'highlightedLayer' | 'selectedLayerPath' | 'displayState'
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
   * Retrieves the service (metadata) projection code for a specific raster layer.
   *
   * @param mapId - The unique identifier of the map instance.
   * @param layerPath - The fully qualified path of the layer.
   * @returns The projection code (e.g., "EPSG:4326") defined in the layer's service metadata,
   *          or `undefined` if:
   *          - the layer does not exist,
   *          - the layer is not a raster layer,
   *          - or the metadata projection is not available.
   * @description
   * This method looks up the GeoView layer associated with the provided `layerPath`.
   * If the layer exists and is an instance of `AbstractGVRaster`, it retrieves the
   * projection defined in the service metadata via `getMetadataProjection()`.
   * The projection code is then returned using `projection.getCode()`.
   * @static
   */
  static getLayerServiceProjection(mapId: string, layerPath: string): string | undefined {
    // Get the layer if it exists
    const geoviewLayer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayerIfExists(layerPath);

    // If of the right type
    if (geoviewLayer instanceof AbstractGVRaster) {
      // Get the projection and return its code
      const projection = geoviewLayer.getMetadataProjection();
      return projection?.getCode();
    }

    // Layer not found or not a Raster layer or no metadata projection
    return undefined;
  }

  /**
   * Triggers asynchronous bounds recalculation and propagation for a layer
   * and its parent hierarchy without awaiting completion.
   *
   * @param mapId - The unique identifier of the map instance.
   * @param gvLayer - The layer from which bounds recalculation should begin.
   * @description
   * This method invokes {@link setLayerBoundsForLayerAndParentsInStore} using a
   * fire-and-forget pattern. The returned promise is intentionally not awaited,
   * allowing bounds recalculation and propagation to occur in the background.
   * @remarks
   * This method is intended for non-blocking workflows (e.g., UI updates)
   * where bounds propagation should not delay execution. Callers requiring
   * completion guarantees should use the awaited version instead.
   */
  static setLayerBoundsForLayerAndParentsAndForgetInStore(mapId: string, gvLayer: AbstractBaseGVLayer): void {
    // Redirect and forget about it
    const promise = this.setLayerBoundsForLayerAndParentsInStore(mapId, gvLayer);
    promise.catch((error: unknown) => {
      // Log the error
      logger.logPromiseFailed('in LegendEventProcessor.setLayerBoundsForLayerAndParentsAndForget', error);
    });
  }

  /**
   * Recalculates and stores bounds for a layer and all of its parent groups.
   *
   * @param mapId - The unique identifier of the map instance.
   * @param gvLayer - The starting layer for which bounds should be computed.
   * @returns A promise that resolves once bounds have been computed and
   * propagated up the entire parent hierarchy.
   * @description
   * This method recalculates the bounds for the provided layer and then
   * iteratively walks up the layer hierarchy, recalculating and storing
   * bounds for each parent group layer.
   */
  static async setLayerBoundsForLayerAndParentsInStore(mapId: string, gvLayer: AbstractBaseGVLayer): Promise<void> {
    const mapViewer = MapEventProcessor.getMapViewer(mapId);
    const mapProjection = mapViewer.getProjection();
    const stops = MapViewer.DEFAULT_STOPS;

    // Walk current layer + parents upward once
    let current: AbstractBaseGVLayer | undefined = gvLayer;
    while (current) {
      // Get the bounds of the layer
      // Must await sequentially: parent bounds depend on child bounds
      // eslint-disable-next-line no-await-in-loop
      const bounds = await current.getBounds(mapProjection, stops);

      // Store it
      this.setLayerBoundsInStore(mapId, current.getLayerPath(), bounds, mapProjection, stops);

      // Advance to parent
      current = current.getParent();
    }
  }

  /**
   * Retrieves the layer's rasterFunctionInfos and returns it
   *
   * @param mapId - The unique identifier of the map instance.
   * @param layerPath - The path to the layer.
   * @returns The raster function infos of the layer, or `undefined` if not available.
   */
  static getLayerRasterFunctionInfos(mapId: string, layerPath: string): TypeMetadataEsriRasterFunctionInfos[] | undefined {
    const geoviewLayer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayerIfExists(layerPath);
    if (!geoviewLayer || !(geoviewLayer instanceof GVEsriImage)) return;

    return geoviewLayer.getMetadataRasterFunctionInfos();
  }

  /**
   * Gets the active raster function for a layer.
   *
   * @param mapId - The map identifier.
   * @param layerPath - The layer path.
   * @returns The active raster function identifier.
   */
  static getLayerRasterFunction(mapId: string, layerPath: string): string | undefined {
    return LegendEventProcessor.getLegendLayerInfo(mapId, layerPath)?.rasterFunction;
  }

  /**
   * Sets the active raster function for a layer.
   *
   * @param mapId - The map identifier.
   * @param layerPath - The layer path.
   * @param rasterFunctionId - The raster function identifier to set.
   */
  static setLayerRasterFunction(mapId: string, layerPath: string, rasterFunctionId: string | undefined): void {
    MapEventProcessor.getMapViewerLayerAPI(mapId).setLayerRasterFunction(layerPath, rasterFunctionId);
  }

  /**
   * Updates the active raster function for a layer in the store.
   *
   * @param mapId - The map identifier.
   * @param layerPath - The layer path.
   * @param rasterFunctionId - The raster function identifier to set.
   */
  static setLayerRasterFunctionInStore(mapId: string, layerPath: string, rasterFunctionId: string | undefined): void {
    // Find the layer for the given layer path
    const layers = LegendEventProcessor.getLayerState(mapId).legendLayers;
    const layer = this.findLayerByPath(layers, layerPath);

    if (layer) {
      // Set layer rasterFunction
      layer.rasterFunction = rasterFunctionId;
      // Set updated legend layers
      this.getLayerState(mapId).setterActions.setLegendLayers(layers);
    }
  }

  /**
   * Gets the allowed mosaic methods for a layer.
   *
   * @param mapId - The map identifier.
   * @param layerPath - The layer path.
   * @returns The allowed mosaic methods or undefined.
   */
  static getLayerAllowedMosaicMethods(mapId: string, layerPath: string): TypeMosaicMethod[] | undefined {
    const geoviewLayer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayerIfExists(layerPath);
    if (!geoviewLayer || !(geoviewLayer instanceof GVEsriImage)) return undefined;

    const allowedMosaicMethods = geoviewLayer.getLayerConfig().getAllowedMosaicMethods();
    return (allowedMosaicMethods?.split(',') as TypeMosaicMethod[]) ?? undefined;
  }

  /**
   * Gets the active mosaic rule for a layer.
   *
   * @param mapId - The map identifier.
   * @param layerPath - The layer path.
   * @returns The active mosaic rule or undefined.
   */
  static getLayerMosaicRule(mapId: string, layerPath: string): TypeMosaicRule | undefined {
    return LegendEventProcessor.getLegendLayerInfo(mapId, layerPath)?.mosaicRule;
  }

  /**
   * Sets the active mosaic rule for a layer.
   *
   * @param mapId - The map identifier.
   * @param layerPath - The layer path.
   * @param mosaicRule - The mosaic rule to set.
   */
  static setLayerMosaicRule(mapId: string, layerPath: string, mosaicRule: TypeMosaicRule | undefined): void {
    MapEventProcessor.getMapViewerLayerAPI(mapId).setLayerMosaicRule(layerPath, mosaicRule);
  }

  /**
   * Updates the mosaicRule for a layer by merging new properties.
   *
   * @param mapId - The map id.
   * @param layerPath - The layer path.
   * @param partialMosaicRule - An object with one or more mosaicRule properties to update.
   */
  static setLayerMosaicRuleProperty(mapId: string, layerPath: string, partialMosaicRule: Partial<TypeMosaicRule>): void {
    const prevRule = LegendEventProcessor.getLayerMosaicRule(mapId, layerPath);
    if (!prevRule) return;

    // Merge the existing mosaic rule with the new properties, ensuring required properties are preserved
    const mergedRule: TypeMosaicRule = {
      ...prevRule,
      ...partialMosaicRule,
      mosaicMethod: partialMosaicRule.mosaicMethod ?? prevRule.mosaicMethod ?? 'esriMosaicNone',
      mosaicOperation: partialMosaicRule.mosaicOperation ?? prevRule.mosaicOperation ?? 'MT_FIRST',
    };

    MapEventProcessor.getMapViewerLayerAPI(mapId).setLayerMosaicRule(layerPath, mergedRule);
  }

  /**
   * Updates the active mosaic rule for a layer in the store.
   *
   * @param mapId - The map identifier.
   * @param layerPath - The layer path.
   * @param mosaicRule - The mosaic rule to set.
   */
  static setLayerMosaicRuleInStore(mapId: string, layerPath: string, mosaicRule: TypeMosaicRule | undefined): void {
    const layers = LegendEventProcessor.getLayerState(mapId).legendLayers;
    const layer = this.findLayerByPath(layers, layerPath);
    if (layer) {
      layer.mosaicRule = mosaicRule;
      this.getLayerState(mapId).setterActions.setLegendLayers(layers);
    }
  }

  /**
   * Gets the active WMS style for a layer.
   *
   * @param mapId - The map identifier.
   * @param layerPath - The layer path.
   * @returns The active WMS style name.
   */
  static getLayerWmsStyle(mapId: string, layerPath: string): string | undefined {
    return LegendEventProcessor.getLegendLayerInfo(mapId, layerPath)?.wmsStyle;
  }

  /**
   * Sets the active WMS style for a layer.
   *
   * @param mapId - The map identifier.
   * @param layerPath - The layer path.
   * @param wmsStyleName - The WMS style name to set.
   */
  static setLayerWmsStyle(mapId: string, layerPath: string, wmsStyleName: string | undefined): void {
    if (!wmsStyleName) return;
    MapEventProcessor.getMapViewerLayerAPI(mapId).setLayerWmsStyle(layerPath, wmsStyleName);
  }

  /**
   * Updates the active WMS style for a layer in the store.
   *
   * @param mapId - The map identifier.
   * @param layerPath - The layer path.
   * @param wmsStyleName - The WMS style name to set.
   */
  static setLayerWmsStyleInStore(mapId: string, layerPath: string, wmsStyleName: string | undefined): void {
    const layers = LegendEventProcessor.getLayerState(mapId).legendLayers;
    const layer = this.findLayerByPath(layers, layerPath);

    if (layer) {
      layer.wmsStyle = wmsStyleName;
      this.getLayerState(mapId).setterActions.setLegendLayers(layers);
    }
  }

  /**
   * Gets the raster function previews for the ESRI image layer.
   *
   * @param mapId - The map identifier.
   * @param layerPath - The layer path.
   * @returns The raster function previews.
   */
  static getLayerRasterFunctionPreviews(mapId: string, layerPath: string): Map<string, Promise<string>> {
    const geoviewLayer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayerIfExists(layerPath);
    if (!geoviewLayer || !(geoviewLayer instanceof GVEsriImage)) return new Map<string, Promise<string>>();

    return geoviewLayer.getRasterFunctionPreviews();
  }

  /**
   * Retrieves the layer's available WMS styles.
   *
   * @param mapId - The unique identifier of the map instance.
   * @param layerPath - The path to the layer.
   * @returns The available WMS style names, or `undefined` if not available.
   */
  static getLayerWmsStyles(mapId: string, layerPath: string): TypeMetadataWMSCapabilityLayerStyle[] | undefined {
    // Get the layer config
    const layerConfig = MapEventProcessor.getMapViewerLayerAPI(mapId).getLayerEntryConfigIfExists(layerPath);

    // Check if it's a WMS layer config
    if (layerConfig && layerConfig instanceof OgcWmsLayerEntryConfig) {
      return layerConfig.getStylesMetadata();
    }

    return undefined;
  }

  /**
   * Gets the available settings for a layer.
   *
   * @param mapId - The map identifier.
   * @param layerPath - The layer path.
   * @returns Array of available setting types.
   */
  static getLayerSettings(mapId: string, layerPath: string): string[] {
    const settings: string[] = [];

    const layer = LegendEventProcessor.getLegendLayerInfo(mapId, layerPath);
    if (!layer) return settings;

    // Check if raster function infos are present
    const rasterFunctionInfos = this.getLayerRasterFunctionInfos(mapId, layerPath);
    if (rasterFunctionInfos && rasterFunctionInfos.length > 0) {
      settings.push('rasterFunction');
    }

    // Check if mosaicMode is present
    const mosaicRule = this.getLayerMosaicRule(mapId, layerPath);
    if (mosaicRule) {
      settings.push('mosaicRule');
    }

    // Check if multiple WMS styles are available
    const styles = this.getLayerWmsStyles(mapId, layerPath);
    if (styles && styles.length > 1) {
      settings.push('wmsStyles');
    }

    // Add other layer types with settings here
    return settings;
  }

  /**
   * Sets the layer bounds for a layer path.
   *
   * @param {string} mapId - The map id
   * @param {string} layerPath - The layer path
   * @param {Extent | undefined} bounds - The extent of the layer at the given path
   * @static
   */
  static setLayerBoundsInStore(
    mapId: string,
    layerPath: string,
    bounds: Extent | undefined,
    mapProjection: OLProjection,
    stops: number
  ): void {
    // Find the layer for the given layer path
    const layers = LegendEventProcessor.getLayerState(mapId).legendLayers;
    const layer = this.findLayerByPath(layers, layerPath);

    if (layer) {
      // Set layer bounds
      layer.bounds = bounds;
      layer.bounds4326 = undefined;

      if (bounds) {
        layer.bounds4326 = Projection.transformExtentFromProj(bounds, mapProjection, Projection.getProjectionLonLat(), stops);
      }

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
  // TODO: REFACTOR - EVENT PROCESSOR - The 'EventProcessor' classes could use some rethinking, especially when they end up calling the layer api to execute something like
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
  static setLayersAreLoadingInStore(mapId: string, areLoading: boolean): void {
    // Update the store
    this.getLayerState(mapId).setterActions.setLayersAreLoading(areLoading);
  }

  /**
   * Updates the status of a specific layer in the legend store.
   * This method:
   * - Locates the layer using the provided `layerPath`.
   * - Updates its `layerStatus` value.
   * - Persists the modified legend layer collection back into the store.
   * If the layer cannot be found, no changes are applied.
   * @param mapId - The unique identifier of the map instance containing the layer.
   * @param layerPath - The fully qualified path used to identify the target layer.
   * @param layerStatus - The new status to assign to the layer.
   */
  static setLayerStatusInStore(mapId: string, layerPath: string, layerStatus: TypeLayerStatus): void {
    // Find the layer for the given layer path
    const layers = LegendEventProcessor.getLayerState(mapId).legendLayers;
    const layer = this.findLayerByPath(layers, layerPath);

    if (layer) {
      // Set layer queryable
      layer.layerStatus = layerStatus;
      // Set updated legend layers
      this.getLayerState(mapId).setterActions.setLegendLayers(layers);
    }
  }

  /**
   * Updates the legend query status and associated legend data for a specific layer
   * in the store.
   * This method:
   * - Locates the target layer using its `layerPath`.
   * - Updates the layer's `legendQueryStatus`.
   * - Stores the legend `styleConfig` if provided.
   * - Regenerates the layer's `icons` and flattened `items` when legend `type` is available.
   * - Persists the updated legend layers back into the store.
   * If the layer cannot be found, no updates are performed.
   * @param mapId - The unique identifier of the map instance whose legend state is being updated.
   * @param layerPath - The fully qualified path identifying the target layer.
   * @param legendQueryStatus - The new legend query status to assign to the layer.
   * @param data - The legend definition returned from the query,
   * which may include style configuration and rendering information.
   */
  static setLegendQueryStatusInStore(
    mapId: string,
    layerPath: string,
    legendQueryStatus: LegendQueryStatus,
    data: TypeLegend | undefined
  ): void {
    // Find the layer for the given layer path
    const layers = LegendEventProcessor.getLayerState(mapId).legendLayers;
    const layer = this.findLayerByPath(layers, layerPath);

    if (layer) {
      // Set layer queryable
      layer.legendQueryStatus = legendQueryStatus;
      layer.styleConfig = data?.styleConfig;

      // If data.type
      if (data?.type) {
        layer.icons = GeoUtilities.getLayerIconImage(data.type, data) ?? [];
        layer.items = GeoUtilities.getLayerItemsFromIcons(data.type, layer.icons);
      }

      // Set updated legend layers
      this.getLayerState(mapId).setterActions.setLegendLayers(layers);
    }
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
   * This method propagates the information stored in the legend layer set to the store.
   *
   * @param {string} mapId - The map identifier.
   * @param {TypeLegendResultSetEntry} legendResultSetEntry - The legend result set that triggered the propagation.
   * @static
   * @deprecated This function should be replaced, it's called too often and does too many things, see TODO.
   */
  static propagateLegendToStore(mapId: string, legendResultSetEntry: TypeLegendResultSetEntry): void {
    // TODO: REFACTOR - propagateLegendToStore - This whole function should be refactored to an initial propagation into the store and then only specific propagations in the store.
    // TO.DOCONT: Right now things are sometimes recalculated, sometimes reset, sometimes unsure processing, for every single propagation in the store...

    // TODO: REFACTOR - propagateLegendToStore - IMPORTANT, this function uses 'createNewLegendEntries' recursively which sends the children array (existingEntries[entryIndex].children)
    // TO.DOCONT: in a loop and pushes objects into the array... However, when pushing objects into an array coming from a Zustand store (or react in general)
    // TO.DOCONT: the array remains the same object and a hook on the array
    // TO.DOCONT: (for example here the "useLayerSelectorChildren = createLayerSelectorHook('children')") will never trigger, because
    // TO.DOCONT: as far as react is concerned, it's the same array object.

    const { layerPath } = legendResultSetEntry;
    const layerPathNodes = layerPath.split('/');

    const setLayerControls = (layerConfig: ConfigBaseClass, isChild: boolean = false, layer?: AbstractBaseGVLayer): TypeLayerControls => {
      const removeDefault = isChild ? MapEventProcessor.getGeoViewMapConfig(mapId)?.globalSettings?.canRemoveSublayers !== false : true;

      // Check if the layer has a minZoom or maxZoom defined, so we know if it needs the visible scale button.
      const visibleScale: boolean = Number.isFinite(layer?.getMinZoom()) || Number.isFinite(layer?.getMaxZoom());

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
        visibleScale, // default: false
      };
    };

    // TODO: REFACTOR - propagateLegendToStore - Avoid nested function relying on outside parameter like layerPathNodes
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

      // Get the existing store entry if any
      const existingStoreEntry: TypeLegendLayer | undefined = existingEntries[entryIndex];

      if (layerConfig.getEntryTypeIsGroup()) {
        // Get the schema tag
        const schemaTag = legendResultSetEntry.data?.type ?? layerConfig.getSchemaTag();

        const controls: TypeLayerControls = setLayerControls(layerConfig, currentLevel > 2);
        if (entryIndex === -1) {
          const legendLayerEntry: TypeLegendLayer = {
            controls,
            layerId: layerConfig.layerId,
            layerPath: entryLayerPath,
            layerName,
            layerStatus: legendResultSetEntry.layerStatus,
            legendQueryStatus: legendResultSetEntry.legendQueryStatus,
            schemaTag: schemaTag,
            entryType: 'group',
            canToggle: legendResultSetEntry.data?.type !== CONST_LAYER_TYPES.ESRI_IMAGE,
            opacity: layerConfig.getInitialSettings()?.states?.opacity ?? 1, // GV: This is call all the time, if set on OL use value, default to config or 1
            icons: [] as TypeLegendLayerItem[],
            items: [] as TypeLegendItem[],
            children: [] as TypeLegendLayer[],
            rasterFunction: undefined,
            mosaicRule: undefined,
          };

          existingEntries.push(legendLayerEntry);
          entryIndex = existingEntries.length - 1;
        } else {
          // TODO: REFACTOR - propagateLegendToStore - Is it missing group layer entry config properties in the store?
          // TO.DOCONT: At the time of writing this, it was just updating the layerStatus on the group layer entry.
          // TO.DOCONT: It seemed to me it should also at least update the name and the bounds (the bounds are tricky, as they get generated only when the children are loaded)
          // TO.DOCONT: Is there any other group layer entry attributes we would like to propagate in the legends store? I'd think so?
          // eslint-disable-next-line no-param-reassign
          existingEntries[entryIndex].layerStatus = layerConfig.layerStatus;
          // eslint-disable-next-line no-param-reassign
          existingEntries[entryIndex].layerName = layerName;
          // eslint-disable-next-line no-param-reassign
          existingEntries[entryIndex].entryType = 'group';
        }

        // Continue recursively
        createNewLegendEntries(currentLevel + 1, existingEntries[entryIndex].children);
      } else {
        // Not a group
        const layerConfigCasted = layerConfig as AbstractBaseLayerEntryConfig;

        // Read the icons
        // If data type is set
        let icons: TypeLegendLayerItem[] = [];
        let items: TypeLegendItem[] = [];
        if (legendResultSetEntry.data) {
          icons = GeoUtilities.getLayerIconImage(legendResultSetEntry.data.type, legendResultSetEntry.data) ?? [];
          items = GeoUtilities.getLayerItemsFromIcons(legendResultSetEntry.data.type, icons);
        }

        const controls: TypeLayerControls = setLayerControls(layerConfig, currentLevel > 2, layer);

        // Get the schema tag
        const schemaTag = legendResultSetEntry.data?.type ?? layerConfig.getSchemaTag();

        const legendLayerEntry: TypeLegendLayer = {
          url: layerConfig.getMetadataAccessPath(),
          bounds: existingStoreEntry?.bounds, // Reassigning the value, because we try to not manage this property from within this function anymore
          bounds4326: existingStoreEntry?.bounds4326, // Reassigning the value, because we try to not manage this property from within this function anymore
          controls,
          layerId: layerPathNodes[currentLevel - 1],
          layerPath: entryLayerPath,
          layerAttribution: layer?.getAttributions(),
          layerName,
          layerStatus: legendResultSetEntry.layerStatus,
          legendQueryStatus: legendResultSetEntry.legendQueryStatus,
          styleConfig: legendResultSetEntry.data?.styleConfig,
          schemaTag: schemaTag,
          entryType: layerConfig.getEntryType(),
          canToggle: schemaTag !== CONST_LAYER_TYPES.ESRI_IMAGE,
          opacity: existingStoreEntry?.opacity ?? layerConfig.getInitialSettings()?.states?.opacity ?? 1, // Reassigning the value, because we try to not manage this property from within this function anymore
          opacityMaxFromParent: existingStoreEntry?.opacityMaxFromParent ?? 1, // Reassigning the value, because we try to not manage this property from within this function anymore
          hoverable: layerConfig.getInitialSettings()?.states?.hoverable, // default: true
          queryable: layerConfig.getInitialSettings()?.states?.queryable, // default: true
          children: [] as TypeLegendLayer[],
          items,
          icons,
          // TODO: Encapsulate rasterFunction and possibly other 'settings' into their own object
          rasterFunction: layer instanceof GVEsriImage ? layer.getRasterFunction() : undefined,
          mosaicRule: layer instanceof GVEsriImage ? layer.getMosaicRule() : undefined,
          hasText: layer instanceof AbstractGVVector ? layer.getTextOLLayer() !== undefined : undefined,
          textVisible: layer instanceof AbstractGVVector ? layer.getTextVisible() : undefined,
          wmsStyle: layer instanceof GVWMS ? layer.getWmsStyle() : undefined,
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

  // #region DELETE LAYERS CONTROLLER

  /** Holds all the layers in process of being deleted from the map */
  static readonly #LAYERS_BEING_DELETED: Record<string, Record<string, LayerDeletionJob>> = {};

  /**
   * Retrieves the timestamp when a layer started its deletion process.
   *
   * @param mapId - Identifier of the map instance.
   * @param layerPath - Unique path identifying the layer within the map.
   * @returns The timestamp (in ms) when deletion started, or `undefined`
   * if the layer is not currently pending deletion.
   */
  static #getLayerBeingDeleted(mapId: string, layerPath: string): LayerDeletionJob | undefined {
    return this.#LAYERS_BEING_DELETED[mapId]?.[layerPath];
  }

  /**
   * Marks a layer as being in the deletion process.
   *
   * @param mapId - Identifier of the map instance.
   * @param layerPath - Unique path identifying the layer within the map.
   */
  static #addLayerBeingDeleted(mapId: string, layerPath: string, job: LayerDeletionJob): void {
    // Add the layer for deletion
    this.#LAYERS_BEING_DELETED[mapId] ??= {};
    this.#LAYERS_BEING_DELETED[mapId][layerPath] = job;
  }

  /**
   * Removes a layer from the pending deletion list and clears its
   * deletion progress indicator from the UI store.
   *
   * @param mapId - Identifier of the map instance.
   * @param layerPath - Unique path identifying the layer within the map.
   */
  static #removeLayerBeingDeleted(mapId: string, layerPath: string): void {
    // Remove the layer from deletion
    this.getLayerState(mapId).setterActions.setLayerDeletionStartTime(layerPath, undefined);
    delete this.#LAYERS_BEING_DELETED[mapId][layerPath];
  }

  /**
   * Starts the delayed deletion process for a layer, allowing a short
   * time window for the user to undo the operation.
   *
   * During this period:
   * - The layer is temporarily hidden.
   * - A deletion start timestamp is stored so the UI can derive progress locally.
   * - The user may abort the deletion via {@link deleteLayerAbort}.
   *
   * If the undo window expires, the layer is permanently deleted.
   * If called again for the same layer while a previous timer is running,
   * the previous timer is cancelled and a new one starts, preserving the
   * original visibility state from the first call.
   *
   * @param mapId - Identifier of the map instance.
   * @param layerPath - Unique path identifying the layer within the map.
   * @param undoWindowDuration - Duration in milliseconds of the undo window before deletion is finalized.
   * @returns A promise resolving to:
   * - `true` if the deletion completed successfully.
   * - `false` if the deletion was aborted, superseded by a newer call, or
   *   if the layer was already in the deletion process.
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   */
  static async deleteLayerStartTimer(mapId: string, layerPath: string, undoWindowDuration: number): Promise<boolean> {
    // If there was already a job going, cancel it but keep the reference so we can preserve its original visibility
    const existingJob = this.#getLayerBeingDeleted(mapId, layerPath);
    if (existingJob) {
      // Cancel
      existingJob.delayedJob.cancel();
    }

    // Get the layer api
    const layerApi = MapEventProcessor.getMapViewerLayerAPI(mapId);

    // Get the layer if it exists, it's possible it doesn't exist if the layer failed to process
    const gvLayer = layerApi.getGeoviewLayerIfExists(layerPath);

    // Note the original visibility state of the layer before starting the deletion process.
    // If there was already a pending deletion, preserve its original visibility since the layer is already hidden.
    const originalVisibility = existingJob?.originalVisibility ?? gvLayer?.getVisible() ?? false;

    // Hide layer immediately
    gvLayer?.setVisible(false);
    layerApi.removeLayerHighlights(layerPath);

    // Update the store with the start time of the deletion of the layer
    this.getLayerState(mapId).setterActions.setLayerDeletionStartTime(layerPath, Date.now());

    // Start delayed job
    const delayedJob = doTimeout(undoWindowDuration);

    // Register job (replaces any previous entry for this layerPath)
    this.#addLayerBeingDeleted(mapId, layerPath, {
      delayedJob,
      originalVisibility,
    });

    // Wait for the job to perform operation or be cancelled
    const result = await delayedJob.promise;

    // Check if our job is still the current one. A subsequent call to deleteLayerStartTimer
    // may have replaced it while we were awaiting — in that case, let the newer call own the lifecycle.
    const currentJob = this.#getLayerBeingDeleted(mapId, layerPath);
    if (currentJob?.delayedJob !== delayedJob) {
      return false;
    }

    // Our job is still current — remove it from the stack
    this.#removeLayerBeingDeleted(mapId, layerPath);

    if (result === 'timeout') {
      // Perform deletion
      this.deleteLayer(mapId, layerPath);
      return true;
    }

    // Undo deletion — restore original visibility
    gvLayer?.setVisible(originalVisibility);

    // Negative
    return false;
  }

  /**
   * Aborts an ongoing layer deletion process if it has not yet been finalized.
   *
   * This restores the layer to its previous visibility state and stops
   * the deletion timer.
   *
   * @param mapId - Identifier of the map instance.
   * @param layerPath - Unique path identifying the layer within the map.
   */
  static deleteLayerAbort(mapId: string, layerPath: string): void {
    // Get the job about layer deletion
    const job = this.#getLayerBeingDeleted(mapId, layerPath);

    // Cancel the delayed job
    job?.delayedJob.cancel();
  }

  // #endregion DELETE LAYERS CONTROLLER

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
      // TODO: REFACTOR - Rethink this pattern to find a better cohesive solution for ALL 'set' that go in the store and change them all
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
   * Checks if a layer has a text layer.
   *
   * @param mapId - The ID of the map.
   * @param layerPath - The layer path of the layer to check.
   * @returns True if the layer has a text layer, false otherwise.
   */
  static getLayerHasText(mapId: string, layerPath: string): boolean {
    const layer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayerRegularIfExists(layerPath);

    // Check if it's a vector layer with a text layer
    if (layer && layer instanceof AbstractGVVector) {
      return layer.getTextOLLayer() !== undefined;
    }

    return false;
  }

  /**
   * Gets the text visibility state for a layer.
   *
   * @param mapId - The ID of the map.
   * @param layerPath - The layer path of the layer to check.
   * @returns True if text is visible, false otherwise. Returns undefined if layer has no text.
   */
  static getLayerTextVisibility(mapId: string, layerPath: string): boolean | undefined {
    const layer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayerRegularIfExists(layerPath);

    // Check if it's a vector layer with a text layer
    if (layer && layer instanceof AbstractGVVector && layer.getTextOLLayer()) {
      return layer.getTextVisible();
    }

    return undefined;
  }

  /**
   * Sets the text visibility for a layer.
   *
   * @param mapId - The ID of the map.
   * @param layerPath - The layer path of the layer to change.
   * @param visible - True to show text, false to hide text.
   */
  static setLayerTextVisibility(mapId: string, layerPath: string, visible: boolean): void {
    // Get the layer
    const layer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayerRegular(layerPath);
    if (!layer) return;

    // If it's a vector layer, set text visibility
    if (layer instanceof AbstractGVVector) {
      layer.setTextVisible(visible);

      this.setLayerTextVisibilityInStore(mapId, layerPath, visible);
    }
  }

  /**
   * Updates the text visibility state in the store.
   *
   * @param mapId - The ID of the map.
   * @param layerPath - The layer path.
   * @param textVisible - The new text visibility state.
   */
  static setLayerTextVisibilityInStore(mapId: string, layerPath: string, textVisible: boolean): void {
    // Find the layer for the given layer path
    const layers = LegendEventProcessor.getLayerState(mapId).legendLayers;
    const layer = this.findLayerByPath(layers, layerPath);

    if (layer) {
      // Set text visibility
      layer.textVisible = textVisible;
      // Set updated legend layers
      this.getLayerState(mapId).setterActions.setLegendLayers(layers);
    }
  }

  /**
   * Sets the opacity of the layer and its children in the store.
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path of the layer to change.
   * @param {string | undefined} layerName - The layer name to set.
   * @static
   */
  static setLayerNameInStore(mapId: string, layerPath: string, layerName: string | undefined): void {
    // Find the layer for the given layer path
    const layers = LegendEventProcessor.getLayerState(mapId).legendLayers;
    const layer = this.findLayerByPath(layers, layerPath);

    if (layer) {
      // Set layer name
      layer.layerName = layerName ?? ''; // Default to empty string if undefined
      // Set updated legend layers
      this.getLayerState(mapId).setterActions.setLegendLayers(layers);
    }
  }

  /**
   * Sets the opacity of the layer and its children in the store.
   *
   * @param mapId - The ID of the map.
   * @param layerPath - The layer path of the layer to change.
   * @param opacity - The opacity to set.
   */
  static setOpacityInStore(mapId: string, layerPath: string, opacity: number): void {
    const layers = this.getLayerState(mapId).legendLayers;
    const layer = this.findLayerByPath(layers, layerPath);

    if (layer) {
      // Set the opacity
      layer.opacity = opacity;
      // Go recursive
      this.#setOpacityInStoreRec(layer, opacity);
    }

    // Set updated legend layers
    this.getLayerState(mapId).setterActions.setLegendLayers(layers);
  }

  /**
   * Recursively sets the opacity and opacityMaxFromParent of all children of the given layer.
   *
   * @param layer - The layer on which to update the children opacity values.
   * @param opacity - The opacity to set.
   */
  static #setOpacityInStoreRec(layer: TypeLegendLayer, opacity: number): void {
    // Set the opacity along with all the children
    layer.children?.forEach((child) => {
      // eslint-disable-next-line no-param-reassign
      child.opacity = opacity;
      // eslint-disable-next-line no-param-reassign
      child.opacityMaxFromParent = opacity;
      // Go recursive
      this.#setOpacityInStoreRec(child, opacity);
    });
  }

  /**
   * Sets the opacity of a layer.
   *
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

/** A job operation when the user wants to delete a layer */
type LayerDeletionJob = {
  delayedJob: DelayJob;
  originalVisibility: boolean;
};
