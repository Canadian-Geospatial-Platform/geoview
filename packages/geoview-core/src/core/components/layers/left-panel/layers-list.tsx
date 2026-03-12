import { useCallback, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { List } from '@/ui';
import { logger } from '@/core/utils/logger';
import type { TypeLegendLayer } from '@/core/components/layers/types';
import { SingleLayer } from './single-layer';
import { getSxClasses } from './left-panel-styles';
import type { TypeContainerBox } from '@/core/types/global-types';
import { useMapOrderedLayers } from '@/core/stores/store-interface-and-intial-values/map-state';

interface LayerListProps {
  depth: number;
  layersList: TypeLegendLayer[];
  showLayerDetailsPanel: (layerId: string) => void;
  isLayoutEnlarged: boolean;
  containerType: TypeContainerBox;
}

export function LayersList({ layersList, showLayerDetailsPanel, isLayoutEnlarged, depth, containerType }: LayerListProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/left-panel/layers-list', `Count ${layersList.length}`);

  // Hook
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Store
  const layerPathOrder = useMapOrderedLayers();

  // ? I doubt we want to define an explicit type for style properties?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getListClass = useCallback((): any => {
    if (depth === 0) {
      return sxClasses.list;
    }
    return sxClasses.listSubitem;
  }, [depth, sxClasses]);

  // Memoize the legend items
  const memoLegendItems = useMemo(() => {
    // Log
    logger.logTraceUseMemo('LAYERS-LIST - memoLegendItems', layersList);

    const sortedLayers = layersList.sort((a, b) => {
      return layerPathOrder.indexOf(a.layerPath) - layerPathOrder.indexOf(b.layerPath);
    });

    return sortedLayers.map((layer, index) => {
      const isFirst = index === 0;
      const isLast = index === sortedLayers.length - 1;

      return (
        <SingleLayer
          key={layer.layerPath}
          layerPath={layer.layerPath}
          depth={depth}
          showLayerDetailsPanel={showLayerDetailsPanel}
          isFirst={isFirst}
          isLast={isLast}
          isLayoutEnlarged={isLayoutEnlarged}
          containerType={containerType}
        />
      );
    });
  }, [depth, isLayoutEnlarged, showLayerDetailsPanel, layersList, layerPathOrder, containerType]);

  return <List sx={getListClass()}>{memoLegendItems}</List>;
}
