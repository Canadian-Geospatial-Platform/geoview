import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useLayerDisplayState, useLayerLegendLayers, useMapOrderedLayerInfo, useMapStoreActions } from '@/core/stores';
import { LayersList } from './layers-list';
import { AddNewLayer } from './add-new-layer/add-new-layer';
import { logger } from '@/core/utils/logger';
import { TypeLegendLayer } from '../types';

interface LeftPanelProps {
  setIsLayersListPanelVisible: Dispatch<SetStateAction<boolean>>;
}

export function LeftPanel({ setIsLayersListPanelVisible }: LeftPanelProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/left-panel/left-panel');

  // get from the store
  const legendLayers = useLayerLegendLayers();
  const displayState = useLayerDisplayState();
  const orderedLayerInfo = useMapOrderedLayerInfo();
  const { getIndexFromOrderedLayerInfo } = useMapStoreActions();
  const [orderedLegendLayers, setOrderedLegendLayers] = useState<TypeLegendLayer[]>([]);

  useEffect(() => {
    const sortedLayers = legendLayers.sort((a, b) =>
      getIndexFromOrderedLayerInfo(a.layerPath) > getIndexFromOrderedLayerInfo(b.layerPath) ? 1 : -1
    );
    setOrderedLegendLayers(sortedLayers);
  }, [orderedLayerInfo, legendLayers, getIndexFromOrderedLayerInfo]);

  if (displayState === 'add') {
    return <AddNewLayer />;
  }
  return (
    <LayersList
      parentLayerPath="none"
      layersList={orderedLegendLayers}
      depth={0}
      setIsLayersListPanelVisible={setIsLayersListPanelVisible}
    />
  );
}
