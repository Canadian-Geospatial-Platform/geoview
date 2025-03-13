import { useCallback, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box } from '@/ui';
import { useGeoViewMapId, useLayerStoreActions, useSelectorLayerPathOrder } from '@/core/stores';
import { logger } from '@/core/utils/logger';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { TABS } from '@/core/utils/constant';
import { SingleLayer } from './single-layer';
import { getSxClasses } from './left-panel-styles';

interface LayerListProps {
  depth: number;
  layersList: TypeLegendLayer[];
  showLayerDetailsPanel: (layerId: string) => void;
  isLayoutEnlarged: boolean;
}

export function LayersList({ layersList, showLayerDetailsPanel, isLayoutEnlarged, depth }: LayerListProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/left-panel/layers-list', `Count ${layersList.length}`);

  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  const mapId = useGeoViewMapId();
  const layerPathOrder = useSelectorLayerPathOrder();
  const { sortLegendLayersChildren } = useLayerStoreActions();

  const sortedLayers = layersList.sort((a, b) => {
    return layerPathOrder.indexOf(a.layerPath) - layerPathOrder.indexOf(b.layerPath);
  });

  // TODO: Check - This sort should likely happen elsewhere than in a rendering component
  // TO.DOCONT: (the fact that the rendering component exists or not in the ui shouldn't have to do with the order state from store)
  sortLegendLayersChildren(sortedLayers);

  // ? I doubt we want to define an explicit type for style properties?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getListClass = useCallback((): any => {
    if (depth === 0) {
      return sxClasses.list;
    }
    if (depth % 2) {
      return sxClasses.evenDepthList;
    }
    return sxClasses.oddDepthList;
  }, [depth, sxClasses]);

  // Memoize the legend items
  const memoLegendItems = useMemo(() => {
    return sortedLayers.map((layer, index) => {
      const isFirst = index === 0;
      const isLast = index === sortedLayers.length - 1;

      // TODO: Check - What is this for!? Set the layerId
      // eslint-disable-next-line no-param-reassign
      layer.layerId = `${mapId}-${TABS.LAYERS}-${layer.layerPath}`;

      return (
        <SingleLayer
          key={layer.layerPath}
          layer={layer}
          depth={depth}
          showLayerDetailsPanel={showLayerDetailsPanel}
          isFirst={isFirst}
          isLast={isLast}
          isLayoutEnlarged={isLayoutEnlarged}
        />
      );
    });
  }, [depth, isLayoutEnlarged, mapId, showLayerDetailsPanel, sortedLayers]);

  return <Box sx={getListClass()}>{memoLegendItems}</Box>;
}
