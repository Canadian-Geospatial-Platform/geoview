import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Box, Fade, Typography } from '@/ui';

import { getSxClasses } from './crosshair-style';
import { CrosshairIcon } from './crosshair-icon';
import { useStoreAppIsCrosshairsActive } from '@/core/stores/store-interface-and-intial-values/app-state';
import { getStoreMapPointerPosition } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { useEventListener } from '@/core/components/common/hooks/use-event-listener';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { useUIController } from '@/core/controllers/ui-controller';
import { useMapController } from '@/core/controllers/map-controller';

/** Properties for the Crosshair component. */
type CrosshairProps = {
  mapTargetElement: HTMLElement;
};

/**
 * Renders a crosshair when the map is focused with the keyboard so the user can click on the map.
 *
 * Memoized because the single prop is a stable DOM element reference that maintains identity across parent renders.
 *
 * @param props - Crosshair properties containing the map target element
 * @returns The crosshair component, or null if inactive
 */
export const Crosshair = memo(function Crosshair({ mapTargetElement }: CrosshairProps): JSX.Element | null {
  logger.logTraceRender('components/crosshair/crosshair');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Pan delta for keyboard pan interactions
  const panDelta = useRef(128);

  //  Store
  const mapId = useStoreGeoViewMapId();
  const isCrosshairsActive = useStoreAppIsCrosshairsActive();
  const uiController = useUIController();
  const mapController = useMapController();

  // AbortController ref - aborts any in-flight coordinate info fetch on re-click
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Simulates a map mouse click to trigger the details panel.
   */
  const simulateClick = useCallback(
    (event: HTMLElementEventMap[keyof HTMLElementEventMap]): void => {
      if (!isCrosshairsActive || !(event instanceof KeyboardEvent) || event.key !== 'Enter') {
        return;
      }

      // Use store getter, we do not subcribe to modification
      const currentPointerPosition = getStoreMapPointerPosition(mapId);
      if (currentPointerPosition) {
        // Abort any previous in-flight request
        abortControllerRef.current?.abort();

        // Create a new AbortController for this click
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // Set the click coordinates
        mapController.setClickCoordinates(currentPointerPosition, controller.signal);
      }
    },
    [isCrosshairsActive, mapId, mapController]
  );

  /**
   * Modifies the pixelDelta value for keyboard pan on Shift+Arrow up or down.
   */
  const managePanDelta = useCallback(
    (event: HTMLElementEventMap[keyof HTMLElementEventMap]): void => {
      // Early return in callback
      if (!isCrosshairsActive) return;

      const myEvent = event as KeyboardEvent;
      if ((myEvent.key === 'ArrowDown' && myEvent.shiftKey) || (myEvent.key === 'ArrowUp' && myEvent.shiftKey)) {
        panDelta.current = myEvent.key === 'ArrowDown' ? Math.max(10, panDelta.current - 10) : panDelta.current + 10;

        uiController.setMapKeyboardPanInteractions(panDelta.current);
      }
    },
    [isCrosshairsActive, uiController]
  );

  /**
   * Aborts any in-flight coordinate info request on unmount.
   */
  useEffect(() => {
    return (): void => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Use custom hook for event listeners
  useEventListener<HTMLElement>('keydown', simulateClick, mapTargetElement, isCrosshairsActive);
  useEventListener<HTMLElement>('keydown', managePanDelta, mapTargetElement, isCrosshairsActive);

  return (
    <Box sx={{ ...sxClasses.crosshairContainer, visibility: isCrosshairsActive ? 'visible' : 'hidden' }}>
      <Fade in={isCrosshairsActive}>
        <Box sx={sxClasses.crosshairIcon}>
          <CrosshairIcon />
        </Box>
      </Fade>
      <Box sx={sxClasses.crosshairInfo}>
        <Typography dangerouslySetInnerHTML={{ __html: t('mapctrl.crosshair')! }} />
      </Box>
    </Box>
  );
});
