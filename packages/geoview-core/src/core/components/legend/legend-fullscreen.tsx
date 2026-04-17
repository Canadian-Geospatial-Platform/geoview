import { useTheme } from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, List, Typography, IconButton, FullscreenIcon } from '@/ui';
import { logger } from '@/core/utils/logger';
import {
  getStoreMapLegendCollapsedSet,
  setStoreMapAllMapLayerCollapsed,
  setStoreMapLegendCollapsed,
} from '@/core/stores/store-interface-and-intial-values/map-state';

import { getSxClasses } from './legend-styles';
import { LegendLayer } from './legend-layer';
import { CONTAINER_TYPE } from '@/core/utils/constant';
import type { TypeContainerBox } from '@/core/types/global-types';
import { useEventListener } from '@/core/components/common/hooks/use-event-listener';
import { FullScreenDialog } from '@/core/components/common/full-screen-dialog';
import { DEFAULT_APPBAR_CORE } from '@/api/types/map-schema-types';
import { useStoreAppShellContainer } from '@/core/stores/store-interface-and-intial-values/app-state';

/**
 * Properties for the LegendFullscreen component.
 * @interface LegendFullscreenProps
 * @property {string[]} layerPaths - Array of layer paths to display in fullscreen mode.
 * @property {string} mapId - The unique identifier of the map.
 * @property {TypeContainerBox} containerType - The type of container where the legend is displayed.
 * @property {boolean} isOpen - Controls whether the fullscreen dialog is open.
 * @property {() => void} onClose - Callback function invoked when the fullscreen dialog is closed.
 * @property {React.RefObject<HTMLButtonElement>} buttonRef - Reference to the fullscreen button for focus restoration.
 */
interface LegendFullscreenProps {
  layerPaths: string[];
  mapId: string;
  containerType: TypeContainerBox;
  isOpen: boolean;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

/**
 * Properties for the LegendFullscreenButton component.
 * @interface FullscreenButtonProps
 * @property {TypeContainerBox} containerType - The type of container where the button is displayed.
 * @property {() => void} onClick - Callback function invoked when the button is clicked.
 * @property {React.RefObject<HTMLButtonElement>} buttonRef - Reference to the button element for focus management.
 */
interface FullscreenButtonProps {
  containerType: TypeContainerBox;
  onClick: () => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
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

/**
 * Renders a button that opens the legend in fullscreen mode.
 * Only displays when the legend is shown in the app bar container.
 * @param props - The component properties.
 * @param props.containerType - The type of container where the button is displayed.
 * @param props.onClick - Callback function invoked when the fullscreen button is clicked.
 * @returns The fullscreen button element, or null if not in the app bar.
 */
export function LegendFullscreenButton({ containerType, onClick, buttonRef }: FullscreenButtonProps): JSX.Element | null {
  logger.logTraceRender('components/legend/legend-fullscreen-button');

  // Hooks
  const { t } = useTranslation<string>();

  // Only show in app bar
  if (containerType !== CONTAINER_TYPE.APP_BAR) return null;

  return (
    <IconButton
      iconRef={buttonRef}
      size="small"
      onClick={onClick}
      aria-label={t('general.openFullscreen')}
      aria-haspopup="dialog"
      className="buttonOutline"
    >
      <FullscreenIcon />
    </IconButton>
  );
}

/**
 * Renders the legend in a fullscreen dialog with responsive multi-column layout.
 * Manages layer collapse state by expanding all layers when entering fullscreen and
 * restoring the previous collapse state when exiting.
 * @param props - The component properties.
 * @returns The fullscreen legend dialog component.
 */
export function LegendFullscreen({ layerPaths, mapId, containerType, isOpen, onClose, buttonRef }: LegendFullscreenProps): JSX.Element {
  logger.logTraceRender('components/legend/legend-fullscreen');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const shellContainer = useStoreAppShellContainer();

  // State
  const [fullscreenLegendLayerList, setFullscreenLegendLayersList] = useState<string[][]>([]);
  const savedCollapseStateRef = useRef<Record<string, boolean>>({});

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
   * Calculates the number of columns for the fullscreen legend layout based on the current window width.
   * Uses responsive breakpoints to determine column count:
   * - Mobile (< sm): 1 column
   * - Tablet (sm - md): 2 columns
   * - Desktop (md - lg): 3 columns
   * - Large (>= lg): 4 columns
   * @returns The number of columns to display.
   */
  const getFullscreenLayerListSize = useCallback(() => {
    const { innerWidth } = window;
    if (innerWidth < breakpoints.sm) return 1;
    if (innerWidth < breakpoints.md) return 2;
    if (innerWidth < breakpoints.lg) return 3;
    return 4;
  }, [breakpoints]);

  /**
   * Distributes legend layers across multiple columns for fullscreen display.
   * Uses a round-robin algorithm to evenly distribute layers across the available columns
   * determined by the current window size.
   *
   * @param paths - Array of layer paths to distribute.
   */
  const updateFullscreenLayerListByWindowSize = useCallback(
    (paths: string[]): void => {
      const arrSize = getFullscreenLayerListSize();
      const list = Array.from({ length: arrSize }, () => []) as Array<string[]>;

      paths.forEach((layerPath, index) => {
        list[index % arrSize].push(layerPath);
      });

      // Format the list only if there is layers
      setFullscreenLegendLayersList(paths.length === 0 ? [] : list);
    },
    [getFullscreenLayerListSize]
  );

  // Memoize the window resize handler and use the hook to add listener to avoid many creation
  const handleWindowResize = useCallback(() => {
    // Update the layer list based on window size
    updateFullscreenLayerListByWindowSize(layerPaths);
  }, [layerPaths, updateFullscreenLayerListByWindowSize]);

  // Wire a handler using a custom hook on the window resize event
  useEventListener<Window>('resize', handleWindowResize, window);

  // Handle initial layer setup
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LEGEND FULLSCREEN - layer setup', layerPaths);

    // Update the layer list based on window size
    updateFullscreenLayerListByWindowSize(layerPaths);
  }, [layerPaths, updateFullscreenLayerListByWindowSize]);

  // Handle fullscreen state changes
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('LEGEND FULLSCREEN - fullscreen state change', isOpen);

    if (isOpen) {
      // Entering fullscreen: snapshot collapse state from the store and expand all
      // GV Here we use a store getter, because we actually want to snapshot the values to reuse them later, we don't want to hook on them
      savedCollapseStateRef.current = getStoreMapLegendCollapsedSet(mapId);

      // Save to the store
      setStoreMapAllMapLayerCollapsed(mapId, false);
    } else {
      // Exiting fullscreen: restore saved collapse state
      const savedState = savedCollapseStateRef.current;
      if (Object.keys(savedState).length > 0) {
        Object.entries(savedState).forEach(([layerPath, collapsed]) => {
          // Save to the store
          setStoreMapLegendCollapsed(mapId, layerPath, collapsed);
        });
      }
    }
  }, [isOpen, mapId]);

  // Memoize the no layers content
  const noLayersContent = useMemo(() => {
    // Log
    logger.logTraceUseMemo('components/legend-fullscreen - noLayersContent');

    return (
      <Box sx={styles.noLayersContainer}>
        <Typography component="div" gutterBottom sx={sxClasses.legendInstructionsTitle}>
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

    return fullscreenLegendLayerList.map((paths, idx) => (
      <List
        className="legendList"
        // eslint-disable-next-line react/no-array-index-key
        key={`fullscreen-${idx}`}
        sx={{
          width: responsiveWidths.responsive,
          ...sxClasses.legendList,
        }}
      >
        {paths.map((layerPath) => (
          <LegendLayer layerPath={layerPath} key={layerPath} showControls={false} containerType={containerType} />
        ))}
      </List>
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sxClasses is memoized from theme which is stable
  }, [fullscreenLegendLayerList, noLayersContent]);

  return (
    <FullScreenDialog
      id={`${mapId}-${containerType}-${DEFAULT_APPBAR_CORE.LEGEND}-panel-fullscreen`}
      open={isOpen}
      onClose={onClose}
      title={`${t('legend.titleFullScreen')}`}
      onExited={() => {
        // Use onExited callback to restore focus to the fullscreen button after the dialog exit animation completes
        buttonRef.current?.focus();
      }}
      container={shellContainer}
      disableEnforceFocus={true}
    >
      <Box
        sx={sxClasses.fullscreenContainer}
        id={`${mapId}-${containerType}-${DEFAULT_APPBAR_CORE.LEGEND}-panel-fullscreen-container`}
        {...({
          // To set the content behind the dialog as inert to remove access to content
          // @ts-ignore - inert is a valid HTML attribute but not in React types yet
          inert: 'true',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)}
      >
        {fullscreenContent}
      </Box>
    </FullScreenDialog>
  );
}
