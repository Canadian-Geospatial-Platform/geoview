import { useEffect } from 'react';
import { useLayerDisplayState, useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useGeoViewConfig } from '@/core/stores/geoview-store';
import { useDebounceLayerLegendLayers } from '@/core/components/legend/hooks/use-legend-debounce';
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
  const legendLayers = useDebounceLayerLegendLayers();
  const displayState = useLayerDisplayState();
  const mapConfig = useGeoViewConfig();

  const { setDisplayState } = useLayerStoreActions();

  useEffect(() => {
    /**
     * NOTE: 2 Scenarios exist now, when no layers exist on map and
     * when layers exist but legend doesn't exist in map configuration.
     * then only we need to show `add` layer component.
     */
    if (displayState !== 'add' && !legendLayers.length && mapConfig?.footerBar?.tabs.core.includes('legend')) {
      setDisplayState('add');
    }
  }, [displayState, legendLayers.length, mapConfig?.footerBar?.tabs.core, setDisplayState]);

  if (displayState === 'add') {
    return <AddNewLayer />;
  }

  return (
    <LayersList layersList={legendLayers} depth={0} showLayerDetailsPanel={showLayerDetailsPanel} isLayoutEnlarged={isLayoutEnlarged} />
  );
}
