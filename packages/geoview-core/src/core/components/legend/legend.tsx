import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material';

import { ToggleAll } from '@/core/components/toggle-all/toggle-all';
import { Box, List, Typography } from '@/ui';
import { logger } from '@/core/utils/logger';

import { getSxClassesMain, getSxClasses } from './legend-styles';
import { LegendLayer } from './legend-layer';
import { LegendFullscreen, LegendFullscreenButton } from './legend-fullscreen';
import { CONTAINER_TYPE } from '@/core/utils/constant';
import type { TypeContainerBox } from '@/core/types/global-types';
import { useEventListener } from '@/core/components/common/hooks/use-event-listener';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { useStoreLayerTopLevelLayerPaths } from '@/core/stores/store-interface-and-intial-values/layer-state';

interface LegendType {
  containerType: TypeContainerBox;
}

// Constant style outside of render (styles)
const styles = {
  noLayersContainer: {
    padding: '2rem',
    margin: '2rem',
    width: '100%',
    textAlign: 'center',
    height: 'fit-content',
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

/** Main container styles for the legend component. */
const sxClassesMain = getSxClassesMain();

export function Legend({ containerType }: LegendType): JSX.Element | null {
  logger.logTraceRender('components/legend/legend');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const memoSxClasses = useMemo(() => {
    logger.logTraceUseMemo('LEGEND - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  // State
  const [formattedLegendLayerList, setFormattedLegendLayersList] = useState<string[][]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const fullScreenBtnRef = useRef<HTMLButtonElement>(null);

  // Store
  const mapId = useStoreGeoViewMapId();
  const layerPaths = useStoreLayerTopLevelLayerPaths();

  // Memoize breakpoint values
  const memoBreakpoints = useMemo(() => {
    // Log
    logger.logTraceUseMemo('LEGEND - breakpoints', theme.breakpoints.values);

    return {
      sm: theme.breakpoints.values.sm,
      md: theme.breakpoints.values.md,
      lg: theme.breakpoints.values.lg,
    };
  }, [theme.breakpoints.values]);

  /**
   * Get the size of list based on window size.
   */
  const getLegendLayerListSize = useCallback(() => {
    if (containerType === CONTAINER_TYPE.APP_BAR) return 1;

    const { innerWidth } = window;
    if (innerWidth < memoBreakpoints.sm) return 1;
    if (innerWidth < memoBreakpoints.md) return 2;
    if (innerWidth < memoBreakpoints.lg) return 3;
    return 4;
  }, [memoBreakpoints, containerType]);

  /**
   * Transform the list of the legends into subsets of lists.
   * it will return subsets of lists with pattern:- [[0,4,8],[1,5,9],[2,6],[3,7] ]
   * This way we can layout the legends into column wraps.
   * @param paths - Array of layer paths.
   * @returns List of array of layer paths
   */
  const updateLegendLayerListByWindowSize = useCallback(
    (paths: string[]): void => {
      const arrSize = getLegendLayerListSize();
      const list = Array.from({ length: arrSize }, () => []) as Array<string[]>;

      paths.forEach((layerPath, index) => {
        list[index % arrSize].push(layerPath);
      });

      // Format the list only if there is layers
      setFormattedLegendLayersList(paths.length === 0 ? [] : list);
    },
    [getLegendLayerListSize]
  );

  // Memoize the window resize handler and use the hook to add listener to avoid many creation
  const handleWindowResize = useCallback(() => {
    // Update the layer list based on window size
    updateLegendLayerListByWindowSize(layerPaths);
  }, [layerPaths, updateLegendLayerListByWindowSize]);

  // Wire a handler using a custom hook on the window resize event
  useEventListener<Window>('resize', handleWindowResize, window);

  // Handle initial layer setup
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LEGEND - layer setup', layerPaths);

    // Update the layer list based on window size
    updateLegendLayerListByWindowSize(layerPaths);
  }, [layerPaths, updateLegendLayerListByWindowSize]);

  // Memoize the no layers content
  const memoNoLayersContent = useMemo(() => {
    // Log
    logger.logTraceUseMemo('components/legend - noLayersContent');

    return (
      <Box sx={styles.noLayersContainer}>
        <Typography variant="h3" gutterBottom sx={memoSxClasses.legendInstructionsTitle}>
          {t('legend.noLayersAdded')}
        </Typography>
        <Typography component="p" sx={memoSxClasses.legendInstructionsBody}>
          {t('legend.noLayersAddedDescription')}
        </Typography>
      </Box>
    );
  }, [t, memoSxClasses]);

  // Memoize the rendered content based on whether there are legend layers
  const memoContent = useMemo(() => {
    // Log
    logger.logTraceUseMemo('components/legend - content', formattedLegendLayerList.length);

    if (!formattedLegendLayerList.length) {
      return memoNoLayersContent;
    }

    return formattedLegendLayerList.map((paths, idx) => (
      <List
        className="legendList"
        // eslint-disable-next-line react/no-array-index-key
        key={`${idx}`}
        sx={{
          width: containerType === CONTAINER_TYPE.APP_BAR ? responsiveWidths.full : responsiveWidths.responsive,
          ...memoSxClasses.legendList,
        }}
      >
        {paths.map((layerPath) => (
          <LegendLayer layerPath={layerPath} key={layerPath} showControls={true} containerType={containerType} />
        ))}
      </List>
    ));
  }, [formattedLegendLayerList, memoNoLayersContent, containerType, memoSxClasses]);

  // TODO: CLEANUP - Remove the commented code, we're trying to not unmount the Legend panel anymore to check performance 2026-04-07
  // Early return with empty fragment if not the active tab
  // if (activeFooterBarTab.tabId !== 'legend' && activeAppBarTab.tabId !== 'legend') return null;

  return (
    <>
      <LegendFullscreen
        layerPaths={layerPaths}
        mapId={mapId}
        containerType={containerType}
        isOpen={isFullScreen}
        onClose={() => setIsFullScreen(false)}
        buttonRef={fullScreenBtnRef}
      />

      <Box sx={memoSxClasses.toggleBar}>
        <ToggleAll containerType={containerType} source="legend" />
        <LegendFullscreenButton containerType={containerType} onClick={() => setIsFullScreen(true)} buttonRef={fullScreenBtnRef} />
      </Box>
      <Box
        sx={{ background: theme.palette.geoViewColor.bgColor.main, ...sxClassesMain.container }}
        id={`${mapId}-${containerType}-legendContainer`}
      >
        <Box sx={styles.flexContainer}>{memoContent}</Box>
      </Box>
    </>
  );
}
