import { useStore } from 'zustand';

import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';

import { getGeoViewStore, useGeoViewStore } from '@/core/stores/stores-managers';
import type { TypeLayersViewDisplayState, TypeLegendItem, TypeLegendLayer } from '@/core/components/layers/types';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import type { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import { useStableSelector } from '@/core/stores/geoview-store';
import type { TypeLayerStyleConfig, TypeResultSet, TypeResultSetEntry } from '@/api/types/map-schema-types';
import type { TemporalMode, TimeDimension, TimeIANA, TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import { DateMgt } from '@/core/utils/date-mgt';
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
    updateLayerByPath: (layerPath: string, updater: (layer: TypeLegendLayer) => TypeLegendLayer) => void;
  };
}

// #endregion INTERFACE DEFINITION

// #region UTIL FUNCTIONS (PRIVATE)

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

/**
 * Immutably updates a layer in the legend layer tree by its path.
 *
 * Creates new object references along the path to the target layer,
 * leaving all other branches untouched. This ensures Zustand detects
 * the change and hooks re-render correctly.
 *
 * @param layers - The legend layers array to search.
 * @param layerPath - The layer path of the layer to update.
 * @param updater - A function that receives the current layer and returns the updated layer.
 * @returns A new legend layers array with the target layer updated.
 */
const utilUpdateLayerByPath = (
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
        children: utilUpdateLayerByPath(layer.children, layerPath, updater),
      };
    }

    return layer;
  });
};

/**
 * Recursively removes a layer from the legend layers array by producing new arrays.
 *
 * @param legendLayers - The legend layers array to search.
 * @param layerPath - The layer path to remove.
 * @returns A new legend layers array with the target layer removed.
 */
const utilDeleteLayerFromLegendLayers = (legendLayers: TypeLegendLayer[], layerPath: string): TypeLegendLayer[] => {
  return legendLayers
    .filter((layer) => layer.layerPath !== layerPath)
    .map((layer) => {
      if (layer.children?.length) {
        return { ...layer, children: utilDeleteLayerFromLegendLayers(layer.children, layerPath) };
      }
      return layer;
    });
};

/**
 * Recursively checks whether all children of a layer are visible.
 *
 * @param layer - The legend layer to check
 * @param visibleLayers - The set of currently visible layer paths
 * @returns True if every descendant layer path is in visibleLayers
 */
const utilAllChildrenVisible = (layer: TypeLegendLayer, visibleLayers: string[]): boolean => {
  return layer.children.every(
    (child) => visibleLayers.includes(child.layerPath) && (!child.children?.length || utilAllChildrenVisible(child, visibleLayers))
  );
};

/**
 * Checks whether any layer in the subtree has visibility disabled in its controls.
 *
 * @param layer - The root layer to start the check from
 * @returns True if any node in the subtree has controls.visibility === false
 */
const utilHasDisabledVisibilityRec = (layer: TypeLegendLayer): boolean => {
  if (layer.controls?.visibility === false) return true;
  if (layer.children?.length > 0) {
    return layer.children.some((child) => utilHasDisabledVisibilityRec(child));
  }
  return false;
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

// #endregion UTIL FUNCTIONS (PRIVATE)

// #region STATE INITIALIZATION

/**
 * Initializes a Layer State and provide functions which use the get/set Zustand mechanisms.
 *
 * @param set - The setter callback to be used by this state
 * @param get - The getter callback to be used by this state
 * @returns The initialized Layer State
 */
export function initializeLayerState(set: TypeSetStore, get: TypeGetStore): ILayerState {
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
       * Callers must pass a new array reference (e.g. from map/filter/sort).
       * Single-layer updates should use updateLayerByPath instead.
       *
       * @param legendLayers - The legend layers to set.
       */
      setLegendLayers: (legendLayers: TypeLegendLayer[]): void => {
        set({
          layerState: {
            ...get().layerState,
            legendLayers,
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
        set({
          layerState: {
            ...get().layerState,
            selectedLayerPath: theLayerPath,
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
       * Sets the deletion start time for the layer identified by the given layer path.
       *
       * @param layerPath - The unique path or identifier of the layer to update
       * @param startTime - The deletion start time timestamp, or undefined to remove it
       */
      setLayerDeletionStartTime: (layerPath: string, startTime: number | undefined): void => {
        set((state) => {
          // Create updated legendLayers immutably
          const updatedLegendLayers = utilUpdateLayerByPath(state.layerState.legendLayers, layerPath, (layer) => {
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

      /**
       * Immutably updates a single layer identified by its path.
       *
       * @param layerPath - The layer path to find and update
       * @param updater - A function that receives the current layer and returns the updated layer
       */
      updateLayerByPath: (layerPath: string, updater: (layer: TypeLegendLayer) => TypeLegendLayer): void => {
        set((state) => ({
          layerState: {
            ...state.layerState,
            legendLayers: utilUpdateLayerByPath(state.layerState.legendLayers, layerPath, updater),
          },
        }));
      },
    },
  } as ILayerState;
}

// #endregion STATE INITIALIZATION

// #region STATE GETTERS & HOOKS
// GV Getters should be used to get the values at a moment in time.
// GV Hooks should be used to attach to values and trigger UI components when they change.
// GV Typically they are listed in couples (getter + hook) for the same value.

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
 * Gets the full legend layers array for the given map.
 *
 * GV This getter shouldn't have a hook equivalent, favor precise hooks for specific properties instead to
 * GV avoid unnecessary re-renders of the full layers tree when any single layer property changes.
 * GV See examples below for how to create these precise hooks using the createLayerSelectorHook factory.
 *
 * @param mapId - The map identifier.
 * @returns The legend layers array.
 */
export const getStoreLayerLegendLayers = (mapId: string): TypeLegendLayer[] => {
  return getStoreLayerState(mapId).legendLayers;
};

// Don't do this, see note in the getter above.
// export const useStoreLayerStateLegendLayers = ...

/**
 * Gets the layer paths for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The layer paths array.
 */
export const getStoreLayerLayerPaths = (mapId: string): string[] => {
  return getStoreLayerState(mapId).legendLayers.map((layer) => layer.layerPath);
};

/** Hook that returns only the top-level layer paths. Re-renders only when layers are added, removed, or reordered. */
export const useStoreLayerLayerPaths = (): string[] =>
  useStableSelector(useGeoViewStore(), (state) => state.layerState.legendLayers.map((layer) => layer.layerPath));

/**
 * Gets the selected layer path for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The selected layer path, or undefined if none is selected.
 */
export const getStoreLayerSelectedLayerPath = (mapId: string): string | undefined => {
  return getStoreLayerState(mapId).selectedLayerPath;
};

/** Hook that returns the selected layer path. */
export const useStoreLayerSelectedLayerPath = (): string | null | undefined =>
  useStore(useGeoViewStore(), (state) => state.layerState.selectedLayerPath);

/** Hook that returns the layer name of the currently selected layer. Primitive string so Object.is prevents spurious re-renders. */
export const useStoreLayerSelectedLayerName = (): string | undefined =>
  useStore(
    useGeoViewStore(),
    (state) => utilLegendLayerByPathRec(state.layerState.legendLayers, state.layerState.selectedLayerPath)?.layerName
  );

/**
 * Gets the highlighted layer path for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The highlighted layer path.
 */
export const getStoreLayerHighlightedLayer = (mapId: string): string => {
  return getStoreLayerState(mapId).highlightedLayer;
};

/** Hook that returns the highlighted layer path. */
export const useStoreLayerHighlightedLayer = (): string => useStore(useGeoViewStore(), (state) => state.layerState.highlightedLayer);

/**
 * Gets the layers panel display state for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The display state.
 */
export const getStoreLayerDisplayState = (mapId: string): TypeLayersViewDisplayState => {
  return getStoreLayerState(mapId).displayState;
};

/** Hook that returns the current layers panel display state. */
export const useStoreLayerDisplayState = (): TypeLayersViewDisplayState =>
  useStore(useGeoViewStore(), (state) => state.layerState.displayState);

/**
 * Gets whether layers are currently loading for the given map.
 *
 * @param mapId - The map identifier.
 * @returns True if layers are loading.
 */
export const getStoreLayerAreLayersLoading = (mapId: string): boolean => {
  return getStoreLayerState(mapId).layersAreLoading;
};

/** Hook that returns whether layers are currently loading. */
export const useStoreLayerAreLayersLoading = (): boolean => useStore(useGeoViewStore(), (state) => state.layerState.layersAreLoading);

/**
 * Gets a specific legend layer by its path for the given map.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @returns The matching legend layer, or undefined if not found.
 */
export const getStoreLayerLegendLayerByPath = (mapId: string, layerPath: string): TypeLegendLayer | undefined => {
  return utilLegendLayerByPathRec(getStoreLayerLegendLayers(mapId), layerPath);
};

/**
 * Gets the selected layer path for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The selected layer path, or undefined if none is selected.
 */
export const getStoreLayerId = (mapId: string, layerPath: string): string | undefined => {
  return getStoreLayerLegendLayerByPath(mapId, layerPath)?.layerId;
};

/** Hook that returns the layer id for a specific layer. */
export const useStoreLayerId = createLayerSelectorHook('layerId');

/**
 * Gets the bounds extent for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @returns The layer bounds extent, or undefined.
 */
export const getStoreLayerBounds = (mapId: string, layerPath: string): Extent | undefined => {
  return getStoreLayerLegendLayerByPath(mapId, layerPath)?.bounds;
};

/** Hook that returns the bounds extent for a specific layer. */
export const useStoreLayerBounds = createLayerSelectorHook('bounds');

/**
 * Gets the layer status for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @returns The layer status, or undefined.
 */
export const getStoreLayerStatus = (mapId: string, layerPath: string): TypeLayerStatus | undefined => {
  return getStoreLayerLegendLayerByPath(mapId, layerPath)?.layerStatus;
};

/** Hook that returns the layer status for a specific layer. */
export const useStoreLayerStatus = createLayerSelectorHook('layerStatus');

/**
 * Hook that returns a record of layer statuses for all layers.
 *
 * @returns A record of layer statuses keyed by layer path, defaulting to 'newInstance'.
 */
export const useStoreLayerStatusSet = (): Record<string, TypeLayerStatus> => {
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

/**
 * Gets the WMS style for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @returns The WMS style name, or undefined.
 */
export const getStoreLayerWmsStyle = (mapId: string, layerPath: string): string | undefined => {
  return getStoreLayerLegendLayerByPath(mapId, layerPath)?.wmsStyle;
};

/** Hook that returns the WMS style for a specific layer. */
export const useStoreLayerWmsStyle = createLayerSelectorHook('wmsStyle');

/**
 * Gets the available WMS styles metadata for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @returns The WMS styles metadata, or undefined.
 */
export const getStoreLayerWmsStyles = (mapId: string, layerPath: string): TypeMetadataWMSCapabilityLayerStyle[] | undefined => {
  return getStoreLayerLegendLayerByPath(mapId, layerPath)?.wmsStyles;
};

/** Hook that returns the available WMS styles metadata for a specific layer. */
export const useStoreLayerWmsStyles = createLayerSelectorHook('wmsStyles');

/**
 * Gets the mosaic rule for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @returns The mosaic rule, or undefined.
 */
export const getStoreLayerMosaicRule = (mapId: string, layerPath: string): TypeMosaicRule | undefined => {
  return getStoreLayerLegendLayerByPath(mapId, layerPath)?.mosaicRule;
};

/** Hook that returns the mosaic rule for a specific layer. */
export const useStoreLayerMosaicRule = createLayerSelectorHook('mosaicRule');

/**
 * Gets the raster function for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @returns The raster function name, or undefined.
 */
export const getStoreLayerRasterFunction = (mapId: string, layerPath: string): string | undefined => {
  return getStoreLayerLegendLayerByPath(mapId, layerPath)?.rasterFunction;
};

/** Hook that returns the raster function for a specific layer. */
export const useStoreLayerRasterFunction = createLayerSelectorHook('rasterFunction');

/**
 * Gets the raster function infos for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @returns The raster function infos, or undefined.
 */
export const getStoreLayerRasterFunctionInfos = (mapId: string, layerPath: string): TypeMetadataEsriRasterFunctionInfos[] | undefined => {
  return getStoreLayerLegendLayerByPath(mapId, layerPath)?.rasterFunctionInfos;
};

/** Hook that returns the raster function infos for a specific layer. */
export const useStoreLayerRasterFunctionInfos = createLayerSelectorHook('rasterFunctionInfos');

/**
 * Gets the allowed mosaic methods for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @returns The allowed mosaic methods, or undefined.
 */
export const getStoreLayerAllowedMosaicMethods = (mapId: string, layerPath: string): TypeMosaicMethod[] | undefined => {
  return getStoreLayerLegendLayerByPath(mapId, layerPath)?.allowedMosaicMethods;
};

/** Hook that returns the allowed mosaic methods for a specific layer. */
export const useStoreLayerAllowedMosaicMethods = createLayerSelectorHook('allowedMosaicMethods');

/**
 * Gets the time dimension for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @returns The time dimension, or undefined.
 */
export const getStoreLayerTimeDimension = (mapId: string, layerPath: string): TimeDimension | undefined => {
  return getStoreLayerLegendLayerByPath(mapId, layerPath)?.timeDimension;
};

/** Hook that returns the time dimension for a specific layer. */
export const useStoreLayerTimeDimension = createLayerSelectorHook('timeDimension');

/**
 * Gets the available style settings for a layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path.
 * @returns Array of available style setting types.
 */
export const getStoreLayerStyleSettings = (mapId: string, layerPath: string): string[] => {
  const layer = getStoreLayerLegendLayerByPath(mapId, layerPath);
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

// #endregion STATE GETTERS & HOOKS

// #region STATE GETTERS & HOOKS - OTHERS (no match between getter-hook)

/**
 * Gets a specific legend item by name for a layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @param name - The legend item name to find.
 * @returns The matching legend item, or undefined.
 */
export const getStoreLayerItemVisibility = (mapId: string, layerPath: string, name: string): TypeLegendItem | undefined => {
  return getStoreLayerLegendLayerByPath(mapId, layerPath)?.items.find((item) => item.name === name);
};

/** Hook that returns the EPSG:4326 bounds for a specific layer. */
export const useStoreLayerBounds4326 = createLayerSelectorHook('bounds4326');

/** Hook that returns whether toggling is allowed for a specific layer. */
export const useStoreLayerCanToggle = createLayerSelectorHook('canToggle');

/**
 * Selects whether all sublayers of a layer are visible.
 *
 * Reads from both layerState (children tree) and mapState (visibleLayers).
 *
 * @param layerPath - The layer path to check
 * @returns True if all children and descendants are visible
 */
export const useStoreLayerAllChildrenVisible = (layerPath: string): boolean => {
  return useStore(useGeoViewStore(), (state): boolean => {
    const layer = utilLegendLayerByPathRec(state.layerState.legendLayers, layerPath);
    if (!layer || !layer.children.length) return true;
    return utilAllChildrenVisible(layer, state.mapState.visibleLayers);
  });
};

/**
 * Selects the child layer paths for a specific layer.
 *
 * Uses useStableSelector with shallowObjectEqual so the component only re-renders
 * when children are added, removed, or reordered — not when a descendant's property changes.
 *
 * @param layerPath - The layer path to look up
 * @returns The child layer paths, or undefined if no children exist
 */
export const useStoreLayerChildPaths = (layerPath: string): string[] | undefined => {
  const result = useStableSelector(useGeoViewStore(), (state): string[] => {
    const layer = utilLegendLayerByPathRec(state.layerState.legendLayers, layerPath);
    return layer?.children?.map((child) => child.layerPath) ?? [];
  });
  return result.length > 0 ? result : undefined;
};

/**
 * Selects whether any layer in the subtree (including the layer itself) has visibility disabled.
 *
 * @param layerPath - The layer path to check
 * @returns True if any node in the subtree has controls.visibility === false
 */
export const useStoreLayerHasDisabledVisibility = (layerPath: string): boolean => {
  return useStore(useGeoViewStore(), (state): boolean => {
    const layer = utilLegendLayerByPathRec(state.layerState.legendLayers, layerPath);
    if (!layer) return false;
    return utilHasDisabledVisibilityRec(layer);
  });
};

/** Hook that returns the controls configuration for a specific layer. */
export const useStoreLayerControls = createLayerSelectorHook('controls');

/** Hook that returns the deletion start time for a specific layer. */
export const useStoreLayerDeletionStartTime = createLayerSelectorHook('deletionStartTime');

/** Hook that returns the entry type for a specific layer. */
export const useStoreLayerEntryType = createLayerSelectorHook('entryType');

/** Hook that returns if the layer has text. */
export const useStoreLayerHasText = createLayerSelectorHook('hasText');

/** Hook that returns the layer filter for a specific layer. */
export const useStoreLayerFilter = createLayerSelectorHook('layerFilter');

/** Hook that returns the layer filter class for a specific layer. */
export const useStoreLayerFilterClass = createLayerSelectorHook('layerFilterClass');

/** Hook that returns the legend query status for a specific layer. */
export const useStoreLayerLegendQueryStatus = createLayerSelectorHook('legendQueryStatus');

/** Hook that returns the legend icons for a specific layer. */
export const useStoreLayerIcons = createLayerSelectorHook('icons');

/** Hook that returns the legend items for a specific layer. */
export const useStoreLayerItems = createLayerSelectorHook('items');

/** Hook that returns the schema tag for a specific layer. */
export const useStoreLayerSchemaTag = createLayerSelectorHook('schemaTag');

/** Hook that returns the style configuration for a specific layer. */
export const useStoreLayerStyleConfig = createLayerSelectorHook('styleConfig');

/** Hook that returns the text visibility for a specific layer. */
export const useStoreLayerTextVisibility = createLayerSelectorHook('textVisible');

/** Hook that returns the layer attribution for a specific layer. */
export const useStoreLayerAttribution = createLayerSelectorHook('layerAttribution');

/** Hook that returns the layer opacity for a specific layer. */
export const useStoreLayerOpacity = createLayerSelectorHook('opacity');

/** Hook that returns the max opacity inherited from parent for a specific layer. */
export const useStoreLayerOpacityMaxFromParent = createLayerSelectorHook('opacityMaxFromParent');

/** Hook that returns the hoverable flag for a specific layer. */
export const useStoreLayerHoverable = createLayerSelectorHook('hoverable');

/** Hook that returns the queryable flag for a specific layer. */
export const useStoreLayerQueryable = createLayerSelectorHook('queryable');

/** Hook that returns the URL for a specific layer. */
export const useStoreLayerUrl = createLayerSelectorHook('url');

// #endregion STATE GETTERS & HOOKS - OTHERS (no match between getter-hook)

// #region STATE GETTERS & HOOKS - SPECIALIZED

/** Hook that returns the layer name for a specific layer. */
export const useStoreLayerName = createLayerSelectorHook('layerName');

/**
 * Hook that returns a record of layer names for all layers.
 *
 * @returns A record of layer names keyed by layer path.
 */
export const useStoreLayerNameSet = (): Record<string, string> => {
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

/**
 * Hook that returns the icon set (image URLs) for a specific layer.
 *
 * For WMS layers, returns canvas icon images; for other types, returns item icons.
 *
 * @param layerPath - The layer path to get icons for.
 * @returns An array of icon image strings.
 */
export const useStoreLayerIconLayerSet = (layerPath: string): string[] => {
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
 * React hook that returns if the temporal mode of the dates for the layer.
 *
 * @param layerPath - Unique path identifying the layer in the legend state.
 * @returns The temporal mode of the dates for the layer. Default: DateMgt.DEFAULT_TEMPORAL_MODE.
 */
export const useStoreLayerDateTemporalMode = (layerPath: string | undefined): TemporalMode => {
  // Hook
  return useStore(useGeoViewStore(), (state) => {
    return utilLegendLayerByPathRec(state.layerState.legendLayers, layerPath)?.dateTemporalMode ?? DateMgt.DEFAULT_TEMPORAL_MODE;
  });
};

/**
 * React hook that returns if the temporal modes for the layers.
 *
 * @returns The temporal mode of the dates for the layer.
 */
export const useStoreLayerDateTemporalModeSet = (): Record<string, TemporalMode> => {
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
 * Gets the display date format for a specific layer.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to look up.
 * @returns The display date format, or undefined.
 */
export const getStoreLayerDisplayDateFormat = (mapId: string, layerPath: string): TypeDisplayDateFormat | undefined => {
  return getStoreLayerLegendLayerByPath(mapId, layerPath)?.displayDateFormat;
};

/**
 * React hook that returns the display date format for a specific layer.
 *
 * The hook first attempts to resolve a layer-specific display date format
 * using the provided layer path. If the layer does not define its own
 * display date format (or cannot be found), the application-wide display
 * date format for the current map is returned as a fallback.
 *
 * @param layerPath - Unique path identifying the layer in the legend state.
 * @returns The display date format to use for the layer, falling back to the
 * application's default display date format when none is defined.
 */
export const useStoreLayerDisplayDateFormat = (layerPath: string | undefined): TypeDisplayDateFormat => {
  // Hook
  return useStore(useGeoViewStore(), (state) => {
    return (
      utilLegendLayerByPathRec(state.layerState.legendLayers, layerPath)?.displayDateFormat ??
      getStoreDisplayDateFormatDefault(state.mapId).datetimeFormat
    );
  });
};

/**
 * React hook that returns if the display date formats for the layers.
 *
 * @returns The display date format of the dates for the layer.
 */
export const useStoreLayerDisplayDateFormatSet = (): Record<string, TypeDisplayDateFormat> => {
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
 *
 * The hook first attempts to resolve a layer-specific display date format
 * using the provided layer path. If the layer does not define its own
 * display date format (or cannot be found), the application-wide display
 * date format for the current map is returned as a fallback.
 *
 * @param layerPath - Unique path identifying the layer in the legend state.
 * @returns The display date format to use for the layer, falling back to the
 * application's default display date format when none is defined.
 */
export const useStoreLayerDisplayDateFormatShort = (layerPath: string | undefined): TypeDisplayDateFormat => {
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
 * React hook that returns the display date timezone for a specific layer.
 *
 * The hook first attempts to resolve a layer-specific display date timezone
 * using the provided layer path. If the layer does not define its own
 * display date timezone (or cannot be found), the application-wide display
 * date timezone for the current map is returned as a fallback.
 *
 * @param layerPath - Unique path identifying the layer in the legend state.
 * @returns The display date timezone to use for the layer, falling back to the
 * application's default display date timezone when none is defined.
 */
export const useStoreLayerDisplayDateTimezone = (layerPath: string | undefined): TimeIANA => {
  // Hook
  return useStore(useGeoViewStore(), (state) => {
    return (
      utilLegendLayerByPathRec(state.layerState.legendLayers, layerPath)?.displayDateTimezone ?? getStoreDisplayDateTimezone(state.mapId)
    );
  });
};

/**
 * React hook that returns if the display date timezones for the layers.
 *
 * @returns The display date timezone of the dates for the layer.
 */
export const useStoreLayerDisplayDateTimezoneSet = (): Record<string, TimeIANA> => {
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
 * Hook that returns the available style settings for a layer.
 *
 * @param layerPath - The layer path to get settings for.
 * @returns Array of available style setting types.
 */
export const useStoreLayerStyleSettings = (layerPath: string): string[] => {
  return useStableSelector(useGeoViewStore(), (state) => {
    const layer = utilLegendLayerByPathRec(state.layerState.legendLayers, layerPath);
    if (!layer) return [];

    const settings: string[] = [];

    if (layer.rasterFunctionInfos && layer.rasterFunctionInfos.length > 0) {
      settings.push('rasterFunction');
    }

    const { mosaicRule } = layer;
    if (mosaicRule) {
      settings.push('mosaicRule');
    }

    const { wmsStyles } = layer;
    if (wmsStyles && wmsStyles.length > 1) {
      settings.push('wmsStyles');
    }

    return settings;
  });
};

// #endregion STATE GETTERS & HOOKS - SPECIALIZED

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
  getStoreLayerState(mapId).actions.updateLayerByPath(layerPath, (layer) => ({ ...layer, layerStatus }));
};

/**
 * Sets the layer name of the layer and its children in the store.
 * @param mapId - The ID of the map.
 * @param layerPath - The layer path of the layer to change.
 * @param layerName - The layer name to set.
 */
export const setStoreLayerName = (mapId: string, layerPath: string, layerName: string | undefined): void => {
  getStoreLayerState(mapId).actions.updateLayerByPath(layerPath, (layer) => ({ ...layer, layerName: layerName ?? '' }));
};

/**
 * Sets the queryable flag for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to update.
 * @param queryable - Whether the layer should be queryable.
 */
export const setStoreLayerQueryable = (mapId: string, layerPath: string, queryable: boolean): void => {
  getStoreLayerState(mapId).actions.updateLayerByPath(layerPath, (layer) => ({ ...layer, queryable }));
};

/**
 * Sets the hoverable flag for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to update.
 * @param hoverable - Whether the layer should be hoverable.
 */
export const setStoreLayerHoverable = (mapId: string, layerPath: string, hoverable: boolean): void => {
  getStoreLayerState(mapId).actions.updateLayerByPath(layerPath, (layer) => ({ ...layer, hoverable }));
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
  getStoreLayerState(mapId).actions.updateLayerByPath(layerPath, (layer) => ({
    ...layer,
    bounds,
    bounds4326: bounds ? Projection.transformExtentFromProj(bounds, mapProjection, Projection.getProjectionLonLat(), stops) : undefined,
  }));
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
  getStoreLayerState(mapId).actions.updateLayerByPath(layerPath, (layer) => ({
    ...layer,
    items: layer.items.map((i) => (i.name === item.name ? { ...i, isVisible: visibility } : i)),
    layerFilterClass: classFilter,
  }));
};

/**
 * Recursively creates new children with updated opacity and opacityMaxFromParent values.
 *
 * @param children - The children array to update.
 * @param opacity - The opacity to set.
 * @returns A new children array with updated opacity values.
 */
const utilSetOpacityRec = (children: TypeLegendLayer[], opacity: number): TypeLegendLayer[] => {
  return children.map((child) => ({
    ...child,
    opacity,
    opacityMaxFromParent: opacity,
    ...(child.children?.length ? { children: utilSetOpacityRec(child.children, opacity) } : {}),
  }));
};

/**
 * Sets the opacity for a specific layer and propagates it to children.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to update.
 * @param opacity - The opacity value (0–1).
 */
export const setStoreOpacity = (mapId: string, layerPath: string, opacity: number): void => {
  getStoreLayerState(mapId).actions.updateLayerByPath(layerPath, (layer) => ({
    ...layer,
    opacity,
    ...(layer.children?.length ? { children: utilSetOpacityRec(layer.children, opacity) } : {}),
  }));
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
  getStoreLayerState(mapId).actions.updateLayerByPath(layerPath, (layer) => ({ ...layer, displayDateFormat }));
};

/**
 * Sets the short display date format for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to update.
 * @param displayDateFormat - The short display date format to set.
 */
export const setStoreLayerDisplayDateFormatShort = (mapId: string, layerPath: string, displayDateFormat: TypeDisplayDateFormat): void => {
  getStoreLayerState(mapId).actions.updateLayerByPath(layerPath, (layer) => ({ ...layer, displayDateFormatShort: displayDateFormat }));
};

/**
 * Sets the date temporal mode for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to update.
 * @param temporalMode - The temporal mode to set.
 */
export const setStoreLayerDateTemporal = (mapId: string, layerPath: string, temporalMode: TemporalMode): void => {
  getStoreLayerState(mapId).actions.updateLayerByPath(layerPath, (layer) => ({ ...layer, dateTemporalMode: temporalMode }));
};

/**
 * Sets the mosaic rule for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to update.
 * @param mosaicRule - The mosaic rule to set, or undefined to clear.
 */
export const setStoreLayerMosaicRule = (mapId: string, layerPath: string, mosaicRule: TypeMosaicRule | undefined): void => {
  getStoreLayerState(mapId).actions.updateLayerByPath(layerPath, (layer) => ({ ...layer, mosaicRule }));
};

/**
 * Sets the raster function for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to update.
 * @param rasterFunctionId - The raster function id to set, or undefined to clear.
 */
export const setStoreLayerRasterFunction = (mapId: string, layerPath: string, rasterFunctionId: string | undefined): void => {
  getStoreLayerState(mapId).actions.updateLayerByPath(layerPath, (layer) => ({ ...layer, rasterFunction: rasterFunctionId }));
};

/**
 * Sets the WMS style for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to update.
 * @param wmsStyleName - The WMS style name to set, or undefined to clear.
 */
export const setStoreLayerWmsStyle = (mapId: string, layerPath: string, wmsStyleName: string | undefined): void => {
  getStoreLayerState(mapId).actions.updateLayerByPath(layerPath, (layer) => ({ ...layer, wmsStyle: wmsStyleName }));
};

/**
 * Sets the Text Visibility for a specific layer in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to update.
 * @param textVisible - Whether the text is visible.
 */
export const setStoreLayerTextVisibility = (mapId: string, layerPath: string, textVisible: boolean): void => {
  getStoreLayerState(mapId).actions.updateLayerByPath(layerPath, (layer) => ({ ...layer, textVisible }));
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
  // Create a sorted copy of the layers (toSorted produces a new array)
  const sortedLayers = [...getStoreLayerLegendLayers(mapId)].sort(
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
  getStoreLayerState(mapId).actions.updateLayerByPath(layerPath, (layer) => {
    const updated: TypeLegendLayer = { ...layer, legendQueryStatus, styleConfig: data?.styleConfig };

    if (data?.type) {
      updated.icons = GeoUtilities.getLayerIconImage(data.type, data) ?? [];
      updated.items = GeoUtilities.getLayerItemsFromIcons(data.type, updated.icons);
    }

    return updated;
  });
};

/**
 * Deletes a layer from the legend layers in the store.
 *
 * @param mapId - The map identifier.
 * @param layerPath - The layer path to remove.
 */
export const deleteStoreLayerFromLegendLayers = (mapId: string, layerPath: string): void => {
  const layers = getStoreLayerLegendLayers(mapId);
  getStoreLayerState(mapId).actions.setLegendLayers(utilDeleteLayerFromLegendLayers(layers, layerPath));
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
