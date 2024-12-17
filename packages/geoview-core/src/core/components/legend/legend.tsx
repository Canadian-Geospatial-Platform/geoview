import { useTheme } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@/ui';
import { useGeoViewMapId } from '@/core/stores/';
import { useLayerLegendLayers } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useMapOrderedLayerInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';

import { getSxClasses } from './legend-styles';
import { LegendLayer } from './legend-layer';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { useFooterPanelHeight } from '@/core/components/common';
import { CONTAINER_TYPE } from '@/core/utils/constant';

interface LegendType {
  fullWidth?: boolean;
  containerType?: 'appBar' | 'footerBar';
}

export function Legend({ fullWidth, containerType = 'footerBar' }: LegendType): JSX.Element {
  logger.logTraceRender('components/legend/legend');

  const mapId = useGeoViewMapId();
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state
  const [legendLayers, setLegendLayers] = useState<TypeLegendLayer[]>([]);
  const [formattedLegendLayerList, setFormattedLegendLayersList] = useState<TypeLegendLayer[][]>([]);

  // store state
  const orderedLayerInfo = useMapOrderedLayerInfo();
  const layersList = useLayerLegendLayers();

  // Custom hook for calculating the height of footer panel
  const { leftPanelRef } = useFooterPanelHeight({ footerPanelTab: 'legend' });

  /**
   * Get the size of list based on window size.
   */
  const getLegendLayerListSize = useMemo(() => {
    return () => {
      let size = 4;
      // when legend is loaded in appbar size will always be 1.
      if (containerType === CONTAINER_TYPE.APP_BAR) return 1;
      if (window.innerWidth < theme.breakpoints.values.sm) {
        size = 1;
      } else if (window.innerWidth < theme.breakpoints.values.md) {
        size = 2;
      } else if (window.innerWidth < theme.breakpoints.values.lg) {
        size = 3;
      }
      return size;
    };
  }, [theme.breakpoints.values.lg, theme.breakpoints.values.md, theme.breakpoints.values.sm, containerType]);

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
    logger.logTraceUseEffect('LEGEND - visibleLayers', orderedLayerInfo.length, orderedLayerInfo);
    setLegendLayers(layersList);
    updateLegendLayerListByWindowSize(layersList);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedLayerInfo, layersList]);

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
    <Box sx={sxClasses.container} {...(!fullWidth && { ref: leftPanelRef })} id={`${mapId}-${containerType}-legendContainer`}>
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

        {/* Show legend Instructions when no layer found. */}
        {!legendLayers.length && (
          <Box sx={{ padding: '2rem', margin: '2rem', width: '100%', textAlign: 'center' }}>
            <Typography variant="h3" gutterBottom sx={sxClasses.legendInstructionsTitle}>
              {t('legend.noLayersAdded')}
            </Typography>
            <Typography component="p" sx={sxClasses.legendInstructionsBody}>
              {t('legend.noLayersAddedDescription')}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
