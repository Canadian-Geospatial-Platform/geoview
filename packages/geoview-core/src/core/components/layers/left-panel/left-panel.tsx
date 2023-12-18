import { Dispatch, SetStateAction, useEffect } from 'react';
import { useLayerStoreActions, useLayersList, useSelectedLayer } from '@/core/stores/';
import { LayersList } from './layers-list';

interface LeftPanelProps {
  setIsLayersListPanelVisible: Dispatch<SetStateAction<boolean>>;
}

export function LeftPanel({ setIsLayersListPanelVisible }: LeftPanelProps): JSX.Element {
  // get from the store
  const legendLayers = useLayersList();
  const { setSelectedLayerPath } = useLayerStoreActions();
  const selectedLayer = useSelectedLayer();

  useEffect(() => {
    if (!selectedLayer) {
      const validFirstLayer = legendLayers.find((layer) => !(layer.layerStatus === 'error' || layer.layerStatus === 'loading'));
      if (validFirstLayer) {
        if (validFirstLayer?.children && validFirstLayer.children.length > 0) {
          setSelectedLayerPath(validFirstLayer.children[0].layerPath);
        } else {
          setSelectedLayerPath(validFirstLayer.layerPath);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LayersList parentLayerPath="none" layersList={legendLayers} depth={0} setIsLayersListPanelVisible={setIsLayersListPanelVisible} />
  );
}
