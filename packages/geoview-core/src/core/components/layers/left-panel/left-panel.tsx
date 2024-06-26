import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import {
  useLayerDisplayState,
  useLayerLegendLayers,
  useLayerStoreActions,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useMapOrderedLayerInfo, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useGeoViewConfig } from '@/core/stores/geoview-store';
import { LayersList } from './layers-list';
import { AddNewLayer } from './add-new-layer/add-new-layer';
import { logger } from '@/core/utils/logger';
import { TypeLegendLayer } from '@/core/components/layers/types';

interface LeftPanelProps {
  setIsLayersListPanelVisible: Dispatch<SetStateAction<boolean>>;
  isLayoutEnlarged: boolean;
}

export function LeftPanel({ setIsLayersListPanelVisible, isLayoutEnlarged }: LeftPanelProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/left-panel/left-panel');

  // get from the store
  const legendLayers = useLayerLegendLayers();
  const displayState = useLayerDisplayState();
  const orderedLayerInfo = useMapOrderedLayerInfo();
  const mapConfig = useGeoViewConfig();

  const { getIndexFromOrderedLayerInfo } = useMapStoreActions();
  const { setDisplayState } = useLayerStoreActions();
  const [orderedLegendLayers, setOrderedLegendLayers] = useState<TypeLegendLayer[]>([]);

  useEffect(() => {
    const sortedLayers = legendLayers.sort((a, b) =>
      getIndexFromOrderedLayerInfo(a.layerPath) > getIndexFromOrderedLayerInfo(b.layerPath) ? 1 : -1
    );
    setOrderedLegendLayers(sortedLayers);
  }, [orderedLayerInfo, legendLayers, getIndexFromOrderedLayerInfo]);

  useEffect(() => {
    /**
     * NOTE: 2 Scenarios exist now, when no layers exist on map and
     * when layers exist but legend doesn't exist in map configuration.
     * then only we need to show `add` layer component.
     */
    if (displayState !== 'add' && !legendLayers.length && mapConfig?.footerBar?.tabs.core.includes('legend')) {
      setDisplayState('add');
    }
  }, [displayState, legendLayers, setDisplayState, mapConfig]);

  if (displayState === 'add') {
    return <AddNewLayer />;
  }
  return (
    <LayersList
      layersList={orderedLegendLayers}
      depth={0}
      setIsLayersListPanelVisible={setIsLayersListPanelVisible}
      isLayoutEnlarged={isLayoutEnlarged}
    />
  );
}
