import { memo, useCallback, useMemo, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Box, Fade, Typography } from '@/ui';

import { getSxClasses } from './crosshair-style';
import { CrosshairIcon } from './crosshair-icon';
import { useAppCrosshairsActive } from '@/core/stores/store-interface-and-intial-values/app-state';
import { getStoreMapPointerPosition } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { useEventListener } from '@/core/components/common/hooks/use-event-listener';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

type CrosshairProps = {
  mapTargetElement: HTMLElement;
};

/**
 * Create a Crosshair when map is focus with the keyboard so user can click on the map
 * @param {CrosshairProps} - Crossahir props who caintain the mapTargetELement
 * @returns {JSX.Element} the crosshair component
 */
// Memoizes entire component, preventing re-renders if props haven't changed
export const Crosshair = memo(function Crosshair({ mapTargetElement }: CrosshairProps): JSX.Element | null {
  logger.logTraceRender('components/crosshair/crosshair');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // State (no useState for item used inside function only without rendering... use useRef)
  const panDelta = useRef(128);

  //  Store
  const isCrosshairsActive = useAppCrosshairsActive();
  const mapId = useGeoViewMapId();

  // Callbacks
  /**
   * Simulate map mouse click to trigger details panel
   * @function simulateClick
   * @param {KeyboardEvent} event the keyboard event
   */
  const simulateClick = useCallback(
    (event: HTMLElementEventMap[keyof HTMLElementEventMap]) => {
      if (!isCrosshairsActive || !(event instanceof KeyboardEvent) || event.key !== 'Enter') {
        return;
      }

      // Use store getter, we do not subcribe to modification
      const currentPointerPosition = getStoreMapPointerPosition(mapId);
      if (currentPointerPosition) {
        MapEventProcessor.setClickCoordinates(mapId, currentPointerPosition);
      }
    },
    [isCrosshairsActive, mapId]
  );

  /**
   * Modify the pixelDelta value for the keyboard pan on Shift arrow up or down
   *
   * @param {KeyboardEvent} event the keyboard event to trap
   */
  const managePanDelta = useCallback(
    (event: HTMLElementEventMap[keyof HTMLElementEventMap]) => {
      // Early return in callback
      if (!isCrosshairsActive) return;

      const myEvent = event as KeyboardEvent;
      if ((myEvent.key === 'ArrowDown' && myEvent.shiftKey) || (myEvent.key === 'ArrowUp' && myEvent.shiftKey)) {
        panDelta.current = myEvent.key === 'ArrowDown' ? Math.max(10, panDelta.current - 10) : panDelta.current + 10;

        MapEventProcessor.setMapKeyboardPanInteractions(mapId, panDelta.current);
      }
    },
    [isCrosshairsActive, mapId]
  );

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
