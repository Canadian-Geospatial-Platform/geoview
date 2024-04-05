import { useTheme } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Paper, Typography } from '@/ui';
import { useLayerLegendLayers, useMapVisibleLayers, useLayerStoreActions, useGeoViewMapId } from '@/core/stores/';
import { logger } from '@/core/utils/logger';

import { getSxClasses } from './legend-styles';
import { LegendLayer } from './legend-layer';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { useFooterPanelHeight } from '@/core/components/common';

interface LegendType {
  fullWidth?: boolean;
}

export function Legend({ fullWidth }: LegendType): JSX.Element {
  // Log
  logger.logTraceRender('components/legend/legend');

  const mapId = useGeoViewMapId();
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state
  const [legendLayers, setLegendLayers] = useState<TypeLegendLayer[]>([]);
  const [formattedLegendLayerList, setFormattedLegendLayersList] = useState<TypeLegendLayer[][]>([]);

  // store state
  const visibleLayers = useMapVisibleLayers();
  const layersList = useLayerLegendLayers();
  const { getLayer } = useLayerStoreActions();

  // Custom hook for calculating the height of footer panel
  const { leftPanelRef } = useFooterPanelHeight({ footerPanelTab: 'legend' });

  /**
   * Get the size of list based on window size.
   */
  const getLegendLayerListSize = useMemo(() => {
    return () => {
      let size = 4;
      if (window.innerWidth < theme.breakpoints.values.sm) {
        size = 1;
      } else if (window.innerWidth < theme.breakpoints.values.md) {
        size = 2;
      } else if (window.innerWidth < theme.breakpoints.values.lg) {
        size = 3;
      }
      return size;
    };
  }, [theme.breakpoints.values.lg, theme.breakpoints.values.md, theme.breakpoints.values.sm]);

  /**
   * Transform the list of the legends into subsets of lists.
   * it will return subsets of lists with pattern:- [[0,4,8],[1,5,9],[2,6],[3,7] ]
   * This way we can layout the legends into column wraps.
   * @param {TypeLegendLayer} layers array of layers.
   * @returns List of array of layers
   */
  const updateLegendLayerListByWindowSize = (layers: TypeLegendLayer[]): void => {
    const arrSize = getLegendLayerListSize();

    // create list of arrays based on size of the window.
    const list = Array.from({ length: arrSize }, () => []) as Array<TypeLegendLayer[]>;
    layers.forEach((layer, index) => {
      const idx = index % arrSize;
      list[idx].push(layer);
    });
    setFormattedLegendLayersList(list);
  };

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LEGEND - visibleLayers', visibleLayers.length, visibleLayers);
    // Loop on the visible layers to retrieve the valid TypeLegendLayer objects
    const parentPaths: string[] = [];

    const layers = visibleLayers
      .map((layerPath) => {
        const pathStart = layerPath!.split('/')[0];
        if (!parentPaths.includes(pathStart)) {
          parentPaths.push(pathStart);
          return getLayer(layerPath!);
        }
        return undefined;
      })
      .filter((layer) => layer !== undefined) as TypeLegendLayer[];

    setLegendLayers(layers);
    updateLegendLayerListByWindowSize(layers);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleLayers, layersList]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LEGEND - legendLayers', legendLayers);

    // update subsets of list when window size updated.
    const formatLegendLayerList = (): void => {
      // Log
      logger.logTraceCore('LEGEND - window resize event');

      updateLegendLayerListByWindowSize(legendLayers);
    };
    window.addEventListener('resize', formatLegendLayerList);
    return () => window.removeEventListener('resize', formatLegendLayerList);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legendLayers]);

  return (
    <Box sx={sxClasses.container} {...(!fullWidth && { ref: leftPanelRef })} id={`${mapId}-legendContainer`}>
      <Box display="flex" flexDirection="row" flexWrap="wrap">
        {!!legendLayers.length &&
          formattedLegendLayerList.map((layers, idx) => {
            return (
              <Box
                key={`${idx.toString()}`}
                width={fullWidth ? { xs: '100%' } : { xs: '100%', sm: '50%', md: '33.33%', lg: '25%', xl: '25%' }}
                sx={{ paddingRight: '0.65rem' }}
              >
                {layers.map((layer) => {
                  return <LegendLayer layer={layer} key={layer.layerPath} />;
                })}
              </Box>
            );
          })}
        {!legendLayers.length && (
          <Paper sx={{ padding: '2rem', width: '100%' }}>
            <Typography variant="h3" gutterBottom sx={sxClasses.legendInstructionsTitle}>
              {t('legend.legendInstructions')}
            </Typography>
            <Typography component="p" sx={sxClasses.legendInstructionsBody}>
              {t('legend.legendInstructions')}
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}

Legend.defaultProps = {
  fullWidth: false,
};
