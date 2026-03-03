import { useStore } from 'zustand';

import type { FitOptions } from 'ol/View';
import type { Extent } from 'ol/extent';

import { useGeoViewStore } from '@/core/stores/stores-managers';
import type { TypeLayersViewDisplayState, TypeLegendItem, TypeLegendLayer } from '@/core/components/layers/types';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { type TypeGetStore, type TypeSetStore, useStableSelector } from '@/core/stores/geoview-store';
import type { TypeFeatureInfoEntryPartial, TypeLayerStyleConfig, TypeResultSet, TypeResultSetEntry } from '@/api/types/map-schema-types';
import { DateMgt, type TemporalMode, type TimeDimension, type TimeIANA, type TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import type { TypeGeoviewLayerType, TypeLayerStatus } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { OL_ZOOM_DURATION, OL_ZOOM_PADDING } from '@/core/utils/constant';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import type { TypeVectorLayerStyles } from '@/geo/utils/renderer/geoview-renderer';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { GVEsriDynamic } from '@/geo/layer/gv-layers/raster/gv-esri-dynamic';
import { LayerNotEsriDynamicError } from '@/core/exceptions/layer-exceptions';
import { NoBoundsError } from '@/core/exceptions/geoview-exceptions';
import { logger } from '@/core/utils/logger';

// #region INTERFACES & TYPES

type LayerActions = ILayerState['actions'];

export interface ILayerState {
  highlightedLayer: string;
  selectedLayer: TypeLegendLayer;
  selectedLayerPath?: string;
  legendLayers: TypeLegendLayer[];
  displayState: TypeLayersViewDisplayState;
  layerDeleteInProgress: string;
  layersAreLoading: boolean;
  setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;

  actions: {
    deleteLayer: (layerPath: string) => void;
    getExtentFromFeatures: (layerPath: string, featureIds: number[], outfield?: string) => Promise<Extent>;
    queryLayerEsriDynamic: (layerPath: string, objectIDs: number[]) => Promise<TypeFeatureInfoEntryPartial[]>;
    getLayerDeleteInProgress: () => string;
    getLayerServiceProjection: (layerPath: string) => string | undefined;
    refreshLayer: (layerPath: string) => Promise<void>;
    reloadLayer: (layerPath: string) => void;
    toggleItemVisibility: (layerPath: string, item: TypeLegendItem) => void;
    toggleItemVisibilityAndWait: (layerPath: string, item: TypeLegendItem) => Promise<void>;
    setAllItemsVisibility: (layerPath: string, visibility: boolean) => void;
    setAllItemsVisibilityAndWait: (layerPath: string, visibility: boolean) => Promise<void>;
    setDisplayState: (newDisplayState: TypeLayersViewDisplayState) => void;
    setHighlightLayer: (layerPath: string) => void;
    setLayerDeleteInProgress: (newVal: string) => void;
    setLayerOpacity: (layerPath: string, opacity: number, updateLegendLayers?: boolean) => void;
    setLayerHoverable: (layerPath: string, enable: boolean) => void;
    setLayerQueryable: (layerPath: string, enable: boolean) => void;
    setSelectedLayerPath: (layerPath: string | undefined) => void;
    zoomToLayerExtent: (layerPath: string) => Promise<void>;
    zoomToLayerVisibleScale: (layerPath: string) => void;
  };

  setterActions: {
    setDisplayState: (newDisplayState: TypeLayersViewDisplayState) => void;
    setHighlightLayer: (layerPath: string) => void;
    setLayerDeleteInProgress: (newVal: string) => void;
    setLegendLayers: (legendLayers: TypeLegendLayer[]) => void;
    setSelectedLayerPath: (layerPath: string | undefined) => void;
    setLayersAreLoading: (areLoading: boolean) => void;
  };
}

/**
 * Initializes a Layer State and provide functions which use the get/set Zustand mechanisms.
 * @param {TypeSetStore} set - The setter callback to be used by this state
 * @param {TypeGetStore} get - The getter callback to be used by this state
 * @returns The initialized Layer State
 */
export function initializeLayerState(set: TypeSetStore, get: TypeGetStore): ILayerState {
  return {
    highlightedLayer: '',
    legendLayers: [] as TypeLegendLayer[],
    displayState: 'view',
    layerDeleteInProgress: '',

    // Initialize default
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => {
      set({
        layerState: {
          ...get().layerState,
          selectedLayerPath: geoviewConfig.footerBar?.selectedLayersLayerPath || geoviewConfig.appBar?.selectedLayersLayerPath,
        },
      });
    },

    // #region ACTIONS
    actions: {
      /**
       * Deletes a layer.
       * @param {string} layerPath - The path of the layer to delete.
       */
      deleteLayer: (layerPath: string): void => {
        LegendEventProcessor.deleteLayer(get().mapId, layerPath);
        get().layerState.setterActions.setLayerDeleteInProgress('');
      },

      /**
       * Gets the extent from the features
       * @param {string} layerPath - The layer path of the layer with the features
       * @param {number[]} featureIds - The feature ids to get the extent of
       * @param {string?} outfield - The out field
       * @returns {Promise<Extent>} The Promise of an Extent
       */
      getExtentFromFeatures: (layerPath: string, featureIds: number[], outfield?: string): Promise<Extent> => {
        // Redirect to event processor
        return LegendEventProcessor.getExtentFromFeatures(get().mapId, layerPath, featureIds, outfield);
      },

      /**
       * Queries the EsriDynamic layer at the given layer path for a specific set of object ids
       * @param {string} layerPath - The layer path of the layer to query
       * @param {number[]} objectIDs - The object ids to filter the query on
       * @returns {Promise<TypeFeatureInfoEntryPartial[]>} A Promise of an array of TypeFeatureInfoEntryPartial records
       * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
       * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path.
       * @throws {LayerNotEsriDynamicError} When the layer configuration isn't EsriDynamic.
       */
      queryLayerEsriDynamic: (layerPath: string, objectIDs: number[]): Promise<TypeFeatureInfoEntryPartial[]> => {
        // Get the layer
        const layer = MapEventProcessor.getMapViewerLayerAPI(get().mapId).getGeoviewLayerRegular(layerPath);

        // If not EsriDynamic
        if (!(layer instanceof GVEsriDynamic)) throw new LayerNotEsriDynamicError(layerPath, layer.getLayerName());

        // Perform the query
        return layer.getRecordsByOIDs(objectIDs, MapEventProcessor.getMapState(get().mapId).currentProjection);
      },

      /**
       * Get the LayerDeleteInProgress state.
       */
      // TODO: REFACTOR - HOOK - This should probably be a hook rather than an action
      getLayerDeleteInProgress: () => get().layerState.layerDeleteInProgress,

      /**
       * Gets the service native projection of the layer.
       * @param {string} layerPath - The layer path of the layer to get the service projection for.
       * @returns {string | undefined} The service projection or undefined
       */
      getLayerServiceProjection: (layerPath: string): string | undefined => {
        // Redirect to processor
        return LegendEventProcessor.getLayerServiceProjection(get().mapId, layerPath);
      },

      /**
       * Refreshes the specified layer of the current map and resets its states.
       * This method is a convenience wrapper around
       * `LegendEventProcessor.refreshLayer` that automatically uses the map ID
       * from the current store context.
       * @param {string} layerPath - The path identifying the target layer within the current map.
       * @returns {Promise<void>} A promise that resolves once the layer has been refreshed,
       * its states reset, and its items rendered if visible.
       */
      refreshLayer: (layerPath: string): Promise<void> => {
        // Redirect to processor.
        return LegendEventProcessor.refreshLayer(get().mapId, layerPath);
      },

      /**
       * Reload layer and set states to original values.
       * @param {string} layerPath - The layer path of the layer to reload.
       */
      reloadLayer: (layerPath: string): void => {
        // Redirect to processor.
        LegendEventProcessor.reloadLayer(get().mapId, layerPath);
      },

      /**
       * Toggles the visibility of a single legend item on a layer.
       * This method inverts the current visibility of the given item and updates
       * the layer asynchronously. Errors during the update are caught and logged.
       * @param {string} layerPath - The path identifying the target layer within the map.
       * @param {TypeLegendItem} item - The legend item whose visibility will be toggled.
       */
      toggleItemVisibility: (layerPath: string, item: TypeLegendItem): void => {
        // Redirect to processor
        LegendEventProcessor.toggleItemVisibility(get().mapId, layerPath, item, false).catch((error: unknown) => {
          // Log promise failed
          logger.logPromiseFailed('in LegendEventProcessor.toggleItemVisibility in LayerState.toggleItemVisibility', error);
        });
      },

      /**
       * Toggles the visibility of a single legend item on a layer and waits for completion.
       * This method inverts the current visibility of the given item, updates the
       * layer, and returns a promise that resolves once the change has been applied
       * and the layer has optionally finished rendering.
       * @param {string} layerPath - The path identifying the target layer within the map.
       * @param {TypeLegendItem} item - The legend item whose visibility will be toggled.
       * @returns {Promise<void>} A promise that resolves once the visibility change
       * has been applied and the layer has rendered if necessary.
       */
      toggleItemVisibilityAndWait: (layerPath: string, item: TypeLegendItem): Promise<void> => {
        // Redirect to processor
        return LegendEventProcessor.toggleItemVisibility(get().mapId, layerPath, item, true);
      },

      /**
       * Sets the visibility of all legend items in a layer.
       * This method updates the visibility of every item in the specified layer
       * asynchronously. Errors during the update are caught and logged.
       * @param {string} layerPath - The path identifying the target layer within the map.
       * @param {boolean} visibility - Whether all items in the layer should be visible.
       * @returns {void} This function does not return a value; errors are logged.
       */
      setAllItemsVisibility: (layerPath: string, visibility: boolean): void => {
        // Redirect to processor.
        LegendEventProcessor.setAllItemsVisibility(get().mapId, layerPath, visibility, false).catch((error: unknown) => {
          // Log promise failed
          logger.logPromiseFailed('in LegendEventProcessor.setAllItemsVisibility in LayerState.setAllItemsVisibility', error);
        });
      },

      /**
       * Sets the visibility of all legend items in a layer and waits for completion.
       * This method updates the visibility of every item in the specified layer and
       * returns a promise that resolves once all changes have been applied and the
       * layer has optionally finished rendering.
       * @param {string} layerPath - The path identifying the target layer within the map.
       * @param {boolean} visibility - Whether all items in the layer should be visible.
       * @returns {Promise<void>} A promise that resolves once the visibility changes
       * have been applied and the layer has rendered if necessary.
       */
      setAllItemsVisibilityAndWait: (layerPath: string, visibility: boolean): Promise<void> => {
        // Redirect to processor.
        return LegendEventProcessor.setAllItemsVisibility(get().mapId, layerPath, visibility, true);
      },

      /**
       * Sets the display state.
       * @param {TypeLayersViewDisplayState} newDisplayState - The display state to set.
       */
      setDisplayState: (newDisplayState: TypeLayersViewDisplayState): void => {
        // Redirect to setter
        get().layerState.setterActions.setDisplayState(newDisplayState);
      },

      /**
       * Sets the highlighted layer state.
       * @param {string} layerPath - The layer path to set as the highlighted layer.
       */
      setHighlightLayer: (layerPath: string): void => {
        // Redirect to event processor
        LegendEventProcessor.setHighlightLayer(get().mapId, layerPath);
      },

      /**
       * Sets the layer delete in progress state.
       * @param {string} newVal - The new value (the layerPath waiting to be deleted or '').
       */
      setLayerDeleteInProgress: (newVal: string): void => {
        // Redirect to setter
        get().layerState.setterActions.setLayerDeleteInProgress(newVal);
      },

      /**
       * Sets the opacity of the layer.
       * @param {string} layerPath - The layer path of the layer to change.
       * @param {number} opacity - The opacity to set.
       * @param {boolean} updateLegendLayers - Whether to update the legend layers or not
       */
      setLayerOpacity: (layerPath: string, opacity: number, updateLegendLayers?: boolean): void => {
        // Redirect to event processor
        LegendEventProcessor.setLayerOpacity(get().mapId, layerPath, opacity, updateLegendLayers);
      },

      /**
       * Sets if the layer hover capacity are enable or disable.
       * @param {string} layerPath - The layer path of the layer to change.
       * @param {number} enable - The true if enable.
       */
      setLayerHoverable: (layerPath: string, enable: boolean): void => {
        // Redirect to event processor
        LegendEventProcessor.setLayerHoverable(get().mapId, layerPath, enable);
      },

      /**
       * Sets if the layer query capacity are enable or disable.
       * @param {string} layerPath - The layer path of the layer to change.
       * @param {number} enable - The true if enable.
       */
      setLayerQueryable: (layerPath: string, enable: boolean): void => {
        // Redirect to event processor
        LegendEventProcessor.setLayerQueryable(get().mapId, layerPath, enable);
      },

      /**
       * Sets the selected layer path.
       * @param {string} layerPath - The layer path to set as selected.
       */
      setSelectedLayerPath: (layerPath: string): void => {
        // Redirect to event processor
        LegendEventProcessor.setSelectedLayersTabLayerInStore(get().mapId, layerPath);
      },

      /**
       * Zoom to extents of a layer.
       * @param {string} layerPath - The path of the layer to zoom to.
       */
      zoomToLayerExtent: (layerPath: string): Promise<void> => {
        // Define some zoom options
        const options: FitOptions = { padding: OL_ZOOM_PADDING, duration: OL_ZOOM_DURATION };

        // Get the layer bounds
        const bounds = LegendEventProcessor.getLayerBounds(get().mapId, layerPath);

        // If found
        if (bounds) {
          return MapEventProcessor.zoomToExtent(get().mapId, bounds, options);
        }

        // Failed
        throw new NoBoundsError(layerPath);
      },

      zoomToLayerVisibleScale: (layerPath: string): void => {
        // Redirect
        MapEventProcessor.zoomToLayerVisibleScale(get().mapId, layerPath);
      },
    },

    setterActions: {
      /**
       * Sets the display state.
       * @param {TypeLayersViewDisplayState} newDisplayState - The display state to set.
       */
      setDisplayState: (newDisplayState: TypeLayersViewDisplayState): void => {
        // Act as a toggle to get back to view - force to add when no layers
        const newState = get().layerState.displayState === newDisplayState ? 'view' : newDisplayState;
        const finalState = get().layerState.legendLayers.length === 0 ? 'add' : newState;
        set({
          layerState: {
            ...get().layerState,
            displayState: finalState,
          },
        });
      },

      /**
       * Sets the highlighted layer state.
       * @param {string} layerPath - The layer path to set as the highlighted layer.
       */
      setHighlightLayer: (layerPath: string): void => {
        set({
          layerState: {
            ...get().layerState,
            highlightedLayer: layerPath,
          },
        });
      },

      /**
       * Sets the layer delete in progress state.
       * @param {string} newVal - The new value (the layerPath waiting to be deleted or '').
       */
      setLayerDeleteInProgress: (newVal: string): void => {
        set({
          layerState: {
            ...get().layerState,
            layerDeleteInProgress: newVal,
          },
        });
      },

      /**
       * Sets the legend layers state.
       * @param {TypeLegendLayer} legendLayers - The legend layers to set.
       */
      setLegendLayers: (legendLayers: TypeLegendLayer[]): void => {
        set({
          layerState: {
            ...get().layerState,
            legendLayers: [...legendLayers],
            // GV Here, we use the spread operator for the custom selector hooks such as useLayerSelectorLayerStatus to
            // GV notice and eventually trigger the changes that need to be get triggered
          },
        });
      },

      /**
       * Sets the selected layer path.
       * @param {string | undefined} layerPath - The layer path to set as selected.
       */
      setSelectedLayerPath: (layerPath: string | undefined): void => {
        let theLayerPath: string | undefined = layerPath;
        if (layerPath && layerPath.length === 0) theLayerPath = undefined;
        const curLayers = get().layerState.legendLayers;
        const layer = LegendEventProcessor.findLayerByPath(curLayers, layerPath!);
        set({
          layerState: {
            ...get().layerState,
            selectedLayerPath: theLayerPath,
            selectedLayer: layer as TypeLegendLayer,
          },
        });
      },

      setLayersAreLoading: (areLoading: boolean): void => {
        set({
          layerState: {
            ...get().layerState,
            layersAreLoading: areLoading,
          },
        });
      },
    },
    // #endregion ACTIONS
  } as ILayerState;
}

export type TypeLegendResultInfo = {
  layerStatus: TypeLayerStatus;
  legendQueryStatus: LegendQueryStatus;
  data: TypeLegend | undefined;
};

export type LegendQueryStatus = 'init' | 'querying' | 'queried' | 'error';

export type TypeLegend = {
  type: TypeGeoviewLayerType;
  // Layers other than vector layers use the HTMLCanvasElement type for their legend.
  legend: TypeVectorLayerStyles | HTMLCanvasElement | null;
  styleConfig?: TypeLayerStyleConfig;
};

export type TypeLegendResultSetEntry = TypeResultSetEntry & TypeLegendResultInfo;

export type TypeLegendResultSet = TypeResultSet<TypeLegendResultSetEntry>;

// **********************************************************
// Layer state selectors
// **********************************************************

export const useLayerHighlightedLayer = (): string => useStore(useGeoViewStore(), (state) => state.layerState.highlightedLayer);
export const useLayerLegendLayers = (): TypeLegendLayer[] => useStore(useGeoViewStore(), (state) => state.layerState.legendLayers);
export const useLayerSelectedLayer = (): TypeLegendLayer => useStore(useGeoViewStore(), (state) => state.layerState.selectedLayer);
export const useLayerSelectedLayerPath = (): string | null | undefined =>
  useStore(useGeoViewStore(), (state) => state.layerState.selectedLayerPath);
export const useLayerDisplayState = (): TypeLayersViewDisplayState => useStore(useGeoViewStore(), (state) => state.layerState.displayState);
export const useLayerDeleteInProgress = (): string => useStore(useGeoViewStore(), (state) => state.layerState.layerDeleteInProgress);
export const useLayerAreLayersLoading = (): boolean => useStore(useGeoViewStore(), (state) => state.layerState.layersAreLoading);

// computed gets
export const useSelectedLayer = (): TypeLegendLayer | undefined => {
  const layers = useStore(useGeoViewStore(), (state) => state.layerState.legendLayers);
  const selectedLayerPath = useStore(useGeoViewStore(), (state) => state.layerState.selectedLayerPath);
  if (selectedLayerPath) {
    return LegendEventProcessor.findLayerByPath(layers, selectedLayerPath);
  }
  return undefined;
};

export const useLayerIconLayerSet = (layerPath: string): string[] => {
  const layers = useStore(useGeoViewStore(), (state) => state.layerState.legendLayers);
  const layer = LegendEventProcessor.findLayerByPath(layers, layerPath);
  if (layer && layer.schemaTag !== CONST_LAYER_TYPES.WMS) {
    return layer.items.map((item) => item.icon).filter((d) => d !== null);
  }
  if (layer && layer.schemaTag === CONST_LAYER_TYPES.WMS) {
    return layer.icons.map((item) => item.iconImage).filter((d) => d !== null) as string[];
  }
  return [];
};

/**
 * React hook that returns if the time dimension for a layer.
 * @returns {TimeDimension | undefined} - The time dimension for the layer if any.
 */
export const useLayerTimeDimension = (layerPath: string): TimeDimension | undefined => {
  // Hook
  return useStore(useGeoViewStore(), (state) => {
    // TODO: REFACTOR - This getter has nothing to do with the store state and fakes it via the LegendEventProcessor going through the layerApi.
    // TO.DOCONT: This pattern shouldn't(?) be allowed in the framework, but the processors allow it via getters jumping on the cgpv.api.
    return LegendEventProcessor.getLayerTimeDimension(state.mapId, layerPath);
  });
};

/**
 * React hook that returns if the temporal modes for the layers.
 * @returns {Record<string, TemporalMode>} - The temporal mode of the dates for the layer.
 */
export const useLayerDateTemporalModes = (): Record<string, TemporalMode> => {
  // Hook
  return useStableSelector(useGeoViewStore(), (state) => {
    // Get all layers
    const allLayers = LegendEventProcessor.findAllLayers(state.layerState.legendLayers);

    // Return the object with the display date temporal modes for all layers, using the default format when not defined at the layer level
    return Object.values(allLayers).reduce<Record<string, TemporalMode>>((acc, layer) => {
      if (layer.layerPath) {
        // eslint-disable-next-line no-param-reassign
        acc[layer.layerPath] = layer.dateTemporalMode ?? DateMgt.DEFAULT_TEMPORAL_MODE;
      }
      return acc;
    }, {});
  });
};

/**
 * React hook that returns if the temporal mode of the dates for the layer.
 * @param {string} layerPath - Unique path identifying the layer in the legend state.
 * @returns {TemporalMode} - The temporal mode of the dates for the layer. Default: DateMgt.DEFAULT_TEMPORAL_MODE.
 */
export const useLayerDateTemporalMode = (layerPath: string): TemporalMode => {
  // Hook
  return useStore(useGeoViewStore(), (state) => {
    return (
      LegendEventProcessor.findLayerByPath(state.layerState.legendLayers, layerPath)?.dateTemporalMode ?? DateMgt.DEFAULT_TEMPORAL_MODE
    );
  });
};

/**
 * React hook that returns if the display date formats for the layers.
 * @returns {Record<string, TypeDisplayDateFormat>} - The display date format of the dates for the layer.
 */
export const useLayerDisplayDateFormats = (): Record<string, TypeDisplayDateFormat> => {
  // Hook
  return useStableSelector(useGeoViewStore(), (state) => {
    // Get the default format
    const defaultFormat = AppEventProcessor.getDisplayDateFormatDefault(state.mapId).datetimeFormat;

    // Get all layers
    const allLayers = LegendEventProcessor.findAllLayers(state.layerState.legendLayers);

    // Return the object with the display date formats for all layers, using the default format when not defined at the layer level
    return Object.values(allLayers).reduce<Record<string, TypeDisplayDateFormat>>((acc, layer) => {
      if (layer.layerPath) {
        // eslint-disable-next-line no-param-reassign
        acc[layer.layerPath] = layer.displayDateFormat ?? defaultFormat;
      }
      return acc;
    }, {});
  });
};

/**
 * React hook that returns the display date format for a specific layer.
 * The hook first attempts to resolve a layer-specific display date format
 * using the provided layer path. If the layer does not define its own
 * display date format (or cannot be found), the application-wide display
 * date format for the current map is returned as a fallback.
 * @param {string} layerPath - Unique path identifying the layer in the legend state.
 * @returns {TypeDisplayDateFormat} - The display date format to use for the layer, falling back to the
 * application's default display date format when none is defined.
 */
export const useLayerDisplayDateFormat = (layerPath: string): TypeDisplayDateFormat => {
  // Hook
  return useStore(useGeoViewStore(), (state) => {
    return (
      LegendEventProcessor.findLayerByPath(state.layerState.legendLayers, layerPath)?.displayDateFormat ??
      AppEventProcessor.getDisplayDateFormatDefault(state.mapId).datetimeFormat
    );
  });
};

/**
 * React hook that returns the display date format for a specific layer.
 * The hook first attempts to resolve a layer-specific display date format
 * using the provided layer path. If the layer does not define its own
 * display date format (or cannot be found), the application-wide display
 * date format for the current map is returned as a fallback.
 * @param {string} layerPath - Unique path identifying the layer in the legend state.
 * @returns {TypeDisplayDateFormat} - The display date format to use for the layer, falling back to the
 * application's default display date format when none is defined.
 */
export const useLayerDisplayDateFormatShort = (layerPath: string): TypeDisplayDateFormat => {
  // Hook
  return useStore(useGeoViewStore(), (state) => {
    return (
      LegendEventProcessor.findLayerByPath(state.layerState.legendLayers, layerPath)?.displayDateFormatShort ??
      LegendEventProcessor.findLayerByPath(state.layerState.legendLayers, layerPath)?.displayDateFormat ??
      AppEventProcessor.getDisplayDateFormatDefault(state.mapId).dateFormat
    );
  });
};

/**
 * React hook that returns if the display date timezones for the layers.
 * @returns {Record<string, TimeIANA>} - The display date timezone of the dates for the layer.
 */
export const useLayerDisplayDateTimezones = (): Record<string, TimeIANA> => {
  // Hook
  return useStableSelector(useGeoViewStore(), (state) => {
    // Get all layers
    const allLayers = LegendEventProcessor.findAllLayers(state.layerState.legendLayers);

    // Return the object with the display date timezones for all layers, using the default format when not defined at the layer level
    return Object.values(allLayers).reduce<Record<string, TimeIANA>>((acc, layer) => {
      if (layer.layerPath) {
        // eslint-disable-next-line no-param-reassign
        acc[layer.layerPath] = layer.displayDateTimezone ?? AppEventProcessor.getDisplayDateTimezone(state.mapId);
      }
      return acc;
    }, {});
  });
};

/**
 * React hook that returns the display date timezone for a specific layer.
 * The hook first attempts to resolve a layer-specific display date timezone
 * using the provided layer path. If the layer does not define its own
 * display date timezone (or cannot be found), the application-wide display
 * date timezone for the current map is returned as a fallback.
 * @param {string} layerPath - Unique path identifying the layer in the legend state.
 * @returns {TimeIANA} - The display date timezone to use for the layer, falling back to the
 * application's default display date timezone when none is defined.
 */
export const useLayerDisplayDateTimezone = (layerPath: string): TimeIANA => {
  // Hook
  return useStore(useGeoViewStore(), (state) => {
    return (
      LegendEventProcessor.findLayerByPath(state.layerState.legendLayers, layerPath)?.displayDateTimezone ??
      AppEventProcessor.getDisplayDateTimezone(state.mapId)
    );
  });
};

// Generic hook that can select any key from the layer
function useLayerSelectorLayerValueGeneric<K extends keyof TypeLegendLayer>(layerPath: string, key: K): TypeLegendLayer[K] | undefined {
  return useStore(useGeoViewStore(), (state) => {
    const layer = LegendEventProcessor.findLayerByPath(state.layerState.legendLayers, layerPath);
    return layer?.[key];
  });
}

// Factory to create strongly typed layer selector hooks
function createLayerSelectorHook<K extends keyof TypeLegendLayer>(key: K) {
  return (layerPath: string): TypeLegendLayer[K] | undefined => useLayerSelectorLayerValueGeneric(layerPath, key);
}

// Specialized hooks
export const useLayerSelectorId = createLayerSelectorHook('layerId');

export const useLayerSelectorName = createLayerSelectorHook('layerName');
export const useLayerNames = (): Record<string, string> => {
  // Hook
  return useStableSelector(useGeoViewStore(), (state) => {
    // Get all layers
    const allLayers = LegendEventProcessor.findAllLayers(state.layerState.legendLayers);

    // Return the object with the layer names for all layers
    return Object.values(allLayers).reduce<Record<string, string>>((acc, layer) => {
      if (layer.layerPath) {
        // eslint-disable-next-line no-param-reassign
        acc[layer.layerPath] = layer.layerName;
      }
      return acc;
    }, {});
  });
};

export const useLayerSelectorStatus = createLayerSelectorHook('layerStatus');
export const useLayerStatuses = (): Record<string, TypeLayerStatus> => {
  // Hook
  return useStableSelector(useGeoViewStore(), (state) => {
    // Get all layers
    const allLayers = LegendEventProcessor.findAllLayers(state.layerState.legendLayers);

    // Return the object with the layer statuses for all layers, using the default 'newInstance' when not defined at the layer level
    return Object.values(allLayers).reduce<Record<string, TypeLayerStatus>>((acc, layer) => {
      if (layer.layerPath) {
        // eslint-disable-next-line no-param-reassign
        acc[layer.layerPath] = layer.layerStatus ?? 'newInstance'; // Defaults to most basic
      }
      return acc;
    }, {});
  });
};

export const useLayerSelectorFilter = createLayerSelectorHook('layerFilter');
export const useLayerSelectorFilterClass = createLayerSelectorHook('layerFilterClass');
export const useLayerSelectorSchemaTag = createLayerSelectorHook('schemaTag');
export const useLayerSelectorEntryType = createLayerSelectorHook('entryType');
export const useLayerSelectorBounds = createLayerSelectorHook('bounds');
export const useLayerSelectorBounds4326 = createLayerSelectorHook('bounds4326');
export const useLayerSelectorControls = createLayerSelectorHook('controls');
export const useLayerSelectorChildren = createLayerSelectorHook('children');
export const useLayerSelectorItems = createLayerSelectorHook('items');
export const useLayerSelectorIcons = createLayerSelectorHook('icons');
export const useLayerSelectorLegendQueryStatus = createLayerSelectorHook('legendQueryStatus');
export const useLayerSelectorCanToggle = createLayerSelectorHook('canToggle');
export const useLayerSelectorStyleConfig = createLayerSelectorHook('styleConfig');

// Store Actions
export const useLayerStoreActions = (): LayerActions => useStore(useGeoViewStore(), (state) => state.layerState.actions);
