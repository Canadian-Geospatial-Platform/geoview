import type { TypeLayerControls, TypeMosaicMethod } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { TypeLegendLayer, TypeLegendLayerItem, TypeLegendItem } from '@/core/components/layers/types';
import { GeoUtilities } from '@/geo/utils/utilities';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import {
  getStoreLayerStateLegendLayerByPath,
  getStoreLayerStateLegendLayers,
  setStoreLegendLayersDirectly,
  type TypeLegendResultSetEntry,
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
import { logger } from '@/core/utils/logger';

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
          wmsStyles: layerConfigCasted instanceof OgcWmsLayerEntryConfig ? layerConfigCasted.getStylesMetadata() : undefined,
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
