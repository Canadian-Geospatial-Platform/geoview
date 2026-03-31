import { useStore } from 'zustand';

import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';

import { getGeoViewStore, useGeoViewStore } from '@/core/stores/stores-managers';
import type { TypeLayersViewDisplayState, TypeLegendItem, TypeLegendLayer } from '@/core/components/layers/types';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { type TypeGetStore, type TypeSetStore, useStableSelector } from '@/core/stores/geoview-store';
import type { TypeLayerStyleConfig, TypeResultSet, TypeResultSetEntry } from '@/api/types/map-schema-types';
import { DateMgt, type TemporalMode, type TimeDimension, type TimeIANA, type TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import type {
  TypeGeoviewLayerType,
  TypeLayerStatus,
  TypeMetadataEsriRasterFunctionInfos,
  TypeMetadataWMSCapabilityLayerStyle,
  TypeMosaicMethod,
  TypeMosaicRule,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { TypeVectorLayerStyles } from '@/geo/utils/renderer/geoview-renderer';
import { getStoreMapOrderedLayerIndexByPath } from './map-state';
import { getStoreDisplayDateFormatDefault, getStoreDisplayDateTimezone } from './app-state';
import { logger } from '@/core/utils/logger';
import { Projection } from '@/geo/utils/projection';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { GeoUtilities } from '@/geo/utils/utilities';

// #region INTERFACE DEFINITION

/**
 * Represents the layer Zustand store slice.
 *
 * Manages state for the layer panel including legend layers, the selected
 * and highlighted layer, the display state (view / add / reorder), and
 * a loading indicator.
 */
export interface ILayerState {
  /** The layer path of the currently highlighted layer. */
  highlightedLayer: string;

  /** The full legend layer object for the currently selected layer. */
  selectedLayer: TypeLegendLayer;

  /** The layer path of the currently selected layer, or undefined if none is selected. */
  selectedLayerPath?: string;

  /** The array of legend layer objects representing the full layer tree. */
  legendLayers: TypeLegendLayer[];

  /** The current layers panel display state (e.g. 'view', 'add', 'reorder'). */
  displayState: TypeLayersViewDisplayState;

  /** Whether one or more layers are currently loading. */
  layersAreLoading: boolean;

  /**
   * Applies default configuration values from the map config to the layer store.
   *
   * @param geoviewConfig - The map features configuration to extract defaults from.
   */
  setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;

  /** Store setter actions callable from adaptors. */
  actions: {
    setDisplayState: (newDisplayState: TypeLayersViewDisplayState) => void;
    setHighlightLayer: (layerPath: string) => void;
    setLegendLayers: (legendLayers: TypeLegendLayer[]) => void;
    setSelectedLayerPath: (layerPath: string | undefined) => void;
    setLayersAreLoading: (areLoading: boolean) => void;
    setLayerDeletionStartTime: (layerPath: string, startTime: number | undefined) => void;
  };
}

// #endregion INTERFACE DEFINITION

// #region UTIL FUNCTIONS

/**
 * Recursively searches the legend layers tree for a layer matching the given path.
 *
 * @param layers - The legend layers array to search.
 * @param layerPath - The layer path to find.
 * @returns The matching legend layer, or undefined if not found.
 */
const utilLegendLayerByPathRec = (layers: TypeLegendLayer[], layerPath: string | undefined): TypeLegendLayer | undefined => {
  // If no layer path
  if (!layerPath) return undefined;

  // Loop on the layers
  let foundLayer: TypeLegendLayer | undefined;
  layers.forEach((layer) => {
    // If found, skip
    if (foundLayer) return;

    if (layerPath === layer.layerPath) {
      foundLayer = layer;
    }

    // TODO: CHECK - Change this startsWith to an equal operator? Seems safer
    if (layerPath?.startsWith(`${layer.layerPath}/`) && layer.children?.length > 0) {
      // Recursively search in children if the layerPath starts with the current layer's path followed by a slash (indicating it's a descendant)
      const result = utilLegendLayerByPathRec(layer.children, layerPath);
      if (result) {
        foundLayer = result;
      }
    }
  });

  // Return the found layer if any
  return foundLayer;
};

/**
 * Recursively collects all legend layers (including nested children) into a flat record.
 *
 * @param layers - The legend layers array to flatten.
 * @returns A record of all layers keyed by their layer path.
 */
const utilFindAllLayers = (layers: TypeLegendLayer[]): Record<string, TypeLegendLayer> => {
  // The complete object that will be returned
  const total: Record<string, TypeLegendLayer> = {};

  // Collect the layers recursively
  const traverse = (currentLayers: TypeLegendLayer[]): void => {
    // For each layer at the current level
    currentLayers.forEach((layer) => {
      if (layer.layerPath) {
        total[layer.layerPath] = layer;
      }

      // If any children
      if (layer.children?.length) {
        traverse(layer.children);
      }
    });
  };

  // Go recursive
  traverse(layers);

  // Return the total
  return total;
};

// #endregion UTIL FUNCTIONS

// #region STATE INITIALIZATION

/**
 * Initializes a Layer State and provide functions which use the get/set Zustand mechanisms.
 *
 * @param set - The setter callback to be used by this state
 * @param get - The getter callback to be used by this state
 * @returns The initialized Layer State
 */
export function initializeLayerState(set: TypeSetStore, get: TypeGetStore): ILayerState {
  /**
   * Helper function to update a layer property given its layer path.
   */
  const helperUpdateLayerByPath = (
    layers: TypeLegendLayer[],
    layerPath: string,
    updater: (layer: TypeLegendLayer) => TypeLegendLayer
  ): TypeLegendLayer[] => {
    return layers.map((layer) => {
      if (layer.layerPath === layerPath) {
        return updater(layer);
      }

      if (layer.children?.length) {
        return {
          ...layer,
          children: helperUpdateLayerByPath(layer.children, layerPath, updater),
        };
      }

      return layer;
    });
  };

  return {
    highlightedLayer: '',
    legendLayers: [] as TypeLegendLayer[],
    displayState: 'view',

    // Initialize default
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig): void => {
      set({
        layerState: {
          ...get().layerState,
          selectedLayerPath: geoviewConfig.footerBar?.selectedLayersLayerPath || geoviewConfig.appBar?.selectedLayersLayerPath,
        },
      });
    },

    actions: {
      /**
       * Sets the display state.
       *
       * @param newDisplayState - The display state to set.
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
       *
       * @param layerPath - The layer path to set as the highlighted layer.
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
       * Sets the legend layers state.
       *
       * @param legendLayers - The legend layers to set.
       */
      // TODO: REFACTOR - Calls to setLegendLayers are probably overkill when updating only parts of the whole objects array
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
       *
       * @param layerPath - The layer path to set as selected.
       */
      setSelectedLayerPath: (layerPath: string | undefined): void => {
        let theLayerPath: string | undefined = layerPath;
        if (layerPath && layerPath.length === 0) theLayerPath = undefined;
        const curLayers = get().layerState.legendLayers;
        const layer = utilLegendLayerByPathRec(curLayers, layerPath);
        set({
          layerState: {
            ...get().layerState,
            selectedLayerPath: theLayerPath,
            selectedLayer: layer as TypeLegendLayer,
          },
        });
      },

      /**
       * Sets the layer as loading.
       *
       * @param areLoading - Whether the layers are loading.
       */
      setLayersAreLoading: (areLoading: boolean): void => {
        set({
          layerState: {
            ...get().layerState,
            layersAreLoading: areLoading,
          },
        });
      },

      /**
       * Updates the deletion progress of a specific layer in the store.
       * This function immutably updates the `legendLayers` array in the
       * `layerState` by setting or removing the `deletionProgressPercentage`
       * property for the layer identified by `layerPath`.
       *
       * @param layerPath - The unique path or identifier of the layer to update.
       * @param progression - The deletion progress percentage (0–100).
       *   - If a number is provided, sets `deletionProgressPercentage` to that value.
       *   - If `undefined`, removes the `deletionProgressPercentage` property from the layer.
       * @remarks
       * This function uses the helper `helperUpdateLayerByPath` to find the
       * target layer and update it immutably, ensuring that the rest of the
       * `legendLayers` array remains unchanged.
       */
      setLayerDeletionStartTime: (layerPath: string, startTime: number | undefined): void => {
        set((state) => {
          // Create updated legendLayers immutably
          const updatedLegendLayers = helperUpdateLayerByPath(state.layerState.legendLayers, layerPath, (layer) => {
            if (startTime === undefined) {
              // Remove deletionStartTime immutably
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { deletionStartTime, ...rest } = layer;
              return rest;
            }

            return {
              ...layer,
              deletionStartTime: startTime,
            };
          });

          return {
            layerState: {
              ...state.layerState,
              legendLayers: updatedLegendLayers,
            },
          };
        });
      },
    },
  } as ILayerState;
}

// #endregion STATE INITIALIZATION

// #region STATE HOOKS
// GV To be used by React components

/** Hook that returns the highlighted layer path. */
export const useLayerHighlightedLayer = (): string => useStore(useGeoViewStore(), (state) => state.layerState.highlightedLayer);

/** Hook that returns the full legend layers array. */
export const useLayerLegendLayers = (): TypeLegendLayer[] => useStore(useGeoViewStore(), (state) => state.layerState.legendLayers);

/** Hook that returns the selected legend layer object. */
export const useLayerSelectedLayer = (): TypeLegendLayer => useStore(useGeoViewStore(), (state) => state.layerState.selectedLayer);

/** Hook that returns the selected layer path. */
export const useLayerSelectedLayerPath = (): string | null | undefined =>
  useStore(useGeoViewStore(), (state) => state.layerState.selectedLayerPath);

/** Hook that returns the current layers panel display state. */
export const useLayerDisplayState = (): TypeLayersViewDisplayState => useStore(useGeoViewStore(), (state) => state.layerState.displayState);

/** Hook that returns whether layers are currently loading. */
export const useLayerAreLayersLoading = (): boolean => useStore(useGeoViewStore(), (state) => state.layerState.layersAreLoading);

/**
 * Hook that returns the selected legend layer by looking it up from the legend layers array.
 *
 * @returns The selected legend layer, or undefined if none is selected.
 */
export const useSelectedLayer = (): TypeLegendLayer | undefined => {
  const layers = useStore(useGeoViewStore(), (state) => state.layerState.legendLayers);
  const selectedLayerPath = useStore(useGeoViewStore(), (state) => state.layerState.selectedLayerPath);
  if (selectedLayerPath) {
    return utilLegendLayerByPathRec(layers, selectedLayerPath);
  }
  return undefined;
};

/**
 * Hook that returns the icon set (image URLs) for a specific layer.
 *
 * For WMS layers, returns canvas icon images; for other types, returns item icons.
 *
 * @param layerPath - The layer path to get icons for.
 * @returns An array of icon image strings.
 */
export const useLayerIconLayerSet = (layerPath: string): string[] => {
  const layers = useStore(useGeoViewStore(), (state) => state.layerState.legendLayers);
  const layer = utilLegendLayerByPathRec(layers, layerPath);
  if (layer && layer.schemaTag !== CONST_LAYER_TYPES.WMS) {
    return layer.items.map((item) => item.icon).filter((d) => d !== null);
  }
  if (layer && layer.schemaTag === CONST_LAYER_TYPES.WMS) {
    return layer.icons.map((item) => item.iconImage).filter((d) => d !== null) as string[];
  }
  return [];
};

/**
 * React hook that returns if the temporal modes for the layers.
 *
 * @returns The temporal mode of the dates for the layer.
 */
export const useLayerDateTemporalModes = (): Record<string, TemporalMode> => {
  // Hook
  return useStableSelector(useGeoViewStore(), (state) => {
    // Get all layers
    const allLayers = utilFindAllLayers(state.layerState.legendLayers);

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
 *
 * @param layerPath - Unique path identifying the layer in the legend state.
 * @returns The temporal mode of the dates for the layer. Default: DateMgt.DEFAULT_TEMPORAL_MODE.
 */
export const useLayerDateTemporalMode = (layerPath: string | undefined): TemporalMode => {
  // Hook
  return useStore(useGeoViewStore(), (state) => {
    return utilLegendLayerByPathRec(state.layerState.legendLayers, layerPath)?.dateTemporalMode ?? DateMgt.DEFAULT_TEMPORAL_MODE;
  });
};

/**
 * React hook that returns if the display date formats for the layers.
 *
 * @returns The display date format of the dates for the layer.
 */
export const useLayerDisplayDateFormats = (): Record<string, TypeDisplayDateFormat> => {
  // Hook
  return useStableSelector(useGeoViewStore(), (state) => {
    // Get the default format
    const defaultFormat = getStoreDisplayDateFormatDefault(state.mapId).datetimeFormat;

    // Get all layers
    const allLayers = utilFindAllLayers(state.layerState.legendLayers);

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
 *
 * @param layerPath - Unique path identifying the layer in the legend state.
 * @returns The display date format to use for the layer, falling back to the
 * application's default display date format when none is defined.
 */
export const useLayerDisplayDateFormat = (layerPath: string | undefined): TypeDisplayDateFormat => {
  // Hook
  return useStore(useGeoViewStore(), (state) => {
    return (
      utilLegendLayerByPathRec(state.layerState.legendLayers, layerPath)?.displayDateFormat ??
      getStoreDisplayDateFormatDefault(state.mapId).datetimeFormat
    );
  });
};

/**
 * React hook that returns the display date format for a specific layer.
 * The hook first attempts to resolve a layer-specific display date format
 * using the provided layer path. If the layer does not define its own
 * display date format (or cannot be found), the application-wide display
 * date format for the current map is returned as a fallback.
 *
 * @param layerPath - Unique path identifying the layer in the legend state.
 * @returns The display date format to use for the layer, falling back to the
 * application's default display date format when none is defined.
 */
export const useLayerDisplayDateFormatShort = (layerPath: string | undefined): TypeDisplayDateFormat => {
  // Hook
  return useStore(useGeoViewStore(), (state) => {
    return (
      utilLegendLayerByPathRec(state.layerState.legendLayers, layerPath)?.displayDateFormatShort ??
      utilLegendLayerByPathRec(state.layerState.legendLayers, layerPath)?.displayDateFormat ??
      getStoreDisplayDateFormatDefault(state.mapId).dateFormat
    );
  });
};

/**
 * React hook that returns if the display date timezones for the layers.
 *
 * @returns The display date timezone of the dates for the layer.
 */
export const useLayerDisplayDateTimezones = (): Record<string, TimeIANA> => {
  // Hook
  return useStableSelector(useGeoViewStore(), (state) => {
    // Get all layers
    const allLayers = utilFindAllLayers(state.layerState.legendLayers);

    // Return the object with the display date timezones for all layers, using the default format when not defined at the layer level
    return Object.values(allLayers).reduce<Record<string, TimeIANA>>((acc, layer) => {
      if (layer.layerPath) {
        // eslint-disable-next-line no-param-reassign
        acc[layer.layerPath] = layer.displayDateTimezone ?? getStoreDisplayDateTimezone(state.mapId);
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
 *
 * @param layerPath - Unique path identifying the layer in the legend state.
 * @returns The display date timezone to use for the layer, falling back to the
 * application's default display date timezone when none is defined.
 */
export const useLayerDisplayDateTimezone = (layerPath: string | undefined): TimeIANA => {
  // Hook
  return useStore(useGeoViewStore(), (state) => {
    return (
      utilLegendLayerByPathRec(state.layerState.legendLayers, layerPath)?.displayDateTimezone ?? getStoreDisplayDateTimezone(state.mapId)
    );
  });
};

/**
 * Generic hook that selects a single property from a legend layer by path.
 *
 * @param layerPath - The layer path to look up.
 * @param key - The property key to select from the layer.
 * @returns The value of the property, or undefined if the layer is not found.
 */
function useLayerSelectorLayerValueGeneric<K extends keyof TypeLegendLayer>(layerPath: string, key: K): TypeLegendLayer[K] | undefined {
  return useStore(useGeoViewStore(), (state) => {
    const layer = utilLegendLayerByPathRec(state.layerState.legendLayers, layerPath);
    return layer?.[key];
  });
}

/**
 * Factory that creates a strongly typed hook for selecting a specific legend layer property.
 *
 * @param key - The property key to create a selector hook for.
 * @returns A hook that accepts a layerPath and returns the property value.
 */
function createLayerSelectorHook<K extends keyof TypeLegendLayer>(key: K) {
  return (layerPath: string): TypeLegendLayer[K] | undefined => useLayerSelectorLayerValueGeneric(layerPath, key);
}

/** Hook that returns the layer id for a specific layer. */
export const useLayerSelectorId = createLayerSelectorHook('layerId');

/** Hook that returns the layer name for a specific layer. */
export const useLayerSelectorName = createLayerSelectorHook('layerName');

/**
 * Hook that returns a record of layer names for all layers.
 *
 * @returns A record of layer names keyed by layer path.
 */
export const useLayerNames = (): Record<string, string> => {
  // Hook
  return useStableSelector(useGeoViewStore(), (state) => {
    // Get all layers
    const allLayers = utilFindAllLayers(state.layerState.legendLayers);

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

/** Hook that returns the layer status for a specific layer. */
export const useLayerSelectorStatus = createLayerSelectorHook('layerStatus');

/**
 * Hook that returns a record of layer statuses for all layers.
 *
 * @returns A record of layer statuses keyed by layer path, defaulting to 'newInstance'.
 */
export const useLayerStatuses = (): Record<string, TypeLayerStatus> => {
  // Hook
  return useStableSelector(useGeoViewStore(), (state) => {
    // Get all layers
    const allLayers = utilFindAllLayers(state.layerState.legendLayers);

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

/** Hook that returns the deletion start time for a specific layer. */
export const useLayerSelectorDeletionStartTime = createLayerSelectorHook('deletionStartTime');

/** Hook that returns the layer filter for a specific layer. */
export const useLayerSelectorFilter = createLayerSelectorHook('layerFilter');

/** Hook that returns the layer filter class for a specific layer. */
export const useLayerSelectorFilterClass = createLayerSelectorHook('layerFilterClass');

/** Hook that returns the schema tag for a specific layer. */
export const useLayerSelectorSchemaTag = createLayerSelectorHook('schemaTag');

/** Hook that returns the entry type for a specific layer. */
export const useLayerSelectorEntryType = createLayerSelectorHook('entryType');

/** Hook that returns the bounds extent for a specific layer. */
export const useLayerSelectorBounds = createLayerSelectorHook('bounds');

/** Hook that returns the EPSG:4326 bounds for a specific layer. */
export const useLayerSelectorBounds4326 = createLayerSelectorHook('bounds4326');

/** Hook that returns the controls configuration for a specific layer. */
export const useLayerSelectorControls = createLayerSelectorHook('controls');

/** Hook that returns the children layers for a specific layer. */
export const useLayerSelectorChildren = createLayerSelectorHook('children');

/** Hook that returns the legend items for a specific layer. */
export const useLayerSelectorItems = createLayerSelectorHook('items');

/** Hook that returns the legend icons for a specific layer. */
export const useLayerSelectorIcons = createLayerSelectorHook('icons');

/** Hook that returns the legend query status for a specific layer. */
export const useLayerSelectorLegendQueryStatus = createLayerSelectorHook('legendQueryStatus');

/** Hook that returns whether toggling is allowed for a specific layer. */
export const useLayerSelectorCanToggle = createLayerSelectorHook('canToggle');

/** Hook that returns the style configuration for a specific layer. */
export const useLayerSelectorStyleConfig = createLayerSelectorHook('styleConfig');

/** Hook that returns the raster function for a specific layer. */
export const useLayerSelectorRasterFunction = createLayerSelectorHook('rasterFunction');

/** Hook that returns the mosaic rule for a specific layer. */
export const useLayerSelectorMosaicRule = createLayerSelectorHook('mosaicRule');

/** Hook that returns the WMS style for a specific layer. */
export const useLayerSelectorWmsStyle = createLayerSelectorHook('wmsStyle');

/** Hook that returns the available WMS styles metadata for a specific layer. */
export const useLayerSelectorWmsStyles = createLayerSelectorHook('wmsStyles');

/** Hook that returns if the layer has text. */
export const useLayerSelectorHasText = createLayerSelectorHook('hasText');

/** Hook that returns the text visibility for a specific layer. */
export const useLayerSelectorTextVisibility = createLayerSelectorHook('textVisible');

/** Hook that returns the raster function infos for a specific layer. */
export const useLayerSelectorRasterFunctionInfos = createLayerSelectorHook('rasterFunctionInfos');

/** Hook that returns the allowed mosaic methods for a specific layer. */
export const useLayerSelectorAllowedMosaicMethods = createLayerSelectorHook('allowedMosaicMethods');

/** Hook that returns the time dimension for a specific layer. */
export const useLayerTimeDimension = createLayerSelectorHook('timeDimension');

// #endregion STATE HOOKS

// #region STATE SELECTORS

/**
 * Returns the full layer state slice for the given map.
 *
 * Internal-only selector - not exported to avoid direct store access from outside this module.
 *
 * @param mapId - The map identifier.
 * @returns The ILayerState for the given map.
 */
// GV No export for the main state!
const getStoreLayerState = (mapId: string): ILayerState => getGeoViewStore(mapId).getState().layerState;

/**
 * Gets the selected layer path for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The selected layer path, or undefined if none is selected.
 */
export const getStoreLayerStateSelectedLayerPath = (mapId: string): string | undefined => {
  return getStoreLayerState(mapId).selectedLayerPath;
};

/**
 * Gets the highlighted layer path for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The highlighted layer path.
 */
export const getStoreLayerStateHighlightedLayer = (mapId: string): string => {
  return getStoreLayerState(mapId).highlightedLayer;
};

/**
 * Gets the layers panel display state for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The display state.
 */
export const getStoreLayerStateDisplayState = (mapId: string): TypeLayersViewDisplayState => {
  return getStoreLayerState(mapId).displayState;
};

/**
 * Gets whether layers are currently loading for the given map.
 *
 * @param mapId - The map identifier.
 * @returns True if layers are loading.
 */
export const getStoreLayerStateAreLayersLoading = (mapId: string): boolean => {
  return getStoreLayerState(mapId).layersAreLoading;
};

/**
 * Gets the full legend layers array for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The legend layers array.
 */
export const getStoreLayerStateLegendLayers = (mapId: string): TypeLegendLayer[] => {
  return getStoreLayerState(mapId).legendLayers;
};

/**
 * Gets a specific legend layer by its path for the given map.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @returns The matching legend layer, or undefined if not found.
 */
export const getStoreLayerStateLegendLayerByPath = (mapId: string, layerPath: string): TypeLegendLayer | undefined => {
  return utilLegendLayerByPathRec(getStoreLayerStateLegendLayers(mapId), layerPath);
};

/**
 * Gets the bounds extent for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @returns The layer bounds extent, or undefined.
 */
export const getStoreLayerStateLayerBounds = (mapId: string, layerPath: string): Extent | undefined => {
  return getStoreLayerStateLegendLayerByPath(mapId, layerPath)?.bounds;
};

/**
 * Gets the layer status for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @returns The layer status, or undefined.
 */
export const getStoreLayerStateLayerStatus = (mapId: string, layerPath: string): TypeLayerStatus | undefined => {
  return getStoreLayerStateLegendLayerByPath(mapId, layerPath)?.layerStatus;
};

/**
 * Gets a specific legend item by name for a layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @param name - The legend item name to find.
 * @returns The matching legend item, or undefined.
 */
export const getStoreLayerItemVisibility = (mapId: string, layerPath: string, name: string): TypeLegendItem | undefined => {
  return getStoreLayerStateLegendLayerByPath(mapId, layerPath)?.items.find((item) => item.name === name);
};

/**
 * Gets the display date format for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @returns The display date format, or undefined.
 */
export const getStoreLayerDisplayDateFormat = (mapId: string, layerPath: string): TypeDisplayDateFormat | undefined => {
  return getStoreLayerStateLegendLayerByPath(mapId, layerPath)?.displayDateFormat;
};

/**
 * Gets the WMS style for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @returns The WMS style name, or undefined.
 */
export const getStoreLayerWmsStyle = (mapId: string, layerPath: string): string | undefined => {
  return getStoreLayerStateLegendLayerByPath(mapId, layerPath)?.wmsStyle;
};

/**
 * Gets the available WMS styles metadata for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @returns The WMS styles metadata, or undefined.
 */
export const getStoreLayerWmsStyles = (mapId: string, layerPath: string): TypeMetadataWMSCapabilityLayerStyle[] | undefined => {
  return getStoreLayerStateLegendLayerByPath(mapId, layerPath)?.wmsStyles;
};

/**
 * Gets the mosaic rule for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @returns The mosaic rule, or undefined.
 */
export const getStoreLayerMosaicRule = (mapId: string, layerPath: string): TypeMosaicRule | undefined => {
  return getStoreLayerStateLegendLayerByPath(mapId, layerPath)?.mosaicRule;
};

/**
 * Gets the raster function for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @returns The raster function name, or undefined.
 */
export const getStoreLayerRasterFunction = (mapId: string, layerPath: string): string | undefined => {
  return getStoreLayerStateLegendLayerByPath(mapId, layerPath)?.rasterFunction;
};

/**
 * Gets the raster function infos for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @returns The raster function infos, or undefined.
 */
export const getStoreLayerRasterFunctionInfos = (mapId: string, layerPath: string): TypeMetadataEsriRasterFunctionInfos[] | undefined => {
  return getStoreLayerStateLegendLayerByPath(mapId, layerPath)?.rasterFunctionInfos;
};

/**
 * Gets the allowed mosaic methods for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @returns The allowed mosaic methods, or undefined.
 */
export const getStoreLayerAllowedMosaicMethods = (mapId: string, layerPath: string): TypeMosaicMethod[] | undefined => {
  return getStoreLayerStateLegendLayerByPath(mapId, layerPath)?.allowedMosaicMethods;
};

/**
 * Gets the time dimension for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @returns The time dimension, or undefined.
 */
export const getStoreLayerTimeDimension = (mapId: string, layerPath: string): TimeDimension | undefined => {
  return getStoreLayerStateLegendLayerByPath(mapId, layerPath)?.timeDimension;
};

/**
 * Gets the available style settings for a layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path.
 * @returns Array of available style setting types.
 */
export const getStoreLayerStyleSettings = (mapId: string, layerPath: string): string[] => {
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
  const { wmsStyles } = layer;
  if (wmsStyles && wmsStyles.length > 1) {
    settings.push('wmsStyles');
  }

  // Add other layer types with settings here
  return settings;
};

// #endregion STATE SELECTORS

// #region STATE ADAPTORS
// GV These methods should be called from a State Adaptor class listening on domain events triggered by controllers.

/**
 * Sets the layers panel display state in the store.
 *
 * @param mapId - The map identifier.
 * @param displayState - The display state to set.
 */
export const setStoreLayerDisplayState = (mapId: string, displayState: TypeLayersViewDisplayState): void => {
  getStoreLayerState(mapId).actions.setDisplayState(displayState);
};

/**
 * Sets the status for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to update.
 * @param layerStatus - The new layer status.
 */
export const setStoreLayerStatus = (mapId: string, layerPath: string, layerStatus: TypeLayerStatus): void => {
  // Find the layer for the given layer path
  const layers = getStoreLayerStateLegendLayers(mapId);
  const layer = utilLegendLayerByPathRec(layers, layerPath);

  if (layer) {
    // Update the value
    layer.layerStatus = layerStatus;

    // Set updated legend layers
    getStoreLayerState(mapId).actions.setLegendLayers(layers);
  }
};

/**
 * Sets the layer name of the layer and its children in the store.
 * @param mapId - The ID of the map.
 * @param layerPath - The layer path of the layer to change.
 * @param layerName - The layer name to set.
 * @static
 */
export const setStoreLayerName = (mapId: string, layerPath: string, layerName: string | undefined): void => {
  // Find the layer for the given layer path
  const layers = getStoreLayerStateLegendLayers(mapId);
  const layer = utilLegendLayerByPathRec(layers, layerPath);

  if (layer) {
    // Update the value
    layer.layerName = layerName ?? ''; // Default to empty string if undefined

    // Set updated legend layers
    getStoreLayerState(mapId).actions.setLegendLayers(layers);
  }
};

/**
 * Sets the queryable flag for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to update.
 * @param queryable - Whether the layer should be queryable.
 */
export const setStoreLayerQueryable = (mapId: string, layerPath: string, queryable: boolean): void => {
  // Find the layer for the given layer path
  const layers = getStoreLayerStateLegendLayers(mapId);
  const layer = utilLegendLayerByPathRec(layers, layerPath);

  if (layer) {
    // Update the value
    layer.queryable = queryable;

    // Set updated legend layers
    getStoreLayerState(mapId).actions.setLegendLayers(layers);
  }
};

/**
 * Sets the hoverable flag for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to update.
 * @param hoverable - Whether the layer should be hoverable.
 */
export const setStoreLayerHoverable = (mapId: string, layerPath: string, hoverable: boolean): void => {
  // Find the layer for the given layer path
  const layers = getStoreLayerStateLegendLayers(mapId);
  const layer = utilLegendLayerByPathRec(layers, layerPath);

  if (layer) {
    // Update the value
    layer.hoverable = hoverable;

    // Set updated legend layers
    getStoreLayerState(mapId).actions.setLegendLayers(layers);
  }
};

/**
 * Sets the bounds for a specific layer in the store.
 *
 * Also computes and stores the EPSG:4326 projected bounds.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to update.
 * @param bounds - The new bounds extent, or undefined to clear.
 * @param mapProjection - The current map projection.
 * @param stops - The number of interpolation stops for reprojection.
 */
export const setStoreLayerBounds = (
  mapId: string,
  layerPath: string,
  bounds: Extent | undefined,
  mapProjection: OLProjection,
  stops: number
): void => {
  // Find the layer for the given layer path
  const layers = getStoreLayerStateLegendLayers(mapId);
  const layer = utilLegendLayerByPathRec(layers, layerPath);

  if (layer) {
    // Update the value
    layer.bounds = bounds;
    layer.bounds4326 = undefined;

    if (bounds) {
      layer.bounds4326 = Projection.transformExtentFromProj(bounds, mapProjection, Projection.getProjectionLonLat(), stops);
    }

    // Set updated legend layers
    getStoreLayerState(mapId).actions.setLegendLayers(layers);
  }
};

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
export const setStoreLayerBoundsForLayerAndParents = async (
  mapId: string,
  gvLayer: AbstractBaseGVLayer,
  mapProjection: OLProjection,
  stops: number
): Promise<void> => {
  // Walk current layer + parents upward once
  let current: AbstractBaseGVLayer | undefined = gvLayer;
  while (current) {
    // Get the bounds of the layer
    // Must await sequentially: parent bounds depend on child bounds
    // eslint-disable-next-line no-await-in-loop
    const bounds = await current.getBounds(mapProjection, stops);

    // Store it
    setStoreLayerBounds(mapId, current.getLayerPath(), bounds, mapProjection, stops);

    // Advance to parent
    current = current.getParent();
  }
};

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
export const setStoreLayerBoundsForLayerAndParentsAndForget = (
  mapId: string,
  gvLayer: AbstractBaseGVLayer,
  mapProjection: OLProjection,
  stops: number
): void => {
  // Redirect and forget about it
  const promise = setStoreLayerBoundsForLayerAndParents(mapId, gvLayer, mapProjection, stops);
  promise.catch((error: unknown) => {
    // Log the error
    logger.logPromiseFailed('in layer-state.setStoreLayerBoundsForLayerAndParentsAndForget', error);
  });
};

/**
 * Sets the visibility of a specific legend item and updates the class filter.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path containing the item.
 * @param item - The legend item to update (mutated in place).
 * @param visibility - The new visibility state.
 * @param classFilter - Optional class filter string to apply.
 */
export const setStoreLayerItemVisibility = (
  mapId: string,
  layerPath: string,
  item: TypeLegendItem,
  visibility: boolean,
  classFilter: string | undefined
): void => {
  // Find the layer for the given layer path
  const layers = getStoreLayerStateLegendLayers(mapId);
  const layer = utilLegendLayerByPathRec(layers, layerPath);

  // If found
  if (layer) {
    // ! Change the visibility of the given item.
    // ! which happens to be the same object reference as the one in the items array here
    // TODO: REFACTOR - Rethink this pattern to find a better cohesive solution for ALL 'set' that go in the store and change them all
    // Update the value
    // eslint-disable-next-line no-param-reassign
    item.isVisible = visibility;

    // Shadow-copy this specific array so that the hooks are triggered for this items array and this one only
    layer.items = [...layer.items];
    layer.layerFilterClass = classFilter;
  }

  // Set updated legend layers
  getStoreLayerState(mapId).actions.setLegendLayers(layers);
};

/**
 * Recursively sets the opacity and opacityMaxFromParent of all children of the given layer.
 *
 * @param layer - The layer on which to update the children opacity values.
 * @param opacity - The opacity to set.
 */
const setStoreOpacityRec = (layer: TypeLegendLayer, opacity: number): void => {
  // Set the opacity along with all the children
  layer.children?.forEach((child) => {
    // eslint-disable-next-line no-param-reassign
    child.opacity = opacity;
    // eslint-disable-next-line no-param-reassign
    child.opacityMaxFromParent = opacity;
    // Go recursive
    setStoreOpacityRec(child, opacity);
  });
};

/**
 * Sets the opacity for a specific layer and propagates it to children.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to update.
 * @param opacity - The opacity value (0–1).
 */
export const setStoreOpacity = (mapId: string, layerPath: string, opacity: number): void => {
  // Find the layer for the given layer path
  const layers = getStoreLayerStateLegendLayers(mapId);
  const layer = utilLegendLayerByPathRec(layers, layerPath);

  if (layer) {
    // Update the value
    layer.opacity = opacity;

    // Go recursive
    setStoreOpacityRec(layer, opacity);
  }

  // Set updated legend layers
  getStoreLayerState(mapId).actions.setLegendLayers(layers);
};

/**
 * Sets the highlighted layer path in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to highlight.
 */
export const setStoreHighlightedLayer = (mapId: string, layerPath: string): void => {
  // Set in store
  getStoreLayerState(mapId).actions.setHighlightLayer(layerPath);
};

/**
 * Sets the display date format for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to update.
 * @param displayDateFormat - The display date format to set.
 */
export const setStoreLayerDisplayDateFormat = (mapId: string, layerPath: string, displayDateFormat: TypeDisplayDateFormat): void => {
  // Find the layer for the given layer path
  const layers = getStoreLayerStateLegendLayers(mapId);
  const layer = utilLegendLayerByPathRec(layers, layerPath);

  if (layer) {
    // Update the value
    layer.displayDateFormat = displayDateFormat;

    // Set updated legend layers
    getStoreLayerState(mapId).actions.setLegendLayers(layers);
  }
};

/**
 * Sets the short display date format for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to update.
 * @param displayDateFormat - The short display date format to set.
 */
export const setStoreLayerDisplayDateFormatShort = (mapId: string, layerPath: string, displayDateFormat: TypeDisplayDateFormat): void => {
  // Find the layer for the given layer path
  const layers = getStoreLayerStateLegendLayers(mapId);
  const layer = utilLegendLayerByPathRec(layers, layerPath);

  if (layer) {
    // Update the value
    layer.displayDateFormatShort = displayDateFormat;

    // Set updated legend layers
    getStoreLayerState(mapId).actions.setLegendLayers(layers);
  }
};

/**
 * Sets the date temporal mode for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to update.
 * @param temporalMode - The temporal mode to set.
 */
export const setStoreLayerDateTemporal = (mapId: string, layerPath: string, temporalMode: TemporalMode): void => {
  // Find the layer for the given layer path
  const layers = getStoreLayerStateLegendLayers(mapId);
  const layer = utilLegendLayerByPathRec(layers, layerPath);

  if (layer) {
    // Update the value
    layer.dateTemporalMode = temporalMode;

    // Set updated legend layers
    getStoreLayerState(mapId).actions.setLegendLayers(layers);
  }
};

/**
 * Sets the mosaic rule for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to update.
 * @param mosaicRule - The mosaic rule to set, or undefined to clear.
 */
export const setStoreLayerMosaicRule = (mapId: string, layerPath: string, mosaicRule: TypeMosaicRule | undefined): void => {
  // Find the layer for the given layer path
  const layers = getStoreLayerStateLegendLayers(mapId);
  const layer = utilLegendLayerByPathRec(layers, layerPath);

  if (layer) {
    // Update the value
    layer.mosaicRule = mosaicRule;

    // Set updated legend layers
    getStoreLayerState(mapId).actions.setLegendLayers(layers);
  }
};

/**
 * Sets the raster function for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to update.
 * @param rasterFunctionId - The raster function id to set, or undefined to clear.
 */
export const setStoreLayerRasterFunction = (mapId: string, layerPath: string, rasterFunctionId: string | undefined): void => {
  // Find the layer for the given layer path
  const layers = getStoreLayerStateLegendLayers(mapId);
  const layer = utilLegendLayerByPathRec(layers, layerPath);

  if (layer) {
    // Update the value
    layer.rasterFunction = rasterFunctionId;

    // Set updated legend layers
    getStoreLayerState(mapId).actions.setLegendLayers(layers);
  }
};

/**
 * Sets the WMS style for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to update.
 * @param wmsStyleName - The WMS style name to set, or undefined to clear.
 */
export const setStoreLayerWmsStyle = (mapId: string, layerPath: string, wmsStyleName: string | undefined): void => {
  // Find the layer for the given layer path
  const layers = getStoreLayerStateLegendLayers(mapId);
  const layer = utilLegendLayerByPathRec(layers, layerPath);

  if (layer) {
    // Update the value
    layer.wmsStyle = wmsStyleName;

    // Set updated legend layers
    getStoreLayerState(mapId).actions.setLegendLayers(layers);
  }
};

/**
 * Sets the Text Visibility for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to update.
 * @param textVisible - Whether the text is visible.
 */
export const setStoreLayerTextVisibility = (mapId: string, layerPath: string, textVisible: boolean): void => {
  // Find the layer for the given layer path
  const layers = getStoreLayerStateLegendLayers(mapId);
  const layer = utilLegendLayerByPathRec(layers, layerPath);

  if (layer) {
    // Update the value
    layer.textVisible = textVisible;

    // Set updated legend layers
    getStoreLayerState(mapId).actions.setLegendLayers(layers);
  }
};

/**
 * Sets the selected layer path in the layers tab.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to select.
 */
export const setStoreLayerSelectedLayersTabLayer = (mapId: string, layerPath: string): void => {
  // Save in store
  getStoreLayerState(mapId).actions.setSelectedLayerPath(layerPath);
};

/**
 * Reorders the legend layers based on the map's ordered layer info.
 *
 * @param mapId - The map identifier.
 */
export const setStoreReorderLegendLayers = (mapId: string): void => {
  // Sort the layers
  const sortedLayers = getStoreLayerStateLegendLayers(mapId).sort(
    (a, b) => getStoreMapOrderedLayerIndexByPath(mapId, a.layerPath) - getStoreMapOrderedLayerIndexByPath(mapId, b.layerPath)
  );

  // Save in store
  getStoreLayerState(mapId).actions.setLegendLayers(sortedLayers);
};

/**
 * Sets whether layers are currently loading in the store.
 *
 * @param mapId - The map identifier.
 * @param areLoading - Whether layers are loading.
 */
export const setStoreLayersAreLoading = (mapId: string, areLoading: boolean): void => {
  // Update the store
  getStoreLayerState(mapId).actions.setLayersAreLoading(areLoading);
};

/**
 * Sets the legend query status and optional legend data for a specific layer.
 *
 * Updates the layer's icon images and legend items when legend data with a type is provided.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to update.
 * @param legendQueryStatus - The new legend query status.
 * @param data - Optional legend data containing the layer type, legend styles, and style config.
 */
export const setStoreLegendQueryStatus = (
  mapId: string,
  layerPath: string,
  legendQueryStatus: LegendQueryStatus,
  data: TypeLegend | undefined
): void => {
  // Find the layer for the given layer path
  const layers = getStoreLayerStateLegendLayers(mapId);
  const layer = utilLegendLayerByPathRec(layers, layerPath);

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
    getStoreLayerState(mapId).actions.setLegendLayers(layers);
  }
};

/**
 * Recursively removes a layer from the legend layers array and its children.
 *
 * @param mapId - The map identifier.
 * @param legendLayers - The legend layers array to search and modify.
 * @param layerPath - The layer path to remove.
 */
const deleteStoreLayersFromLegendLayersAndChildren = (mapId: string, legendLayers: TypeLegendLayer[], layerPath: string): void => {
  // Find index of layer and remove it
  const layersIndexToDelete = legendLayers.findIndex((l) => l.layerPath === layerPath);
  if (layersIndexToDelete >= 0) {
    legendLayers.splice(layersIndexToDelete, 1);
  } else {
    // Check for layer to remove in children
    legendLayers.forEach((layer) => {
      if (layer.children && layer.children.length > 0) {
        deleteStoreLayersFromLegendLayersAndChildren(mapId, layer.children, layerPath);
      }
    });
  }
};

/**
 * Deletes a layer from the legend layers in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to remove.
 */
export const deleteStoreLayerFromLegendLayers = (mapId: string, layerPath: string): void => {
  // Get legend layers to pass to recursive function
  const curLayers = getStoreLayerStateLegendLayers(mapId);

  // Remove layer and children
  deleteStoreLayersFromLegendLayersAndChildren(mapId, curLayers, layerPath);

  // Set updated legend layers after delete
  getStoreLayerState(mapId).actions.setLegendLayers(curLayers);
};

/**
 * Sets the deletion start time for a layer in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to update.
 * @param startTime - The deletion start timestamp, or undefined to clear.
 */
export const setStoreLayerDeletionStartTime = (mapId: string, layerPath: string, startTime: number | undefined): void => {
  // Update the store with the start time of the deletion of the layer
  getStoreLayerState(mapId).actions.setLayerDeletionStartTime(layerPath, startTime);
};

/**
 * Temporary method to set the legend layers directly in the store, used for the moment to set the
 * legend layers with the data from the query result of the legend.
 * This method should be used with caution and only in specific cases, as it bypasses the usual
 * state update patterns and may lead to unintended side effects if not used properly.
 *
 * @param mapId
 * @param legendLayers
 */
export const setStoreLegendLayersDirectly = (mapId: string, legendLayers: TypeLegendLayer[]): void => {
  // Set updated legend layers
  getStoreLayerState(mapId).actions.setLegendLayers(legendLayers);
};

// #endregion STATE ADAPTORS

/**
 * Represents legend result info for a layer including status and legend data.
 */
export type TypeLegendResultInfo = {
  /** The current status of the layer. */
  layerStatus: TypeLayerStatus;

  /** The current legend query status. */
  legendQueryStatus: LegendQueryStatus;

  /** The legend data, or undefined if not yet loaded. */
  data: TypeLegend | undefined;
};

/** The possible states of a legend query. */
export type LegendQueryStatus = 'init' | 'querying' | 'queried' | 'error';

/**
 * Represents the legend data for a layer.
 */
export type TypeLegend = {
  /** The GeoView layer type this legend belongs to. */
  type: TypeGeoviewLayerType;

  /** The legend content — vector styles, an HTML canvas, or null. */
  // Layers other than vector layers use the HTMLCanvasElement type for their legend.
  legend: TypeVectorLayerStyles | HTMLCanvasElement | null;

  /** Optional style configuration associated with the legend. */
  styleConfig?: TypeLayerStyleConfig;
};

/** A legend result set entry combining result set metadata with legend result info. */
export type TypeLegendResultSetEntry = TypeResultSetEntry & TypeLegendResultInfo;

/** A full result set of legend entries for all layers. */
export type TypeLegendResultSet = TypeResultSet<TypeLegendResultSetEntry>;
