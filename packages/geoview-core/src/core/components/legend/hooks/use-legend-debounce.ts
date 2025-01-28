import { useLayerLegendLayers } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useMapOrderedLayerInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useDebounceValue } from '@/core/components/common/use-debounce-value';

export function useDebounceMapOrderedLayerInfo(delay = 500) {
  const orderedLayerInfo = useMapOrderedLayerInfo();
  return useDebounceValue(orderedLayerInfo, delay);
}

export function useDebounceLayerLegendLayers(delay = 500) {
  const legendLayers = useLayerLegendLayers();
  return useDebounceValue(legendLayers, delay);
}
