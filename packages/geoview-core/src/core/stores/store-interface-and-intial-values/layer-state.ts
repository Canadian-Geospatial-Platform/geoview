/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */
import { useStore } from 'zustand';
import _ from 'lodash';

import { FitOptions } from 'ol/View';

import { useGeoViewStore } from '../stores-managers';
import { TypeLayersViewDisplayState, TypeLegendLayer } from '@/core/components/layers/types';
import { TypeGetStore, TypeSetStore } from '../geoview-store';
import { TypeStyleGeometry, TypeUniqueValueStyleConfig, TypeVectorLayerEntryConfig } from '@/geo/map/map-schema-types';
import { AbstractGeoViewVector, EsriDynamic, api } from '@/app';
import { OL_ZOOM_DURATION, OL_ZOOM_PADDING } from '@/core/utils/constant';

export interface ILayerState {
  highlightedLayer: string;
  selectedItem?: TypeLegendLayer;
  selectedIsVisible: boolean;
  selectedLayers: Record<string, { layer: string; icon: string }[]>;
  selectedLayerPath: string | undefined | null;
  legendLayers: TypeLegendLayer[];
  displayState: TypeLayersViewDisplayState;
  actions: {
    getLayer: (layerPath: string) => TypeLegendLayer | undefined;
    setDisplayState: (newDisplayState: TypeLayersViewDisplayState) => void;
    setHighlightLayer: (layerPath: string) => void;
    setSelectedLayerPath: (layerPath: string) => void;
    setLayerOpacity: (layerPath: string, opacity: number) => void;
    toggleLayerVisibility: (layerPath: string) => void;
    toggleItemVisibility: (layerPath: string, geometryType: TypeStyleGeometry, itemName: string) => void;
    setAllItemsVisibility: (layerPath: string, visibility: 'yes' | 'no') => void;
    deleteLayer: (layerPath: string) => void;
    zoomToLayerExtent: (layerPath: string) => void;
  };
}

export function initializeLayerState(set: TypeSetStore, get: TypeGetStore): ILayerState {
  const init = {
    highlightedLayer: '',
    selectedIsVisible: false,
    selectedLayers: {} as Record<string, { layer: string; icon: string }[]>,
    legendLayers: [] as TypeLegendLayer[],
    selectedLayerPath: null,
    displayState: 'view',

    actions: {
      getLayer: (layerPath: string) => {
        const curLayers = get().layerState.legendLayers;
        const layer = findLayerByPath(curLayers, layerPath);
        return layer;
      },
      setDisplayState: (newDisplayState: TypeLayersViewDisplayState) => {
        const curState = get().layerState.displayState;
        set({
          layerState: {
            ...get().layerState,
            displayState: curState === newDisplayState ? 'view' : newDisplayState,
          },
        });
      },
      setHighlightLayer: (layerPath: string) => {
        // keep track oh highlighted layer to set active button state because they can only be one highlighted layer at a time
        const currentHiglight = get().layerState.highlightedLayer;
        let tempLayerPath = layerPath;

        // TODO: keep reference to geoview map instance in the store or keep accessing with api - discussion
        if (currentHiglight === tempLayerPath) {
          api.maps[get().mapId].layer.removeHighlightLayer();
          tempLayerPath = '';
        } else {
          api.maps[get().mapId].layer.highlightLayer(tempLayerPath);
        }

        set({
          layerState: {
            ...get().layerState,
            highlightedLayer: tempLayerPath,
          },
        });
      },
      setSelectedLayerPath: (layerPath: string) => {
        set({
          layerState: {
            ...get().layerState,
            selectedLayerPath: layerPath,
          },
        });
      },
      setLayerOpacity: (layerPath: string, opacity: number) => {
        const curLayers = get().layerState.legendLayers;
        const layer = findLayerByPath(curLayers, layerPath);
        if (layer) {
          layer.opacity = opacity;
        }

        // TODO: keep reference to geoview map instance in the store or keep accessing with api - discussion
        //! may not work with group items ... see if Yves work will make this simplier
        const layerId: string[] = layerPath.split('/');
        api.maps[get().mapId].layer.geoviewLayers[layerId[0]]!.setOpacity(opacity, layerPath);

        // now update store
        set({
          layerState: {
            ...get().layerState,
            legendLayers: [...curLayers],
          },
        });
      },
      toggleLayerVisibility: (layerPath: string) => {
        const curLayers = get().layerState.legendLayers;
        const layer = findLayerByPath(curLayers, layerPath);
        if (layer && layer.isVisible !== 'always') {
          layer.isVisible = layer.isVisible === 'no' ? 'yes' : 'no';
          setPropInChildLayers(layer.children, 'isVisible', layer.isVisible);
        }

        // TODO: keep reference to geoview map instance in the store or keep accessing with api - discussion
        //! may not work with group items ... see if Yves work will make this simplier
        const layerId: string[] = layerPath.split('/');
        api.maps[get().mapId].layer.geoviewLayers[layerId[0]]!.setVisible(layer?.isVisible !== 'no', layerPath);

        // now update store
        set({
          layerState: {
            ...get().layerState,
            legendLayers: [...curLayers],
          },
        });
      },
      toggleItemVisibility: (layerPath: string, geometryType: TypeStyleGeometry, itemName: string) => {
        const curLayers = get().layerState.legendLayers;

        const registeredLayer = api.maps[get().mapId].layer.registeredLayers[layerPath] as TypeVectorLayerEntryConfig;
        const layer = findLayerByPath(curLayers, layerPath);
        if (layer) {
          _.each(layer.items, (item, index) => {
            if (item.geometryType === geometryType && item.name === itemName && item.isVisible !== 'always') {
              item.isVisible = item.isVisible === 'no' ? 'yes' : 'no'; // eslint-disable-line no-param-reassign

              // assign value to registered layer. This is use by applyFilter function to set visibility
              // TODO: check if we need to refactor to centralize attribute setting....
              // TODO: know issue when we toggle a default visibility item https://github.com/Canadian-Geospatial-Platform/geoview/issues/1564
              (registeredLayer.style![geometryType]! as TypeUniqueValueStyleConfig).uniqueValueStyleInfo[index].visible = item.isVisible;
            }
          });
          // 'always' is neither 'yes', nor 'no'.
          layer.allItemsChecked = _.every(layer.items, (i) => ['yes', 'always'].includes(i.isVisible!));
          const allItemsUnchecked = _.every(layer.items, (i) => ['no', 'always'].includes(i.isVisible!));
          if (allItemsUnchecked && layer.isVisible !== 'always') {
            layer.isVisible = 'no';
          }

          // apply filter to layer
          const layerToFilter = api.maps[get().mapId].layer.geoviewLayers[layerPath.split('/')[0]]! as AbstractGeoViewVector | EsriDynamic;
          layerToFilter.applyViewFilter(layerPath);
        }
        set({
          layerState: {
            ...get().layerState,
            legendLayers: [...curLayers],
          },
        });
      },
      setAllItemsVisibility: (layerPath: string, visibility: 'yes' | 'no') => {
        const curLayers = get().layerState.legendLayers;

        const registeredLayer = api.maps[get().mapId].layer.registeredLayers[layerPath] as TypeVectorLayerEntryConfig;
        const layer = findLayerByPath(curLayers, layerPath);
        if (layer) {
          _.each(layer.items, (item, index) => {
            if (item.isVisible !== 'always') {
              item.isVisible = visibility; // eslint-disable-line no-param-reassign

              // assign value to registered layer. Thisis use by applyFilter function to set visibility
              // TODO: check if we need to refactor to centralize attribute setting....
              (registeredLayer.style![item.geometryType]! as TypeUniqueValueStyleConfig).uniqueValueStyleInfo[index].visible =
                item.isVisible;
            }
          });
          layer.allItemsChecked = visibility === 'yes';
          // TODO: this visibility flag for the store should we use to show/hide icon on the layer item list (if always in child, no toggle visibility)
          // This should be set at init of layer
          layer.isVisible = visibility;
        }

        set({
          layerState: {
            ...get().layerState,
            legendLayers: [...curLayers],
          },
        });

        // TODO: keep reference to geoview map instance in the store or keep accessing with api - discussion
        //! try to make reusable store actions....
        // TODO: we can have always item.... we cannot set visibility so if present we will need to trap. Need more use case
        // TODO: create a function setItemVisibility called with layer path and this function set the registered layer (from store values) then apply the filter.
        const layerToFilter = api.maps[get().mapId].layer.geoviewLayers[layerPath.split('/')[0]]! as AbstractGeoViewVector | EsriDynamic;
        layerToFilter.applyViewFilter(layerPath);
      },
      deleteLayer: (layerPath: string) => {
        const curLayers = get().layerState.legendLayers;
        deleteSingleLayer(curLayers, layerPath);
        set({
          layerState: {
            ...get().layerState,
            legendLayers: [...curLayers],
          },
        });

        // TODO: keep reference to geoview map instance in the store or keep accessing with api - discussion
        api.maps[get().mapId].layer.removeLayersUsingPath(layerPath);
      },
      zoomToLayerExtent: (layerPath: string) => {
        // TODO: keep reference to geoview map instance in the store or keep accessing with api - discussion
        const options: FitOptions = { padding: OL_ZOOM_PADDING, duration: OL_ZOOM_DURATION };
        const layer = findLayerByPath(get().layerState.legendLayers, layerPath);
        const { bounds } = layer as TypeLegendLayer;
        if (bounds) api.maps[get().mapId].zoomToExtent(bounds, options);
      },
    },
  } as ILayerState;

  return init;
}

// private functions
function setPropInChildLayers(children: TypeLegendLayer[], propName: string, val: unknown) {
  _.each(children, (child) => {
    _.set(child, propName, val);
    if (child.children && child.children.length > 0) {
      setPropInChildLayers(child.children, propName, val);
    }
  });
}

function findLayerByPath(layers: TypeLegendLayer[], layerPath: string): TypeLegendLayer | undefined {
  for (const l of layers) {
    if (layerPath === l.layerPath) {
      return l;
    }
    if (layerPath.startsWith(l.layerPath) && l.children?.length > 0) {
      const result: TypeLegendLayer | undefined = findLayerByPath(l.children, layerPath);
      if (result) {
        return result;
      }
    }
  }

  return undefined;
}

function deleteSingleLayer(layers: TypeLegendLayer[], layerPath: string) {
  const indexToDelete = layers.findIndex((l) => l.layerPath === layerPath);
  if (indexToDelete >= 0) {
    layers.splice(indexToDelete, 1);
  } else {
    for (const l of layers) {
      if (l.children && l.children.length > 0) {
        deleteSingleLayer(l.children, layerPath);
      }
    }
  }
}

// **********************************************************
// Layer state selectors
// **********************************************************
export const useLayerHighlightedLayer = () => useStore(useGeoViewStore(), (state) => state.layerState.highlightedLayer);
export const useLayersList = () => useStore(useGeoViewStore(), (state) => state.layerState.legendLayers);
export const useSelectedLayerPath = () => useStore(useGeoViewStore(), (state) => state.layerState.selectedLayerPath);
export const useLayersDisplayState = () => useStore(useGeoViewStore(), (state) => state.layerState.displayState);

export const useLayerStoreActions = () => useStore(useGeoViewStore(), (state) => state.layerState.actions);

// computed gets
export const useSelectedLayer = () => {
  const layers = useStore(useGeoViewStore(), (state) => state.layerState.legendLayers);
  const selectedLayerPath = useStore(useGeoViewStore(), (state) => state.layerState.selectedLayerPath);
  if (selectedLayerPath) {
    return findLayerByPath(layers, selectedLayerPath);
  }
  return undefined;
};

export const useIconLayerSet = (layerPath: string): string[] => {
  const layers = useStore(useGeoViewStore(), (state) => state.layerState.legendLayers);
  const layer = findLayerByPath(layers, layerPath);
  if (layer) {
    return layer.items.map((item) => item.icon).filter((d) => d !== null) as string[];
  }
  return [];
};
