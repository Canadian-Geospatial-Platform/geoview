import type { Extent, TypeFeatureInfoEntryPartial } from '@/api/types/map-schema-types';
import type { TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import type {
  TypeLayerControls,
  TypeMetadataWMSCapabilityLayerStyle,
  TypeMosaicMethod,
  TypeMosaicOperation,
  TypeMosaicRule,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { TypeLegendLayer, TypeLegendLayerItem, TypeLegendItem } from '@/core/components/layers/types';
import { GeoUtilities } from '@/geo/utils/utilities';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import {
  getStoreLayerMosaicRule,
  getStoreLayerStateHighlightedLayer,
  getStoreLayerStateLegendLayerByPath,
  getStoreLayerStateLegendLayers,
  setStoreLayerDeletionStartTime,
  setStoreHighlightedLayer,
  setStoreLegendLayersDirectly,
  type TypeLegendResultSetEntry,
  setStoreLayerTextVisibility,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import {
  getStoreMapConfigGlobalSettings,
  getStoreMapOrderedLayerIndexByPath,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';

import { doTimeout, type DelayJob } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import { LayerNotEsriDynamicError } from '@/core/exceptions/layer-exceptions';
import { GVEsriDynamic } from '@/geo/layer/gv-layers/raster/gv-esri-dynamic';

/**
 * Event processor for legend and layer management operations.
 *
 * Provides static methods that orchestrate store updates and layer API calls
 * for layer settings, visibility, opacity, deletion, legend propagation,
 * and feature queries.
 */
export abstract class LegendEventProcessor extends AbstractEventProcessor {
  // #region STATIC METHODS

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
   * Sets the ascending flag on the mosaic rule for a layer.
   *
   * @param mapId - The map identifier
   * @param layerPath - The layer path
   * @param value - Whether the mosaic order is ascending
   */
  static setLayerMosaicRuleAscending(mapId: string, layerPath: string, value: boolean): void {
    this.#setLayerMosaicRuleProperty(mapId, layerPath, { ascending: value });
  }

  /**
   * Sets the mosaic method on the mosaic rule for a layer.
   *
   * @param mapId - The map identifier
   * @param layerPath - The layer path
   * @param value - The mosaic method to set
   */
  static setLayerMosaicRuleMethod(mapId: string, layerPath: string, value: TypeMosaicMethod): void {
    this.#setLayerMosaicRuleProperty(mapId, layerPath, { mosaicMethod: value });
  }

  /**
   * Sets the mosaic operation on the mosaic rule for a layer.
   *
   * @param mapId - The map identifier
   * @param layerPath - The layer path
   * @param value - The mosaic operation to set
   */
  static setLayerMosaicRuleOperation(mapId: string, layerPath: string, value: TypeMosaicOperation): void {
    this.#setLayerMosaicRuleProperty(mapId, layerPath, { mosaicOperation: value });
  }

  /**
   * Updates the mosaicRule for a layer by merging new properties.
   *
   * @param mapId - The map id.
   * @param layerPath - The layer path.
   * @param partialMosaicRule - An object with one or more mosaicRule properties to update.
   */
  static #setLayerMosaicRuleProperty(mapId: string, layerPath: string, partialMosaicRule: Partial<TypeMosaicRule>): void {
    const prevRule = getStoreLayerMosaicRule(mapId, layerPath);
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
    const layer = getStoreLayerStateLegendLayerByPath(mapId, layerPath);
    if (!layer) return []; // Not in the store, no settings

    // Check if raster function infos are present
    const settings: string[] = [];

    if (layer.rasterFunctionInfos && layer.rasterFunctionInfos.length > 0) {
      settings.push('rasterFunction');
    }

    // Check if mosaicMode is present
    const { mosaicRule } = layer;
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
   * Sets the layer hoverable state.
   *
   * @param mapId - The map identifier
   * @param layerPath - The layer path of the layer to change
   * @param queryable - The hoverable state to set
   */
  static setLayerHoverable(mapId: string, layerPath: string, queryable: boolean): void {
    MapEventProcessor.getMapViewerLayerAPI(mapId).setLayerHoverable(layerPath, queryable);
  }

  /**
   * Applies a display date format to a layer through the map viewer layer API.
   *
   * This method forwards the request to the map viewer, allowing the layer
   * implementation to react to the new display date format (e.g. for rendering
   * or querying purposes).
   *
   * @param mapId - The map identifier
   * @param layerPath - The layer path
   * @param displayDateFormat - The date format to apply when displaying date values for the layer
   */
  static setLayerDisplayDateFormat(mapId: string, layerPath: string, displayDateFormat: TypeDisplayDateFormat): void {
    MapEventProcessor.getMapViewerLayerAPI(mapId).setLayerDisplayDateFormat(layerPath, displayDateFormat);
  }

  /**
   * Gets the extent of a feature or group of features.
   *
   * @param mapId - The map identifier
   * @param layerPath - The layer path
   * @param objectIds - The IDs of features to get extents from
   * @param outfield - Optional ID field to return for services that require a value in outfields
   * @returns A promise that resolves with the extent of the features
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer was of wrong type.
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
   * Propagates the information stored in the legend layer set to the store.
   *
   * @param mapId - The map identifier
   * @param legendResultSetEntry - The legend result set entry that triggered the propagation
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
      const removeDefault = isChild ? getStoreMapConfigGlobalSettings(mapId)?.canRemoveSublayers !== false : true;

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
          rasterFunctionInfos: layer instanceof GVEsriImage ? layer.getMetadataRasterFunctionInfos() : undefined,
          allowedMosaicMethods:
            layer instanceof GVEsriImage
              ? ((layer.getLayerConfig().getAllowedMosaicMethods()?.split(',') as TypeMosaicMethod[]) ?? undefined)
              : undefined,
          mosaicRule: layer instanceof GVEsriImage ? layer.getMosaicRule() : undefined,
          timeDimension: layer instanceof AbstractGVLayer ? layer.getTimeDimension() : undefined,
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
    const layers = getStoreLayerStateLegendLayers(mapId);

    // Process creation of legend entries
    createNewLegendEntries(2, layers);

    // Update the legend layers with the updated array, triggering the subscribe
    // Reorder the array so legend tab is in synch
    const sortedLayers = layers.sort(
      (a, b) => getStoreMapOrderedLayerIndexByPath(mapId, a.layerPath) - getStoreMapOrderedLayerIndexByPath(mapId, b.layerPath)
    );
    this.#sortLegendLayersChildren(mapId, sortedLayers);

    // Set updated legend layers
    setStoreLegendLayersDirectly(mapId, sortedLayers);
  }

  /**
   * Sets the highlighted layer state.
   *
   * Toggles or changes the highlighted layer. Only one layer can be highlighted at a time.
   *
   * @param mapId - The map identifier
   * @param layerPath - The layer path to set as the highlighted layer
   */
  static setHighlightLayer(mapId: string, layerPath: string): void {
    // Get highlighted layer to set active button state because there can only be one highlighted layer at a time.
    const currentHighlight = getStoreLayerStateHighlightedLayer(mapId);

    // Highlight layer and get new highlighted layer path from map event processor.
    const highlightedLayerpath = MapEventProcessor.changeOrRemoveLayerHighlight(mapId, layerPath, currentHighlight);

    // Save to the store
    setStoreHighlightedLayer(mapId, highlightedLayerpath);
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
    // Update the store
    setStoreLayerDeletionStartTime(mapId, layerPath, undefined);

    // Remove the layer from deletion
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

    // Set start deletion time in the store
    setStoreLayerDeletionStartTime(mapId, layerPath, Date.now());

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
   * Deletes a layer from the map.
   *
   * @param mapId - The map identifier
   * @param layerPath - The layer path of the layer to delete
   */
  static deleteLayer(mapId: string, layerPath: string): void {
    // Delete layer through layer API
    MapEventProcessor.getMapViewerLayerAPI(mapId).removeLayerUsingPath(layerPath);
  }

  /**
   * Reloads a layer on the map.
   *
   * @param mapId - The map identifier
   * @param layerPath - The layer path of the layer to reload
   */
  static reloadLayer(mapId: string, layerPath: string): void {
    // Delete layer through layer API
    MapEventProcessor.getMapViewerLayerAPI(mapId).reloadLayer(layerPath);
  }

  /**
   * Refreshes a layer and resets its states to their original configuration.
   *
   * This method performs the following steps:
   * 1. Retrieves the layer using the MapViewerLayer API.
   * 2. Calls the layer's `refresh` method to reload or redraw its data.
   * 3. Resets the layer's opacity and visibility to the values defined in its
   *    initial settings (defaulting to 1 for opacity and true for visibility).
   * 4. Updates all legend items' visibility if the layer is set to visible.
   *
   * @param mapId - The map identifier
   * @param layerPath - The layer path to refresh
   * @returns A promise that resolves once the layer has been refreshed,
   * its states reset, and its items rendered if visible
   * @throws {LayerNotFoundError} When the layer could not be found at the specified layer path.
   */
  static refreshLayer(mapId: string, layerPath: string): Promise<void> {
    // Get the layer through layer API
    const layer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayer(layerPath);

    // Refresh the layer
    layer.refresh(this.getMapViewer(mapId).getProjection());

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
   * Toggles the visibility of a legend item on a specific layer.
   *
   * Inverts the current visibility of the given item and updates the corresponding layer.
   * Delegates to the layer API and can optionally wait for the layer to finish rendering.
   *
   * @param mapId - The map identifier
   * @param layerPath - The layer path
   * @param item - The legend item whose visibility will be toggled
   * @param waitForRender - If true, the returned promise resolves only after the layer has completed its next render cycle
   * @returns A promise that resolves once the visibility change has been applied
   */
  static toggleItemVisibility(mapId: string, layerPath: string, item: TypeLegendItem, waitForRender: boolean): Promise<void> {
    // Redirect to layer API
    return MapEventProcessor.getMapViewerLayerAPI(mapId).setItemVisibility(layerPath, item, !item.isVisible, true, waitForRender);
  }

  /**
   * Toggles the visibility of a legend item without waiting for the render to complete.
   *
   * @param mapId - The map identifier
   * @param layerPath - The layer path
   * @param item - The legend item whose visibility will be toggled
   */
  static toggleItemVisibilityAndForget(mapId: string, layerPath: string, item: TypeLegendItem): void {
    // Redirect
    LegendEventProcessor.toggleItemVisibility(mapId, layerPath, item, false).catch((error: unknown) => {
      // Log promise failed
      logger.logPromiseFailed('in LegendEventProcessor.toggleItemVisibilityAndForget', error);
    });
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
   * @param mapId - The map identifier
   * @param layerPath - The layer path
   * @param visibility - Whether all items in the layer should be visible
   * @param waitForRender - If true, the returned promise resolves only after the layer has completed its next render cycle
   * @returns A promise that resolves once all item visibilities have been updated and the layer has rendered if requested
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer was of wrong type.
   */
  static async setAllItemsVisibility(mapId: string, layerPath: string, visibility: boolean, waitForRender: boolean): Promise<void> {
    // Set layer to visible
    MapEventProcessor.setOrToggleMapLayerVisibility(mapId, layerPath, true);

    // Get legend layers and legend layer to update
    // GV This object is about to get mutated multiple times, that's why we can use it to set legend layers later... (pattern should be changed..)
    const curLayers = getStoreLayerStateLegendLayers(mapId);

    // Get the particular object holding the items array itself from the store
    const layerStore = getStoreLayerStateLegendLayerByPath(mapId, layerPath);

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
    setStoreLegendLayersDirectly(mapId, curLayers);

    // If must wait for the renderer
    if (waitForRender) {
      // Get the layer
      const layer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayerRegular(layerPath);
      await layer.waitForRender();
    }
  }

  /**
   * Sets the visibility of all legend items without waiting for the render to complete.
   *
   * @param mapId - The map identifier
   * @param layerPath - The layer path
   * @param visibility - Whether all items should be visible
   */
  static setAllItemsVisibilityAndForget(mapId: string, layerPath: string, visibility: boolean): void {
    // Redirect
    LegendEventProcessor.setAllItemsVisibility(mapId, layerPath, visibility, false).catch((error: unknown) => {
      // Log promise failed
      logger.logPromiseFailed('in LegendEventProcessor.setAllItemsVisibilityAndForget', error);
    });
  }

  /**
   * Sets the opacity of a layer.
   *
   * @param mapId - The map identifier
   * @param layerPath - The layer path of the layer to change
   * @param opacity - The opacity value to set (0 to 1)
   * @param updateLegendLayers - Optional whether to update the legend layers
   */
  static setLayerOpacity(mapId: string, layerPath: string, opacity: number, updateLegendLayers?: boolean): void {
    // Redirect
    MapEventProcessor.getMapViewerLayerAPI(mapId).setLayerOpacity(layerPath, opacity, updateLegendLayers);
  }

  /**
   * Queries the EsriDynamic layer at the given layer path for a specific set of object IDs.
   *
   * @param mapId - The map identifier
   * @param layerPath - The layer path of the layer to query
   * @param objectIDs - The object IDs to filter the query on
   * @returns A promise that resolves with an array of feature info entry records
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path.
   * @throws {LayerNotEsriDynamicError} When the layer configuration isn't EsriDynamic.
   */
  static queryLayerEsriDynamic(mapId: string, layerPath: string, objectIDs: number[]): Promise<TypeFeatureInfoEntryPartial[]> {
    // Get the layer
    const layer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayerRegular(layerPath);

    // If not EsriDynamic
    if (!(layer instanceof GVEsriDynamic)) throw new LayerNotEsriDynamicError(layerPath, layer.getLayerName());

    // Perform the query
    return layer.getRecordsByOIDs(objectIDs, MapEventProcessor.getMapViewer(mapId).getProjectionNumber());
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
    if (layer instanceof AbstractGVVector) {
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
    if (layer instanceof AbstractGVVector && layer.getTextOLLayer()) {
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

      // Update the store
      setStoreLayerTextVisibility(mapId, layerPath, visible);
    }
  }

  // #endregion STATIC METHODS

  // #region PRIVATE STATIC METHODS

  /**
   * Sorts legend layers children recursively in the given legend layers list.
   *
   * @param mapId - The map identifier
   * @param legendLayerList - The legend layer list to sort
   */
  static #sortLegendLayersChildren = (mapId: string, legendLayerList: TypeLegendLayer[]): void => {
    legendLayerList.forEach((legendLayer) => {
      if (legendLayer.children.length)
        legendLayer.children.sort(
          (a, b) => getStoreMapOrderedLayerIndexByPath(mapId, a.layerPath) - getStoreMapOrderedLayerIndexByPath(mapId, b.layerPath)
        );
      this.#sortLegendLayersChildren(mapId, legendLayer.children);
    });
  };

  // #endregion PRIVATE STATIC METHODS
}

/** Represents a pending layer deletion job with its undo state. */
type LayerDeletionJob = {
  /** The delayed job that controls the deletion timer. */
  delayedJob: DelayJob;

  /** The original visibility of the layer before the deletion process started. */
  originalVisibility: boolean;
};
