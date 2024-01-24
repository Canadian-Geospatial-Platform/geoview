/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */
import { useStore } from 'zustand';
import _ from 'lodash';

import { FitOptions } from 'ol/View';

import { useGeoViewStore } from '../stores-managers';
import { TypeLayersViewDisplayState, TypeLegendLayer } from '@/core/components/layers/types';
import { TypeGetStore, TypeSetStore } from '../geoview-store';
import {
  TypeClassBreakStyleConfig,
  TypeStyleGeometry,
  TypeUniqueValueStyleConfig,
  TypeVectorLayerEntryConfig,
} from '@/geo/map/map-schema-types';
import { AbstractGeoViewVector, api } from '@/app';
import { OL_ZOOM_DURATION, OL_ZOOM_PADDING } from '@/core/utils/constant';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

export interface ILayerState {
  highlightedLayer: string;
  selectedItem?: TypeLegendLayer;
  selectedIsVisible: boolean;
  selectedLayer: TypeLegendLayer;
  selectedLayerPath: string | undefined | null;
  legendLayers: TypeLegendLayer[];
  displayState: TypeLayersViewDisplayState;
  actions: {
    setLegendLayers: (legendLayers: TypeLegendLayer[]) => void;
    getLayer: (layerPath: string) => TypeLegendLayer | undefined;
    getLayerBounds: (layerPath: string) => number[] | undefined;
    setDisplayState: (newDisplayState: TypeLayersViewDisplayState) => void;
    setHighlightLayer: (layerPath: string) => void;
    setLayerOpacity: (layerPath: string, opacity: number) => void;
    reorderLayer: (startIndex: number, endIndex: number, layerPath: string) => void;
    setSelectedLayerPath: (layerPath: string) => void;
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
    legendLayers: [] as TypeLegendLayer[],
    selectedLayerPath: null,
    displayState: 'view',

    actions: {
      setLegendLayers: (legendLayers: TypeLegendLayer[]): void => {
        set({
          layerState: {
            ...get().layerState,
            legendLayers: [...legendLayers],
          },
        });
      },
      getLayer: (layerPath: string) => {
        const curLayers = get().layerState.legendLayers;
        const layer = findLayerByPath(curLayers, layerPath);
        return layer;
      },
      getLayerBounds: (layerPath: string) => {
        const layer = api.maps[get().mapId].layer.getGeoviewLayerById(layerPath.split('/')[0]);
        if (layer) {
          const bounds = layer.calculateBounds(layerPath);
          if (bounds) return bounds;
        }
        return undefined;
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
        // keep track of highlighted layer to set active button state because there can only be one highlighted layer at a time
        const currentHighlight = get().layerState.highlightedLayer;
        let tempLayerPath = layerPath;

        // TODO: keep reference to geoview map instance in the store or keep accessing with api - discussion
        if (currentHighlight === tempLayerPath) {
          api.maps[get().mapId].layer.removeHighlightLayer();
          tempLayerPath = '';
        } else {
          api.maps[get().mapId].layer.highlightLayer(tempLayerPath);
          const layer = findLayerByPath(get().layerState.legendLayers, layerPath);
          const { bounds } = layer as TypeLegendLayer;
          if (bounds && bounds[0] !== Infinity) get().mapState.actions.highlightBBox(bounds, true);
        }
        set({
          layerState: {
            ...get().layerState,
            highlightedLayer: tempLayerPath,
          },
        });
      },
      setSelectedLayerPath: (layerPath: string) => {
        const curLayers = get().layerState.legendLayers;
        const layer = findLayerByPath(curLayers, layerPath);
        set({
          layerState: {
            ...get().layerState,
            selectedLayerPath: layerPath,
            selectedLayer: layer as TypeLegendLayer,
          },
        });
      },
      setLayerOpacity: (layerPath: string, opacity: number) => {
        const curLayers = get().layerState.legendLayers;
        const layer = findLayerByPath(curLayers, layerPath);
        if (layer) {
          layer.opacity = opacity;

          const { mapId } = get();
          setOpacityInLayerAndChildren(layer, opacity, mapId);
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
        setVisibilityInLayerAndItems(layer as TypeLegendLayer, layer?.isVisible === 'no' ? 'yes' : 'no');
        // TODO: keep reference to geoview map instance in the store or keep accessing with api - discussion
        //! may not work with group items ... see if Yves work will make this simplier
        api.maps[get().mapId].layer.geoviewLayer(layerPath).setVisible(layer?.isVisible !== 'no', layerPath);

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

              if (item.isVisible === 'yes' && layer.isVisible === 'no') {
                layer.isVisible = 'yes';
              }

              // assign value to registered layer. This is use by applyFilter function to set visibility
              // TODO: check if we need to refactor to centralize attribute setting....
              // TODO: know issue when we toggle a default visibility item https://github.com/Canadian-Geospatial-Platform/geoview/issues/1564
              if (registeredLayer.style![geometryType]?.styleType === 'classBreaks') {
                (registeredLayer.style![geometryType]! as TypeClassBreakStyleConfig).classBreakStyleInfo[index].visible = item.isVisible;
              } else if (registeredLayer.style![geometryType]?.styleType === 'uniqueValue') {
                (registeredLayer.style![geometryType]! as TypeUniqueValueStyleConfig).uniqueValueStyleInfo[index].visible = item.isVisible;
              }
            }
          });
          // 'always' is neither 'yes', nor 'no'.
          const allItemsUnchecked = _.every(layer.items, (i) => ['no', 'always'].includes(i.isVisible!));
          if (allItemsUnchecked && layer.isVisible !== 'always') {
            layer.isVisible = 'no';
          }

          // apply filter to layer
          (api.maps[get().mapId].layer.geoviewLayer(layerPath) as AbstractGeoViewVector).applyViewFilter('');
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

              // assign value to registered layer. This is use by applyFilter function to set visibility
              // TODO: check if we need to refactor to centralize attribute setting....
              if (registeredLayer.style && registeredLayer.style![item.geometryType]?.styleType === 'classBreaks') {
                (registeredLayer.style![item.geometryType]! as TypeClassBreakStyleConfig).classBreakStyleInfo[index].visible =
                  item.isVisible;
              } else if (registeredLayer.style![item.geometryType]?.styleType === 'uniqueValue') {
                (registeredLayer.style![item.geometryType]! as TypeUniqueValueStyleConfig).uniqueValueStyleInfo[index].visible =
                  item.isVisible;
              }
            }
          });
          // TODO: this visibility flag for the store should we use to show/hide icon on the layer item list (if always in child, no toggle visibility)
          // This should be set at init of layer
          if (layer.isVisible !== 'always') {
            layer.isVisible = visibility;
          }
        }

        set({
          layerState: {
            ...get().layerState,
            legendLayers: [...curLayers],
          },
        });

        // TODO: keep reference to geoview map instance in the store or keep accessing with api - discussion
        // ! try to make reusable store actions....
        // ! we can have always item.... we cannot set visibility so if present we will need to trap. Need more use case
        // ! create a function setItemVisibility called with layer path and this function set the registered layer (from store values) then apply the filter.
        (api.maps[get().mapId].layer.geoviewLayer(layerPath) as AbstractGeoViewVector).applyViewFilter(layerPath);
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
        const options: FitOptions = { padding: OL_ZOOM_PADDING, duration: OL_ZOOM_DURATION };
        const layer = findLayerByPath(get().layerState.legendLayers, layerPath);
        const { bounds } = layer as TypeLegendLayer;
        if (bounds) MapEventProcessor.zoomToExtent(get().mapId, bounds, options);
      },
      reorderLayer: (startIndex: number, endIndex: number, layerPath: string) => {
        const curLayers = get().layerState.legendLayers;
        const reorderedLayers = reorderSingleLayer(curLayers, startIndex, endIndex, layerPath);
        set({
          layerState: {
            ...get().layerState,
            legendLayers: [...reorderedLayers],
          },
        });
      },
    },
  } as ILayerState;

  return init;
}

// private functions

// function set visibility in layer and its items
function setVisibilityInLayerAndItems(layer: TypeLegendLayer, visibility: 'yes' | 'no') {
  if (layer.isVisible === 'always') {
    return;
  }
  _.set(layer, 'isVisible', visibility);
  _.each(layer.items, (item) => {
    if (item.isVisible !== 'always') {
      _.set(item, 'isVisible', visibility);
    }
  });
  if (layer.children && layer.children.length > 0) {
    _.each(layer.children, (child) => {
      setVisibilityInLayerAndItems(child, visibility);
    });
  }
}

function setOpacityInLayerAndChildren(layer: TypeLegendLayer, opacity: number, mapId: string, isChild = false) {
  _.set(layer, 'opacity', opacity);
  api.maps[mapId].layer.geoviewLayer(layer.layerPath).setOpacity(opacity, layer.layerPath);
  if (isChild) {
    _.set(layer, 'opacityFromParent', opacity);
  }
  if (layer.children && layer.children.length > 0) {
    _.each(layer.children, (child) => {
      setOpacityInLayerAndChildren(child, opacity, mapId, true);
    });
  }
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

function reorderSingleLayer(collection: TypeLegendLayer[], startIndex: number, endIndex: number, layerPath: string): TypeLegendLayer[] {
  let layerFound = false;

  function findLayerAndSortIt(startingCollection: TypeLegendLayer[]) {
    if (layerFound) {
      return;
    }
    layerFound = startingCollection.find((lyr) => lyr.layerPath === layerPath) !== undefined;

    if (layerFound) {
      const [removed] = startingCollection.splice(startIndex, 1);
      startingCollection.splice(endIndex, 0, removed);

      /* eslint-disable no-param-reassign */
      for (let i = 0; i < startingCollection.length; i++) {
        startingCollection[i].order = i;
      }

      return;
    }

    // if not found at this level, lets find it in children
    for (let i = 0; i < startingCollection.length; i++) {
      if (startingCollection[i].children.length > 0) {
        findLayerAndSortIt(startingCollection[i].children);
      }
    }
  }

  findLayerAndSortIt(collection);

  return collection;
}

// **********************************************************
// Layer state selectors
// **********************************************************
export const useLayerBounds = () => useStore(useGeoViewStore(), (state) => state.layerState.legendLayers);
export const useLayerHighlightedLayer = () => useStore(useGeoViewStore(), (state) => state.layerState.highlightedLayer);
export const useLayersList = () => useStore(useGeoViewStore(), (state) => state.layerState.legendLayers);
export const useLayerSelectedLayer = () => useStore(useGeoViewStore(), (state) => state.layerState.selectedLayer);
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
