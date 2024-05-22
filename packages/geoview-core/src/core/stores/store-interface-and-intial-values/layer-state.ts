/* eslint-disable @typescript-eslint/no-use-before-define */
// this esLint is used in many places for findLayerByPath function. It is why we keep it global...
import { useStore } from 'zustand';

import { FitOptions } from 'ol/View';

import { Extent } from 'ol/extent';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeLayersViewDisplayState, TypeLegendItem, TypeLegendLayer } from '@/core/components/layers/types';
import { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import { OL_ZOOM_DURATION, OL_ZOOM_PADDING } from '@/core/utils/constant';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with AppEventProcessor vs AppState

// #region INTERFACES & TYPES

type LayerActions = ILayerState['actions'];

export interface ILayerState {
  highlightedLayer: string;
  selectedLayer: TypeLegendLayer;
  selectedLayerPath: string | undefined | null;
  legendLayers: TypeLegendLayer[];
  displayState: TypeLayersViewDisplayState;
  layerDeleteInProgress: boolean;

  actions: {
    deleteLayer: (layerPath: string) => void;
    getLayer: (layerPath: string) => TypeLegendLayer | undefined;
    getLayerBounds: (layerPath: string) => number[] | undefined;
    getLayerDeleteInProgress: () => boolean;
    setAllItemsVisibility: (layerPath: string, visibility: boolean) => void;
    setDisplayState: (newDisplayState: TypeLayersViewDisplayState) => void;
    setHighlightLayer: (layerPath: string) => void;
    setLayerDeleteInProgress: (newVal: boolean) => void;
    setLayerOpacity: (layerPath: string, opacity: number) => void;
    setSelectedLayerPath: (layerPath: string) => void;
    toggleItemVisibility: (layerPath: string, item: TypeLegendItem) => void;
    zoomToLayerExtent: (layerPath: string) => Promise<void>;
  };

  setterActions: {
    setDisplayState: (newDisplayState: TypeLayersViewDisplayState) => void;
    setHighlightLayer: (layerPath: string) => void;
    setLayerDeleteInProgress: (newVal: boolean) => void;
    setLegendLayers: (legendLayers: TypeLegendLayer[]) => void;
    setSelectedLayerPath: (layerPath: string) => void;
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
    layerDeleteInProgress: false,

    // #region ACTIONS
    actions: {
      /**
       * Deletes a layer.
       * @param {string} layerPath - The path of the layer to delete.
       */
      deleteLayer: (layerPath: string): void => {
        LegendEventProcessor.deleteLayer(get().mapId, layerPath);
        get().layerState.setterActions.setLayerDeleteInProgress(false);
      },

      /**
       * Get legend layer for given layer path.
       * @param {string} layerPath - The layer path to get info for.
       * @return {TypeLegendLayer | undefined}
       */
      getLayer: (layerPath: string): TypeLegendLayer | undefined => {
        const curLayers = get().layerState.legendLayers;
        return LegendEventProcessor.findLayerByPath(curLayers, layerPath);
      },

      /**
       * Get layer bounds for given layer path.
       * @param {string} layerPath - The layer path to get bounds for.
       * @return {Extent | undefined}
       */
      getLayerBounds: (layerPath: string): Extent | undefined => {
        // Redirect to map event processor.
        return MapEventProcessor.getLayerBounds(get().mapId, layerPath);
      },

      /**
       * Get the LayerDeleteInProgress state.
       */
      getLayerDeleteInProgress: () => get().layerState.layerDeleteInProgress,

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
       * @param {boolean} newVal - The new value.
       */
      setLayerDeleteInProgress: (newVal: boolean): void => {
        // Redirect to setter
        get().layerState.setterActions.setLayerDeleteInProgress(newVal);
      },

      /**
       * Sets the opacity of the layer.
       * @param {string} layerPath - The layer path of the layer to change.
       * @param {number} opacity - The opacity to set.
       */
      setLayerOpacity: (layerPath: string, opacity: number): void => {
        // Redirect to event processor
        LegendEventProcessor.setLayerOpacity(get().mapId, layerPath, opacity);
      },

      /**
       * Sets the selected layer path.
       * @param {string} layerPath - The layer path to set as selected.
       */
      setSelectedLayerPath: (layerPath: string): void => {
        // Redirect to setter
        get().layerState.setterActions.setSelectedLayerPath(layerPath);
      },

      /**
       * Toggle visibility of an item.
       * @param {string} layerPath - The layer path of the layer to change.
       * @param {TypeLegendItem} item - The name of the item to change.
       */
      toggleItemVisibility: (layerPath: string, item: TypeLegendItem): void => {
        // Redirect to processor.
        LegendEventProcessor.toggleItemVisibility(get().mapId, layerPath, item);
      },

      /**
       * Zoom to extents of a layer.
       * @param {string} layerPath - The path of the layer to zoom to.
       */
      zoomToLayerExtent: (layerPath: string): Promise<void> => {
        const options: FitOptions = { padding: OL_ZOOM_PADDING, duration: OL_ZOOM_DURATION };
        const layer = LegendEventProcessor.findLayerByPath(get().layerState.legendLayers, layerPath);
        const { bounds } = layer as TypeLegendLayer;
        if (bounds) return MapEventProcessor.zoomToExtent(get().mapId, bounds, options);
        return Promise.resolve();
      },
    },

    setterActions: {
      /**
       * Sets the display state.
       * @param {TypeLayersViewDisplayState} newDisplayState - The display state to set.
       */
      setDisplayState: (newDisplayState: TypeLayersViewDisplayState): void => {
        const curState = get().layerState.displayState;
        set({
          layerState: {
            ...get().layerState,
            displayState: curState === newDisplayState ? 'view' : newDisplayState,
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
       * @param {boolean} newVal - The new value.
       */
      setLayerDeleteInProgress: (newVal: boolean): void => {
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
          },
        });
      },

      /**
       * Sets the selected layer path.
       * @param {string} layerPath - The layer path to set as selected.
       */
      setSelectedLayerPath: (layerPath: string): void => {
        const curLayers = get().layerState.legendLayers;
        const layer = LegendEventProcessor.findLayerByPath(curLayers, layerPath);
        set({
          layerState: {
            ...get().layerState,
            selectedLayerPath: layerPath,
            selectedLayer: layer as TypeLegendLayer,
          },
        });
      },
    },
    // #endregion ACTIONS
  } as ILayerState;
}

// **********************************************************
// Layer state selectors
// **********************************************************
export const useLayerHighlightedLayer = (): string => useStore(useGeoViewStore(), (state) => state.layerState.highlightedLayer);
export const useLayerLegendLayers = (): TypeLegendLayer[] => useStore(useGeoViewStore(), (state) => state.layerState.legendLayers);
export const useLayerSelectedLayer = (): TypeLegendLayer => useStore(useGeoViewStore(), (state) => state.layerState.selectedLayer);
export const useLayerSelectedLayerPath = (): string | null | undefined =>
  useStore(useGeoViewStore(), (state) => state.layerState.selectedLayerPath);
export const useLayerDisplayState = (): TypeLayersViewDisplayState => useStore(useGeoViewStore(), (state) => state.layerState.displayState);

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
  if (layer) {
    return layer.items.map((item) => item.icon).filter((d) => d !== null) as string[];
  }
  return [];
};
