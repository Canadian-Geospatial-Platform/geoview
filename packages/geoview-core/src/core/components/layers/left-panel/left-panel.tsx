import { useEffect, useState } from 'react';
import { useLayerLegendLayers } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useMapOrderedLayerInfo, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { LayersList } from './layers-list';
import { AddNewLayer } from './add-new-layer/add-new-layer';
import { logger } from '@/core/utils/logger';
import { TypeLegendLayer } from '@/core/components/layers/types';

interface LeftPanelProps {
  showLayerDetailsPanel: (layer: TypeLegendLayer) => void;
  isLayoutEnlarged: boolean;
}

export function LeftPanel({ showLayerDetailsPanel, isLayoutEnlarged }: LeftPanelProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/left-panel/left-panel');

  // get from the store
  const legendLayers = useLayerLegendLayers();
  const orderedLayerInfo = useMapOrderedLayerInfo();

  const { getIndexFromOrderedLayerInfo } = useMapStoreActions();
  const [orderedLegendLayers, setOrderedLegendLayers] = useState<TypeLegendLayer[]>([]);

  useEffect(() => {
    const sortedLayers = legendLayers.sort((a, b) =>
      getIndexFromOrderedLayerInfo(a.layerPath) > getIndexFromOrderedLayerInfo(b.layerPath) ? 1 : -1
    );
    setOrderedLegendLayers(sortedLayers);
  }, [orderedLayerInfo, legendLayers, getIndexFromOrderedLayerInfo]);

  if (legendLayers.length === 0) {
    return <AddNewLayer />;
  }

  return (
    <LayersList
      layersList={orderedLegendLayers}
      depth={0}
      showLayerDetailsPanel={showLayerDetailsPanel}
      isLayoutEnlarged={isLayoutEnlarged}
    />
  );
}
