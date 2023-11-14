/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */
import { useStore } from 'zustand';
import _ from 'lodash';
import { useGeoViewStore } from '../stores-managers';
import { TypeLegendLayer } from '../../components/layers/types';
import { TypeGetStore, TypeSetStore } from '../geoview-store';

export interface ILayerState {
  selectedItem?: TypeLegendLayer;
  selectedIsVisible: boolean;
  selectedLayers: Record<string, { layer: string; icon: string }[]>;
  selectedLayerPath: string | undefined | null;
  legendLayers: TypeLegendLayer[];
  actions: {
    getLayer: (layerPath: string) => TypeLegendLayer | undefined;
    setSelectedLayerPath: (layerPath: string) => void;
    setLayerOpacity: (layerPath: string, opacity: number) => void;
    toggleLayerVisibility: (layerPath: string) => void;
    toggleItemVisibility: (layerPath: string, itemName: string) => void;
    setAllItemsVisibility: (layerPath: string, visibility: boolean) => void;
  };
}

export function initializeLayerState(set: TypeSetStore, get: TypeGetStore): ILayerState {
  const init = {
    selectedIsVisible: false,
    selectedLayers: {} as Record<string, { layer: string; icon: string }[]>,
    legendLayers: [] as TypeLegendLayer[],
    selectedLayerPath: null,

    actions: {
      getLayer: (layerPath: string) => {
        const curLayers = get().legendState.legendLayers;
        const layer = findLayerByPath(curLayers, layerPath);
        return layer;
      },
      setSelectedLayerPath: (layerPath: string) => {
        set({
          legendState: {
            ...get().legendState,
            selectedLayerPath: layerPath,
          },
        });
      },
      setLayerOpacity: (layerPath: string, opacity: number) => {
        const curLayers = get().legendState.legendLayers;
        const layer = findLayerByPath(curLayers, layerPath);
        if (layer) {
          layer.opacity = opacity;
        }

        // now update store
        set({
          legendState: {
            ...get().legendState,
            legendLayers: [...curLayers],
          },
        });
      },
      toggleLayerVisibility: (layerPath: string) => {
        const curLayers = get().legendState.legendLayers;
        const layer = findLayerByPath(curLayers, layerPath);
        if (layer) {
          layer.isVisible = !layer.isVisible;
          setPropInChildLayers(layer.children, 'isVisible', layer.isVisible);
        }

        // now update store
        set({
          legendState: {
            ...get().legendState,
            legendLayers: [...curLayers],
          },
        });
      },
      toggleItemVisibility: (layerPath: string, itemName: string) => {
        const curLayers = get().legendState.legendLayers;

        const layer = findLayerByPath(curLayers, layerPath);
        if (layer) {
          _.each(layer.items, (item) => {
            if (item.name === itemName) {
              item.isChecked = !item.isChecked; // eslint-disable-line no-param-reassign
            }
          });
          layer.allItemsChecked = _.every(layer.items, (i) => i.isChecked);
          const allItemsUnchecked = _.every(layer.items, (i) => !i.isChecked);
          if (allItemsUnchecked) {
            layer.isVisible = false;
          }
        }
        set({
          legendState: {
            ...get().legendState,
            legendLayers: [...curLayers],
          },
        });
      },
      setAllItemsVisibility: (layerPath: string, visibility: boolean) => {
        const curLayers = get().legendState.legendLayers;

        const layer = findLayerByPath(curLayers, layerPath);
        if (layer) {
          _.each(layer.items, (item) => {
            item.isChecked = visibility; // eslint-disable-line no-param-reassign
          });
          layer.allItemsChecked = visibility;
          layer.isVisible = visibility;
        }

        set({
          legendState: {
            ...get().legendState,
            legendLayers: [...curLayers],
          },
        });
      },
    },
  };

  return init;
}

/// private functions
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
    if (l.layerPath === layerPath) {
      return l;
    }

    if (l.children && l.children.length > 0) {
      const result: TypeLegendLayer | undefined = findLayerByPath(l.children, layerPath);
      if (result) {
        return result;
      }
    }
  }

  return undefined;
}

// **********************************************************
// Layer state selectors
// **********************************************************
export const useLayersList = () => useStore(useGeoViewStore(), (state) => state.legendState.legendLayers);
export const useSelectedLayerPath = () => useStore(useGeoViewStore(), (state) => state.legendState.selectedLayerPath);

export const useLayerStoreActions = () => useStore(useGeoViewStore(), (state) => state.legendState.actions);

// computed gets
export const useSelectedLayer = () => {
  const layers = useStore(useGeoViewStore(), (state) => state.legendState.legendLayers);
  const selectedLayerPath = useStore(useGeoViewStore(), (state) => state.legendState.selectedLayerPath);
  if (selectedLayerPath) {
    return findLayerByPath(layers, selectedLayerPath);
  }
  return undefined;
};

export const useIconLayerSet = (layerPath: string) => {
  const layers = useStore(useGeoViewStore(), (state) => state.legendState.legendLayers);
  const layer = findLayerByPath(layers, layerPath);
  if (layer) {
    return layer.items.map((item) => item.icon);
  }
  return [];
};
