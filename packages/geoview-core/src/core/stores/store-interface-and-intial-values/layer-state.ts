/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */
import { useStore } from 'zustand';
import _ from 'lodash';
import { useGeoViewStore } from '../stores-managers';
import { TypeLayersViewDisplayState, TypeLegendLayer } from '../../components/layers/types';
import { TypeGetStore, TypeSetStore } from '../geoview-store';

export interface ILayerState {
  selectedItem?: TypeLegendLayer;
  selectedIsVisible: boolean;
  selectedLayers: Record<string, { layer: string; icon: string }[]>;
  selectedLayerPath: string | undefined | null;
  legendLayers: TypeLegendLayer[];
  displayState: TypeLayersViewDisplayState;
  actions: {
    getLayer: (layerPath: string) => TypeLegendLayer | undefined;
    setDisplayState: (newDisplayState: TypeLayersViewDisplayState) => void;
    setSelectedLayerPath: (layerPath: string) => void;
    setLayerOpacity: (layerPath: string, opacity: number) => void;
    toggleLayerVisibility: (layerPath: string) => void;
    toggleItemVisibility: (layerPath: string, itemName: string) => void;
    setAllItemsVisibility: (layerPath: string, visibility: 'yes' | 'no') => void;
    deleteLayer: (layerPath: string) => void;
  };
}

export function initializeLayerState(set: TypeSetStore, get: TypeGetStore): ILayerState {
  const init = {
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

        // now update store
        set({
          layerState: {
            ...get().layerState,
            legendLayers: [...curLayers],
          },
        });
      },
      toggleItemVisibility: (layerPath: string, itemName: string) => {
        const curLayers = get().layerState.legendLayers;

        const layer = findLayerByPath(curLayers, layerPath);
        if (layer) {
          _.each(layer.items, (item) => {
            if (item.name === itemName && item.isVisible !== 'always') {
              item.isVisible = item.isVisible === 'no' ? 'yes' : 'no'; // eslint-disable-line no-param-reassign
            }
          });
          // 'always' is neither 'yes', nor 'no'.
          layer.allItemsChecked = _.every(layer.items, (i) => ['yes', 'always'].includes(i.isVisible!));
          const allItemsUnchecked = _.every(layer.items, (i) => ['no', 'always'].includes(i.isVisible!));
          if (allItemsUnchecked && layer.isVisible !== 'always') {
            layer.isVisible = 'no';
          }
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

        const layer = findLayerByPath(curLayers, layerPath);
        if (layer) {
          _.each(layer.items, (item) => {
            if (item.isVisible !== 'always') item.isVisible = visibility; // eslint-disable-line no-param-reassign
          });
          layer.allItemsChecked = visibility === 'yes';
          layer.isVisible = visibility;
        }

        set({
          layerState: {
            ...get().layerState,
            legendLayers: [...curLayers],
          },
        });
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
  const indToDelete = layers.findIndex((l) => l.layerPath === layerPath);
  if (indToDelete >= 0) {
    layers.splice(indToDelete, 1);
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

export const useIconLayerSet = (layerPath: string) => {
  const layers = useStore(useGeoViewStore(), (state) => state.layerState.legendLayers);
  const layer = findLayerByPath(layers, layerPath);
  if (layer) {
    return layer.items.map((item) => item.icon);
  }
  return [];
};
