import { useTheme } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@/ui';
import {
  useGeoViewMapId,
  useUIActiveAppBarTab,
  useUIActiveFooterBarTabId,
  useAppFullscreenActive,
  useUIFooterPanelResizeValue,
} from '@/core/stores/';
import { logger } from '@/core/utils/logger';

import { getSxClasses } from './legend-styles';
import { LegendLayer } from './legend-layer';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { CONTAINER_TYPE } from '@/core/utils/constant';
import { useDebounceLayerLegendLayers } from './hooks/use-legend-debounce';
import { useEventListener } from '../common/use-event-listener';

interface LegendType {
  fullWidth?: boolean;
  containerType?: 'appBar' | 'footerBar';
}

// Constant style outside of render (styles)
const styles = {
  noLayersContainer: {
    padding: '2rem',
    margin: '2rem',
    width: '100%',
    textAlign: 'center',
  },
  layerBox: {
    paddingRight: '0.65rem',
  },
  flexContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
} as const;

// Constant style outside of render (responsive widths)
const responsiveWidths = {
  full: { xs: '100%' },
  responsive: {
    xs: '100%',
    sm: '50%',
    md: '33.33%',
    lg: '25%',
    xl: '25%',
  },
} as const;

export function Legend({ fullWidth, containerType = 'footerBar' }: LegendType): JSX.Element | null {
  logger.logTraceRender('components/legend/legend');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const isMapFullScreen = useAppFullscreenActive();
  const footerPanelResizeValue = useUIFooterPanelResizeValue();
  const sxClasses = useMemo(
    () => getSxClasses(theme, isMapFullScreen, footerPanelResizeValue),
    [theme, isMapFullScreen, footerPanelResizeValue]
  );

  // State
  const [legendLayers, setLegendLayers] = useState<TypeLegendLayer[]>([]);
  const [formattedLegendLayerList, setFormattedLegendLayersList] = useState<TypeLegendLayer[][]>([]);

  // Store
  const mapId = useGeoViewMapId();
  const footerId = useUIActiveFooterBarTabId();
  const appBarId = useUIActiveAppBarTab();
  const layersList = useDebounceLayerLegendLayers();

  // Memoize breakpoint values
  const breakpoints = useMemo(
    () => ({
      sm: theme.breakpoints.values.sm,
      md: theme.breakpoints.values.md,
      lg: theme.breakpoints.values.lg,
    }),
    [theme.breakpoints.values.sm, theme.breakpoints.values.md, theme.breakpoints.values.lg]
  );

  /**
   * Get the size of list based on window size.
   */
  const getLegendLayerListSize = useCallback(() => {
    if (containerType === CONTAINER_TYPE.APP_BAR) return 1;

    const { innerWidth } = window;
    if (innerWidth < breakpoints.sm) return 1;
    if (innerWidth < breakpoints.md) return 2;
    if (innerWidth < breakpoints.lg) return 3;
    return 4;
  }, [breakpoints, containerType]);

  /**
   * Transform the list of the legends into subsets of lists.
   * it will return subsets of lists with pattern:- [[0,4,8],[1,5,9],[2,6],[3,7] ]
   * This way we can layout the legends into column wraps.
   * @param {TypeLegendLayer} layers array of layers.
   * @returns List of array of layers
   */
  const updateLegendLayerListByWindowSize = useCallback(
    (layers: TypeLegendLayer[]): void => {
      const arrSize = getLegendLayerListSize();
      const list = Array.from({ length: arrSize }, () => []) as Array<TypeLegendLayer[]>;

      layers.forEach((layer, index) => {
        list[index % arrSize].push(layer);
      });

      setFormattedLegendLayersList(list);
    },
    [getLegendLayerListSize]
  );

  // Memoize the window resize handler and use the hook to add listener to avoid many creation
  const formatLegendLayerList = useCallback(() => {
    logger.logTraceCore('LEGEND - window resize event');
    updateLegendLayerListByWindowSize(legendLayers);
  }, [legendLayers, updateLegendLayerListByWindowSize]);
  useEventListener<Window>('resize', formatLegendLayerList, window);

  // Handle initial layer setup (use a debounced 500ms layer)
  useEffect(() => {
    logger.logTraceUseEffect('LEGEND - layer setup', layersList);
    setLegendLayers(layersList);
    updateLegendLayerListByWindowSize(layersList);
  }, [layersList, updateLegendLayerListByWindowSize]);

  // Memoize the no layers content
  const noLayersContent = useMemo(
    () => (
      <Box sx={styles.noLayersContainer}>
        <Typography variant="h3" gutterBottom sx={sxClasses.legendInstructionsTitle}>
          {t('legend.noLayersAdded')}
        </Typography>
        <Typography component="p" sx={sxClasses.legendInstructionsBody}>
          {t('legend.noLayersAddedDescription')}
        </Typography>
      </Box>
    ),
    [sxClasses, t]
  );

  // Memoize the rendered content based on whether there are legend layers
  const content = useMemo(() => {
    if (!legendLayers.length) {
      return noLayersContent;
    }

    return formattedLegendLayerList.map((layers, idx) => (
      <Box key={`${idx.toString()}`} width={fullWidth ? responsiveWidths.full : responsiveWidths.responsive} sx={styles.layerBox}>
        {layers.map((layer) => (
          <LegendLayer layer={layer} key={layer.layerPath} />
        ))}
      </Box>
    ));
  }, [legendLayers.length, formattedLegendLayerList, fullWidth, noLayersContent]);

  // Early return with empty fragment if not the active tab
  if (footerId !== 'legend' && appBarId.tabGroup !== 'legend') return null;

  return (
    <Box sx={sxClasses.container} id={`${mapId}-${containerType}-legendContainer`}>
      <Box sx={styles.flexContainer}>{content}</Box>
    </Box>
  );
}
