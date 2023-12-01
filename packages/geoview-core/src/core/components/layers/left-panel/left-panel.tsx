import { Dispatch, SetStateAction, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';

import { SingleLayer } from './single-layer';
import { getSxClasses } from './left-panel-styles';
import { List } from '@/ui';
import { useLayerStoreActions, useLayersList, useSelectedLayer } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { LayersList } from './layers-list';

interface LeftPanelProps {
  setIsLayersListPanelVisible: Dispatch<SetStateAction<boolean>>;
}

export function LeftPanel({ setIsLayersListPanelVisible }: LeftPanelProps): JSX.Element {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

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


  return (
    <LayersList layersList={legendLayers} depth={0} setIsLayersListPanelVisible={setIsLayersListPanelVisible} />
  );
}
