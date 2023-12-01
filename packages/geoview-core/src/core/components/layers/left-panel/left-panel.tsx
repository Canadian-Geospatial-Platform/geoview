import { Dispatch, SetStateAction, useEffect } from 'react';
import { useLayerStoreActions, useLayersList, useSelectedLayer } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { LayersList } from './layers-list';

interface LeftPanelProps {
  setIsLayersListPanelVisible: Dispatch<SetStateAction<boolean>>;
}

export function LeftPanel({ setIsLayersListPanelVisible }: LeftPanelProps): JSX.Element {
  // get from the store
  const legendLayers = useLayersList(); // get store value(s)
  const { setSelectedLayerPath } = useLayerStoreActions();
  const selectedLayer = useSelectedLayer(); // get store value

  useEffect(() => {
    if (!selectedLayer) {
      const validFirstLayer = legendLayers.find((layer) => !(layer.layerStatus === 'error' || layer.layerStatus === 'loading'));
      if (validFirstLayer) {
        setSelectedLayerPath(validFirstLayer.layerPath);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <LayersList layersList={legendLayers} depth={0} setIsLayersListPanelVisible={setIsLayersListPanelVisible} />;
}
