import { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { SingleLayer } from './single-layer';
import { getSxClasses } from './left-panel-styles';
import { Box } from '@/ui';
import { useGeoViewMapId, useLayerStoreActions, useSelectorLayerPathOrder } from '@/core/stores';
import { logger } from '@/core/utils/logger';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { TABS } from '@/core/utils/constant';

interface LayerListProps {
  depth: number;
  layersList: TypeLegendLayer[];
  showLayerDetailsPanel: (layerId: string) => void;
  isLayoutEnlarged: boolean;
}

export function LayersList({ layersList, showLayerDetailsPanel, isLayoutEnlarged, depth }: LayerListProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/left-panel/layers-list');

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

  const textToSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
      .replace(/\s+/g, '-'); // Replace spaces with hyphens
  };

  // ? I doubt we want to define an explicit type for style properties?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getListClass = (): any => {
    if (depth === 0) {
      return sxClasses.list;
    }
    if (depth % 2) {
      return sxClasses.evenDepthList;
    }
    return sxClasses.oddDepthList;
  };

  const legendItems = sortedLayers.map((details, index) => {
    const isFirst = index === 0;
    const isLast = index === sortedLayers.length - 1;

    return (
      <SingleLayer
        key={textToSlug(`layerKey-${index}-${details.layerPath}`)}
        depth={depth}
        layer={{ ...details, layerId: `${mapId}-${TABS.LAYERS}-${details.layerPath}` }}
        showLayerDetailsPanel={showLayerDetailsPanel}
        index={index}
        isFirst={isFirst}
        isLast={isLast}
        isLayoutEnlarged={isLayoutEnlarged}
      />
    );
  });

  return <Box sx={getListClass()}>{legendItems}</Box>;
}
