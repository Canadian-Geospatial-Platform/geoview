import { useStore } from 'zustand';

import { FitOptions } from 'ol/View';
import { Extent } from 'ol/extent';

import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeLayersViewDisplayState, TypeLegendItem, TypeLegendLayer, TypeLegendLayerItem } from '@/core/components/layers/types';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import { TypeFeatureInfoEntryPartial, TypeLayerStyleConfig, TypeResultSet, TypeResultSetEntry } from '@/api/types/map-schema-types';
import { TimeDimension } from '@/core/utils/date-mgt';
import { CONST_LAYER_TYPES, TypeLayerStatus, TypeLayerControls, TypeGeoviewLayerType } from '@/api/types/layer-schema-types';
import { EsriDynamicLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { OL_ZOOM_DURATION, OL_ZOOM_PADDING } from '@/core/utils/constant';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { TypeVectorLayerStyles } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { esriQueryRecordsByUrlObjectIds } from '@/geo/layer/gv-layers/utils';
import { LayerNotEsriDynamicError, LayerNotFoundError } from '@/core/exceptions/layer-exceptions';
import { NoBoundsError } from '@/core/exceptions/geoview-exceptions';
import { logger } from '@/core/utils/logger';

// #region INTERFACES & TYPES

type LayerActions = ILayerState['actions'];

export interface ILayerState {
  highlightedLayer: string;
  selectedLayer: TypeLegendLayer;
  selectedLayerPath: string | undefined | null;
  legendLayers: TypeLegendLayer[];
  displayState: TypeLayersViewDisplayState;
  layerDeleteInProgress: string;
  selectedLayerSortingArrowId: string;
  layersAreLoading: boolean;
  setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;

  actions: {
    deleteLayer: (layerPath: string) => void;
    getExtentFromFeatures: (layerPath: string, featureIds: string[], outfield?: string) => Promise<Extent>;
    queryLayerEsriDynamic: (layerPath: string, objectIDs: number[]) => Promise<TypeFeatureInfoEntryPartial[]>;
    getLayer: (layerPath: string) => TypeLegendLayer | undefined;
    getLayerBounds: (layerPath: string) => number[] | undefined;
    getLayerDefaultFilter: (layerPath: string) => string | undefined;
    getLayerDeleteInProgress: () => string;
    getLayerServiceProjection: (layerPath: string) => string | undefined;
    getLayerTimeDimension: (layerPath: string) => TimeDimension | undefined;
    refreshLayer: (layerPath: string) => void;
    reloadLayer: (layerPath: string) => void;
    setAllItemsVisibility: (layerPath: string, visibility: boolean) => void;
    setDisplayState: (newDisplayState: TypeLayersViewDisplayState) => void;
    setHighlightLayer: (layerPath: string) => void;
    setLayerDeleteInProgress: (newVal: string) => void;
    setLayerOpacity: (layerPath: string, opacity: number, updateLegendLayers?: boolean) => void;
    setLayerHoverable: (layerPath: string, enable: boolean) => void;
    setLayerQueryable: (layerPath: string, enable: boolean) => void;
    setSelectedLayerPath: (layerPath: string) => void;
    toggleItemVisibility: (layerPath: string, item: TypeLegendItem) => void;
    zoomToLayerExtent: (layerPath: string) => Promise<void>;
    zoomToLayerVisibleScale: (layerPath: string) => void;
    setSelectedLayerSortingArrowId: (layerId: string) => void;
  };

  setterActions: {
    setDisplayState: (newDisplayState: TypeLayersViewDisplayState) => void;
    setHighlightLayer: (layerPath: string) => void;
    setLayerDeleteInProgress: (newVal: string) => void;
    setLegendLayers: (legendLayers: TypeLegendLayer[]) => void;
    setSelectedLayerPath: (layerPath: string) => void;
    setSelectedLayerSortingArrowId: (arrowId: string) => void;
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
    selectedLayerPath: null,
    displayState: 'view',
    layerDeleteInProgress: '',
    selectedLayerSortingArrowId: '',

    // Initialize default
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => {
      set({
        layerState: {
          ...get().layerState,
          selectedLayerPath: geoviewConfig.footerBar?.selectedLayersLayerPath || geoviewConfig.appBar?.selectedLayersLayerPath || null,
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
       * @param {string[]} featureIds - The feature ids to get the extent of
       * @param {string?} outfield - The out field
       * @returns {Promise<Extent>} The Promise of an Extent
       */
      getExtentFromFeatures: (layerPath: string, featureIds: string[], outfield?: string): Promise<Extent> => {
        // Redirect to event processor
        return LegendEventProcessor.getExtentFromFeatures(get().mapId, layerPath, featureIds, outfield);
      },

      /**
       * Queries the EsriDynamic layer at the given layer path for a specific set of object ids
       * @param {string} layerPath - The layer path of the layer to query
       * @param {number[]} objectIDs - The object ids to filter the query on
       * @returns A Promise of results of type TypeFeatureInfoEntryPartial
       */
      queryLayerEsriDynamic: (layerPath: string, objectIDs: number[]): Promise<TypeFeatureInfoEntryPartial[]> => {
        // Get the layer config
        const layerConfig = MapEventProcessor.getMapViewerLayerAPI(get().mapId).getLayerEntryConfig(layerPath);

        // If not found
        if (!layerConfig) throw new LayerNotFoundError(layerPath);

        // If not EsriDynamic
        if (!(layerConfig instanceof EsriDynamicLayerEntryConfig))
          throw new LayerNotEsriDynamicError(layerPath, layerConfig.getLayerNameCascade());

        // Get the geometry type
        const [geometryType] = layerConfig.getTypeGeometries();

        // Get oid field
        const oidField =
          layerConfig.source.featureInfo && layerConfig.source.featureInfo.outfields
            ? layerConfig.source.featureInfo.outfields.filter((field) => field.type === 'oid')[0].name
            : 'OBJECTID';

        // Query for the specific object ids
        // TODO: Put the server original projection in the config metadata (add a new optional param in source for esri)
        // TO.DOCONT: When we get the projection we can get the projection in original server (will solve error trying to reproject https://maps-cartes.ec.gc.ca/arcgis/rest/services/CESI/MapServer/7 in 3857)
        // TO.DOCONT: Then we need to modify the DownloadGeoJSON to use mapProjection for vector and original projection for dynamic.
        return esriQueryRecordsByUrlObjectIds(
          `${layerConfig.source?.dataAccessPath}/${layerConfig.layerId}`,
          geometryType,
          objectIDs,
          oidField,
          true,
          MapEventProcessor.getMapState(get().mapId).currentProjection
        );
      },

      /**
       * Gets legend layer for given layer path.
       * @param {string} layerPath - The layer path to get info for.
       * @return {TypeLegendLayer | undefined}
       */
      getLayer: (layerPath: string): TypeLegendLayer | undefined => {
        const curLayers = get().layerState.legendLayers;
        return LegendEventProcessor.findLayerByPath(curLayers, layerPath);
      },

      /**
       * Gets the layer bounds in the store which correspond to the layer path
       * @param {string} layerPath - The layer path of the bounds to get
       * @returns {Extent | undefined} The bounds or undefined
       */
      getLayerBounds: (layerPath: string): Extent | undefined => {
        // Redirect to processor
        return LegendEventProcessor.getLayerBounds(get().mapId, layerPath);
      },

      /**
       * Gets the default filter of the layer.
       * @param {string} layerPath - The layer path of the layer to get the default filter for.
       * @returns {string | undefined} The default filter or undefined
       */
      getLayerDefaultFilter: (layerPath: string): string | undefined => {
        // Redirect to pProcessor
        return LegendEventProcessor.getLayerEntryConfigDefaultFilter(get().mapId, layerPath);
      },

      /**
       * Get the LayerDeleteInProgress state.
       */
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

      getLayerTimeDimension: (layerPath: string): TimeDimension | undefined => {
        try {
          return LegendEventProcessor.getLayerTimeDimension(get().mapId, layerPath);
        } catch (error: unknown) {
          logger.logError(`Error getting temporal dimension for layer ${layerPath}`, error);
        }
        return undefined;
      },

      /**
       * Refresh layer and set states to original values.
       * @param {string} layerPath - The layer path of the layer to change.
       */
      refreshLayer: (layerPath: string): void => {
        // Redirect to processor.
        LegendEventProcessor.refreshLayer(get().mapId, layerPath);
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
       * Sets the visibility of all items in the layer.
       * @param {string} layerPath - The layer path of the layer to change.
       * @param {boolean} visibility - The visibility.
       */
      setAllItemsVisibility: (layerPath: string, visibility: boolean): void => {
        // Redirect to processor.
        LegendEventProcessor.setAllItemsVisibility(get().mapId, layerPath, visibility);
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
        LegendEventProcessor.setSelectedLayersTabLayer(get().mapId, layerPath);
      },

      /**
       * Toggle visibility of an item.
       * @param {string} layerPath - The layer path of the layer to change.
       * @param {TypeLegendItem} item - The name of the item to change.
       */
      toggleItemVisibility: (layerPath: string, item: TypeLegendItem): void => {
        // Redirect to processor
        LegendEventProcessor.toggleItemVisibility(get().mapId, layerPath, item);
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

      setSelectedLayerSortingArrowId: (arrowId: string): void => {
        // Redirect to setter
        get().layerState.setterActions.setSelectedLayerSortingArrowId(arrowId);
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
            // GV Here, we use the spread operator for the custom selector hooks such as useSelectorLayerStatus to
            // GV notice and eventually trigger the changes that need to be get triggered
          },
        });
      },

      /**
       * Sets the selected layer path.
       * @param {string} layerPath - The layer path to set as selected.
       */
      setSelectedLayerPath: (layerPath: string | null): void => {
        let theLayerPath: string | null = layerPath;
        if (layerPath && layerPath.length === 0) theLayerPath = null;
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

      setSelectedLayerSortingArrowId: (arrowId: string) => {
        set({
          layerState: {
            ...get().layerState,
            selectedLayerSortingArrowId: arrowId,
          },
        });
      },

      setLayersAreLoading: (areLoading: boolean) => {
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
  legendQueryStatus: LegendQueryStatus;
  data: TypeLegend | undefined | null;
};

export type LegendQueryStatus = 'init' | 'querying' | 'queried';

export type TypeLegend = {
  type: TypeGeoviewLayerType;
  styleConfig?: TypeLayerStyleConfig | null;
  // Layers other than vector layers use the HTMLCanvasElement type for their legend.
  legend: TypeVectorLayerStyles | HTMLCanvasElement | null;
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
export const useSelectedLayerSortingArrowId = (): string =>
  useStore(useGeoViewStore(), (state) => state.layerState.selectedLayerSortingArrowId);
export const useLayersAreLoading = (): boolean => useStore(useGeoViewStore(), (state) => state.layerState.layersAreLoading);
export const useLayerStoreActions = (): LayerActions => useStore(useGeoViewStore(), (state) => state.layerState.actions);

// computed gets
export const useSelectedLayer = (): TypeLegendLayer | undefined => {
  const layers = useStore(useGeoViewStore(), (state) => state.layerState.legendLayers);
  const selectedLayerPath = useStore(useGeoViewStore(), (state) => state.layerState.selectedLayerPath);
  if (selectedLayerPath) {
    return LegendEventProcessor.findLayerByPath(layers, selectedLayerPath);
  }
  return undefined;
};

export const useIconLayerSet = (layerPath: string): string[] => {
  const layers = useStore(useGeoViewStore(), (state) => state.layerState.legendLayers);
  const layer = LegendEventProcessor.findLayerByPath(layers, layerPath);
  if (layer && layer.type !== CONST_LAYER_TYPES.WMS) {
    return layer.items.map((item) => item.icon).filter((d) => d !== null);
  }
  if (layer && layer.type === CONST_LAYER_TYPES.WMS) {
    return layer.icons.map((item) => item.iconImage).filter((d) => d !== null) as string[];
  }
  return [];
};

export const useSelectorLayerId = (layerPath: string): string | undefined => {
  // Hook
  return useStore(useGeoViewStore(), (state) => LegendEventProcessor.findLayerByPath(state.layerState.legendLayers, layerPath)?.layerId);
};

export const useSelectorLayerName = (layerPath: string): string | undefined => {
  // Hook
  return useStore(useGeoViewStore(), (state) => LegendEventProcessor.findLayerByPath(state.layerState.legendLayers, layerPath)?.layerName);
};

export const useSelectorLayerType = (layerPath: string): TypeGeoviewLayerType | undefined => {
  // Hook
  return useStore(useGeoViewStore(), (state) => LegendEventProcessor.findLayerByPath(state.layerState.legendLayers, layerPath)?.type);
};

export const useSelectorLayerStatus = (layerPath: string): TypeLayerStatus | undefined => {
  // Hook
  return useStore(
    useGeoViewStore(),
    (state) => LegendEventProcessor.findLayerByPath(state.layerState.legendLayers, layerPath)?.layerStatus
  );
};

export const useSelectorLayerLegendQueryStatus = (layerPath: string): string | undefined => {
  // Hook
  return useStore(
    useGeoViewStore(),
    (state) => LegendEventProcessor.findLayerByPath(state.layerState.legendLayers, layerPath)?.legendQueryStatus
  );
};

export const useSelectorLayerControls = (layerPath: string): TypeLayerControls | undefined => {
  // Hook
  return useStore(useGeoViewStore(), (state) => LegendEventProcessor.findLayerByPath(state.layerState.legendLayers, layerPath)?.controls);
};

export const useSelectorLayerChildren = (layerPath: string): TypeLegendLayer[] | undefined => {
  // Hook
  return useStore(useGeoViewStore(), (state) => {
    // Get the state value
    return LegendEventProcessor.findLayerByPath(state.layerState.legendLayers, layerPath)?.children;
  });
};

export const useSelectorLayerItems = (layerPath: string): TypeLegendItem[] | undefined => {
  // Hook
  return useStore(useGeoViewStore(), (state) => {
    // Get the state value
    return LegendEventProcessor.findLayerByPath(state.layerState.legendLayers, layerPath)?.items;
  });
};

export const useSelectorLayerIcons = (layerPath: string): TypeLegendLayerItem[] | undefined => {
  // Hook
  return useStore(useGeoViewStore(), (state) => {
    // Get the state value
    return LegendEventProcessor.findLayerByPath(state.layerState.legendLayers, layerPath)?.icons;
  });
};
