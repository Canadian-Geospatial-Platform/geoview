import { Dispatch, SetStateAction, useEffect } from 'react';
import {
  useLayerStoreActions,
  useLayersDisplayState,
  useLayersList,
  useSelectedLayer,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { LayersList } from './layers-list';
import { AddNewLayer } from './add-new-layer/add-new-layer';

interface LeftPanelProps {
  setIsLayersListPanelVisible: Dispatch<SetStateAction<boolean>>;
}

export function LeftPanel({ setIsLayersListPanelVisible }: LeftPanelProps): JSX.Element {
  // get from the store
  const legendLayers = useLayersList();
  const { setSelectedLayerPath } = useLayerStoreActions();
  const selectedLayer = useSelectedLayer();
  const displayState = useLayersDisplayState();

  useEffect(() => {
    if (!selectedLayer) {
      // TODO: Make this useEffect Async, when this useEffect is hit, the legenLayer is empty.
      setTimeout(() => {
        const validFirstLayer = legendLayers.find((layer) => !(layer.layerStatus === 'error' || layer.layerStatus === 'loading'));
        if (validFirstLayer) {
          setSelectedLayerPath(validFirstLayer.layerPath);
        }
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (displayState === 'add') {
    return <AddNewLayer />;
  }
  return (
    <LayersList parentLayerPath="none" layersList={legendLayers} depth={0} setIsLayersListPanelVisible={setIsLayersListPanelVisible} />
  );
}
