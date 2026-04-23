import { useCallback, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { List } from '@/ui';
import { logger } from '@/core/utils/logger';
import { SingleLayer } from './single-layer';
import { getSxClasses } from './left-panel-styles';
import type { TypeContainerBox } from '@/core/types/global-types';
import { useStoreLayerOrderedLayerPaths } from '@/core/stores/store-interface-and-intial-values/layer-state';

interface LayerListProps {
  depth: number;
  layerPaths: string[];
  showLayerDetailsPanel: (layerId: string) => void;
  isLayoutEnlarged: boolean;
  containerType: TypeContainerBox;
}

export function LayersList({ layerPaths, showLayerDetailsPanel, isLayoutEnlarged, depth, containerType }: LayerListProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/left-panel/layers-list', `Count ${layerPaths.length}`);

  // Hook
  const theme = useTheme();
  const memoSxClasses = useMemo(() => {
    logger.logTraceUseMemo('LAYERS-LIST - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  // Store
  const layerPathOrder = useStoreLayerOrderedLayerPaths();

  // ? I doubt we want to define an explicit type for style properties?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getListClass = useCallback((): any => {
    if (depth === 0) {
      return memoSxClasses.list;
    }
    return memoSxClasses.listSubitem;
  }, [depth, memoSxClasses]);

  // Memoize the legend items
  const memoLegendItems = useMemo(() => {
    // Log
    logger.logTraceUseMemo('LAYERS-LIST - memoLegendItems', layerPaths);

    const sortedPaths = [...layerPaths].sort((a, b) => {
      return layerPathOrder.indexOf(a) - layerPathOrder.indexOf(b);
    });

    return sortedPaths.map((layerPath, index) => {
      const isFirst = index === 0;
      const isLast = index === sortedPaths.length - 1;

      return (
        <SingleLayer
          key={layerPath}
          layerPath={layerPath}
          depth={depth}
          showLayerDetailsPanel={showLayerDetailsPanel}
          isFirst={isFirst}
          isLast={isLast}
          isLayoutEnlarged={isLayoutEnlarged}
          containerType={containerType}
        />
      );
    });
  }, [depth, isLayoutEnlarged, showLayerDetailsPanel, layerPaths, layerPathOrder, containerType]);

  return <List sx={getListClass()}>{memoLegendItems}</List>;
}
