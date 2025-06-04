import { useEffect } from 'react';
import {
  useLayerDeleteInProgress,
  useLayerDisplayState,
  useLayerLegendLayers,
  useLayerStoreActions,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { LayersList } from './layers-list';
import { AddNewLayer } from './add-new-layer/add-new-layer';
import { logger } from '@/core/utils/logger';

interface LeftPanelProps {
  showLayerDetailsPanel: (layerId: string) => void;
  isLayoutEnlarged: boolean;
}

export function LeftPanel({ showLayerDetailsPanel, isLayoutEnlarged }: LeftPanelProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/left-panel/left-panel');

  // get from the store
  const legendLayers = useLayerLegendLayers();
  const displayState = useLayerDisplayState();
  const layerDeleteInProgress = useLayerDeleteInProgress();
  const { deleteLayer } = useLayerStoreActions();

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LEFT-PANEL - deleteLayer, displayState, layerDeleteInProgress');

    // Delete layer if layerDeleteInProgress is active and user clicks to a different tab.
    if (displayState !== 'remove' && layerDeleteInProgress) deleteLayer(layerDeleteInProgress);
  }, [deleteLayer, displayState, layerDeleteInProgress]);

  if (displayState === 'add') {
    return <AddNewLayer />;
  }

  return (
    <LayersList layersList={legendLayers} depth={0} showLayerDetailsPanel={showLayerDetailsPanel} isLayoutEnlarged={isLayoutEnlarged} />
  );
}
