/* eslint-disable @typescript-eslint/no-use-before-define */
// this esLint is used in many places for findLayerByPath function. It is why we keep it global...
import { useStore } from 'zustand';

import { FitOptions } from 'ol/View';
import { Extent } from 'ol/extent';

import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeLayersViewDisplayState, TypeLegendItem, TypeLegendLayer } from '@/core/components/layers/types';
import { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import {
  layerEntryIsEsriDynamic,
  TypeFeatureInfoEntryPartial,
  TypeResultSet,
  TypeResultSetEntry,
  TypeStyleConfig,
} from '@/geo/map/map-schema-types';
import { OL_ZOOM_DURATION, OL_ZOOM_PADDING } from '@/core/utils/constant';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { TypeGeoviewLayerType, TypeVectorLayerStyles } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { esriQueryRecordsByUrlObjectIds } from '@/geo/layer/gv-layers/utils';

// #region INTERFACES & TYPES

type LayerActions = ILayerState['actions'];

export interface ILayerState {
  highlightedLayer: string;
  selectedLayer: TypeLegendLayer;
  selectedLayerPath: string | undefined | null;
  legendLayers: TypeLegendLayer[];
  displayState: TypeLayersViewDisplayState;
  layerDeleteInProgress: boolean;
  selectedLayerSortingArrowId: string;

  actions: {
    deleteLayer: (layerPath: string) => void;
    getExtentFromFeatures: (layerPath: string, featureIds: string[]) => Promise<Extent | undefined>;
    queryLayerEsriDynamic: (layerPath: string, objectIDs: number[]) => Promise<TypeFeatureInfoEntryPartial[]>;
    getLayer: (layerPath: string) => TypeLegendLayer | undefined;
    getLayerBounds: (layerPath: string) => number[] | undefined;
    getLayerDeleteInProgress: () => boolean;
    refreshLayer: (layerPath: string) => void;
    setAllItemsVisibility: (layerPath: string, visibility: boolean) => void;
    setDisplayState: (newDisplayState: TypeLayersViewDisplayState) => void;
    setHighlightLayer: (layerPath: string) => void;
    setLayerDeleteInProgress: (newVal: boolean) => void;
    setLayerOpacity: (layerPath: string, opacity: number) => void;
    setSelectedLayerPath: (layerPath: string) => void;
    toggleItemVisibility: (layerPath: string, item: TypeLegendItem) => void;
    zoomToLayerExtent: (layerPath: string) => Promise<void>;
    setSelectedLayerSortingArrowId: (layerId: string) => void;
  };

  setterActions: {
    setDisplayState: (newDisplayState: TypeLayersViewDisplayState) => void;
    setHighlightLayer: (layerPath: string) => void;
    setLayerDeleteInProgress: (newVal: boolean) => void;
    setLegendLayers: (legendLayers: TypeLegendLayer[]) => void;
    setSelectedLayerPath: (layerPath: string) => void;
    setSelectedLayerSortingArrowId: (arrowId: string) => void;
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
    selectedLayerSortingArrowId: '',
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

      getExtentFromFeatures: (layerPath: string, featureIds: string[]) => {
        // Redirect to event processor
        return LegendEventProcessor.getExtentFromFeatures(get().mapId, layerPath, featureIds);
      },

      /**
       * Queries the EsriDynamic layer at the given layer path for a specific set of object ids
       * @param {string} layerPath - The layer path of the layer to query
       * @param {number[]} objectIDs - The object ids to filter the query on
       * @returns A Promise of results of type TypeFeatureInfoEntryPartial
       */
      queryLayerEsriDynamic: (layerPath: string, objectIDs: number[]): Promise<TypeFeatureInfoEntryPartial[]> => {
        // Get the layer config
        const layerConfig = MapEventProcessor.getMapViewerLayerAPI(get().mapId).getLayerEntryConfig(
          layerPath
        ) as AbstractBaseLayerEntryConfig;

        // Get the geometry type
        const [geometryType] = layerConfig.getTypeGeometries();

        // Check if EsriDynamic config
        if (layerConfig && layerEntryIsEsriDynamic(layerConfig)) {
          // Query for the specific object ids
          // TODO: Make sure / is append at the end of metadataAccessPath/dataAccessPath when we read config
          // TODO: Put the server original projection in the config metadata (add a new optional param in source for esri)
          // TODO.CONT: When we get the projection we can get the projection in original server (will solve error trying to reproject https://maps-cartes.ec.gc.ca/arcgis/rest/services/CESI/MapServer/7 in 3857)
          // TODO.CONT: Then we need to modify the DownloadGeoJSON to use mapProjection for vector and original projection for dynamic.
          return esriQueryRecordsByUrlObjectIds(
            `${layerConfig.source?.dataAccessPath}/${layerConfig.layerId}`,
            geometryType,
            objectIDs,
            'OBJECTID',
            true,
            MapEventProcessor.getMapState(get().mapId).currentProjection
          );
        }

        // Not an EsriDynamic layer
        return Promise.reject(new Error('Not an EsriDynamic layer'));
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
       * Get the LayerDeleteInProgress state.
       */
      getLayerDeleteInProgress: () => get().layerState.layerDeleteInProgress,

      /**
       * Refresh layer and set states to original values.
       * @param {string} layerPath - The layer path of the layer to change.
       */
      refreshLayer: (layerPath: string): void => {
        // Redirect to processor.
        LegendEventProcessor.refreshLayer(get().mapId, layerPath);
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
        // Redirect to event processor
        LegendEventProcessor.setSelectedLayersTabLayer(get().mapId, layerPath);
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
        // Define some zoom options
        const options: FitOptions = { padding: OL_ZOOM_PADDING, duration: OL_ZOOM_DURATION };

        // Get the layer bounds
        const bounds = LegendEventProcessor.getLayerBounds(get().mapId, layerPath);

        // If found
        if (bounds) {
          return MapEventProcessor.zoomToExtent(get().mapId, bounds, options);
        }

        // Failed
        return Promise.resolve();
      },
      setSelectedLayerSortingArrowId: (arrowId: string) => {
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
      setSelectedLayerSortingArrowId: (arrowId: string) => {
        set({
          layerState: {
            ...get().layerState,
            selectedLayerSortingArrowId: arrowId,
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
  styleConfig?: TypeStyleConfig | null;
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
export const useSelectedLayerSortingArrowId = (): string =>
  useStore(useGeoViewStore(), (state) => state.layerState.selectedLayerSortingArrowId);

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
    return layer.icons.map((icon) => icon.iconImage).filter((d) => d !== null) as string[];
  }
  return [];
};
