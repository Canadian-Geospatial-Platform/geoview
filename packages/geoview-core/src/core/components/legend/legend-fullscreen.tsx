import { useTheme } from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, List, Typography, Button, FullscreenIcon } from '@/ui';
import { logger } from '@/core/utils/logger';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

import { getSxClasses } from './legend-styles';
import { LegendLayer } from './legend-layer';
import type { TypeLegendLayer } from '@/core/components/layers/types';
import { CONTAINER_TYPE } from '@/core/utils/constant';
import type { TypeContainerBox } from '@/core/types/global-types';
import { useEventListener } from '@/core/components/common/hooks/use-event-listener';
import { FullScreenDialog } from '@/core/components/common/full-screen-dialog';

interface LegendFullscreenProps {
  layersList: TypeLegendLayer[];
  mapId: string;
  containerType: TypeContainerBox;
  isOpen: boolean;
  onClose: () => void;
}

interface FullscreenButtonProps {
  containerType: TypeContainerBox;
  onClick: () => void;
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
} as const;

// Constant style outside of render (responsive widths)
const responsiveWidths = {
  responsive: {
    xs: '100%',
    sm: '50%',
    md: '33.33%',
    lg: '25%',
    xl: '25%',
  },
} as const;

export function FullscreenButton({ containerType, onClick }: FullscreenButtonProps): JSX.Element | null {
  const { t } = useTranslation<string>();

  // Only show in app bar
  if (containerType !== CONTAINER_TYPE.APP_BAR) return null;

  return (
    <Button
      type="icon"
      size="small"
      onClick={onClick}
      tooltip={t('general.openFullscreen')!}
      className="buttonOutline"
      sx={{ borderRadius: '50%', minWidth: 'auto', margin: '0px 8px 8px 8px' }}
    >
      <FullscreenIcon />
    </Button>
  );
}

export function LegendFullscreen({ layersList, mapId, containerType, isOpen, onClose }: LegendFullscreenProps): JSX.Element {
  logger.logTraceRender('components/legend/legend-fullscreen');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Refs
  const fullScreenBtnRef = useRef<HTMLButtonElement>(null);

  // State
  const [fullscreenLegendLayerList, setFullscreenLegendLayersList] = useState<TypeLegendLayer[][]>([]);
  const [, setSavedCollapseState] = useState<Record<string, boolean>>({});

  // Memoize breakpoint values
  const breakpoints = useMemo(() => {
    // Log
    logger.logTraceUseMemo('LEGEND FULLSCREEN - breakpoints', theme.breakpoints.values);

    return {
      sm: theme.breakpoints.values.sm,
      md: theme.breakpoints.values.md,
      lg: theme.breakpoints.values.lg,
    };
  }, [theme.breakpoints.values]);

  /**
   * Get the size of list based on window size for fullscreen mode.
   */
  const getFullscreenLayerListSize = useCallback(() => {
    const { innerWidth } = window;
    if (innerWidth < breakpoints.sm) return 1;
    if (innerWidth < breakpoints.md) return 2;
    if (innerWidth < breakpoints.lg) return 3;
    return 4;
  }, [breakpoints]);

  /**
   * Transform the list of the legends into subsets for fullscreen display.
   * @param {TypeLegendLayer} layers array of layers.
   * @returns List of array of layers
   */
  const updateFullscreenLayerListByWindowSize = useCallback(
    (layers: TypeLegendLayer[]): void => {
      const arrSize = getFullscreenLayerListSize();
      const list = Array.from({ length: arrSize }, () => []) as Array<TypeLegendLayer[]>;

      layers.forEach((layer, index) => {
        list[index % arrSize].push(layer);
      });

      // Format the list only if there is layers
      setFullscreenLegendLayersList(layers.length === 0 ? [] : list);
    },
    [getFullscreenLayerListSize]
  );

  // Memoize the window resize handler and use the hook to add listener to avoid many creation
  const handleWindowResize = useCallback(() => {
    // Log
    logger.logTraceUseCallback('LEGEND FULLSCREEN - window resize event');

    // Update the layer list based on window size
    updateFullscreenLayerListByWindowSize(layersList);
  }, [layersList, updateFullscreenLayerListByWindowSize]);

  // Wire a handler using a custom hook on the window resize event
  useEventListener<Window>('resize', handleWindowResize, window);

  // Handle initial layer setup
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LEGEND FULLSCREEN - layer setup', layersList);

    // Update the layer list based on window size
    updateFullscreenLayerListByWindowSize(layersList);
  }, [layersList, updateFullscreenLayerListByWindowSize]);

  // Handle fullscreen state changes
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LEGEND FULLSCREEN - fullscreen state change', isOpen);

    if (isOpen) {
      // Entering fullscreen: save collapse state and expand all
      const orderedLayerInfo = MapEventProcessor.getMapOrderedLayerInfo(mapId);
      const collapseState: Record<string, boolean> = {};

      orderedLayerInfo.forEach((layer) => {
        collapseState[layer.layerPath] = layer.legendCollapsed;
      });

      setSavedCollapseState(collapseState);

      // Expand all layers
      MapEventProcessor.setAllMapLayerCollapsed(mapId, false);
    } else {
      // Exiting fullscreen: restore saved collapse state
      setSavedCollapseState((prevState) => {
        if (Object.keys(prevState).length > 0) {
          Object.entries(prevState).forEach(([layerPath, collapsed]) => {
            MapEventProcessor.setMapLegendCollapsed(mapId, layerPath, collapsed);
          });
          // Return empty object to clear state
          return {};
        }
        return prevState;
      });
    }
  }, [isOpen, mapId]);

  // Memoize the no layers content
  const noLayersContent = useMemo(() => {
    // Log
    logger.logTraceUseMemo('components/legend-fullscreen - noLayersContent');

    return (
      <Box sx={styles.noLayersContainer}>
        <Typography variant="h3" gutterBottom sx={sxClasses.legendInstructionsTitle}>
          {t('legend.noLayersAdded')}
        </Typography>
        <Typography component="p" sx={sxClasses.legendInstructionsBody}>
          {t('legend.noLayersAddedDescription')}
        </Typography>
      </Box>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sxClasses is memoized from theme which is stable
  }, [t]);

  // Memoize fullscreen content
  const fullscreenContent = useMemo(() => {
    // Log
    logger.logTraceUseMemo('components/legend-fullscreen - fullscreenContent', fullscreenLegendLayerList.length);

    if (!fullscreenLegendLayerList.length) {
      return noLayersContent;
    }

    return fullscreenLegendLayerList.map((layers, idx) => (
      <List
        className="legendList"
        // eslint-disable-next-line react/no-array-index-key
        key={`fullscreen-${idx}`}
        sx={{
          width: responsiveWidths.responsive,
          ...sxClasses.legendList,
        }}
      >
        {layers.map((layer) => (
          <LegendLayer layerPath={layer.layerPath} key={layer.layerPath} hideControls />
        ))}
      </List>
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sxClasses is memoized from theme which is stable
  }, [fullscreenLegendLayerList, noLayersContent]);

  return (
    <FullScreenDialog
      open={isOpen}
      onClose={onClose}
      title={t('legend.title')}
      onExited={() => {
        // Use onExited callback to restore focus to the fullscreen button after the dialog exit animation completes
        fullScreenBtnRef.current?.focus();
      }}
    >
      <Box
        sx={sxClasses.fullscreenContainer}
        id={`${mapId}-${containerType}-legendContainer-fullscreen`}
        {...({
          // @ts-ignore - inert is a valid HTML attribute but not in React types yet
          inert: '',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)}
      >
        {fullscreenContent}
      </Box>
    </FullScreenDialog>
  );
}
