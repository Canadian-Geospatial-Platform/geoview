import { useLayerDisplayState, useLayerLegendLayers } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { Box } from '@/ui';
import { LayersList } from './layers-list';
import { ToggleAll } from '../../toggle-all/toggle-all';
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

  if (displayState === 'add') {
    return <AddNewLayer />;
  }

  return (
    <Box>
      <ToggleAll source="layers" />
      <LayersList layersList={legendLayers} depth={0} showLayerDetailsPanel={showLayerDetailsPanel} isLayoutEnlarged={isLayoutEnlarged} />
    </Box>
  );
}
