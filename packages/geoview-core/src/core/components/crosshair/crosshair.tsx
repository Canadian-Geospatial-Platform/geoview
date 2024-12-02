import { memo, useCallback, useEffect, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Box, Fade, Typography } from '@/ui';

import { getSxClasses } from './crosshair-style';
import { CrosshairIcon } from './crosshair-icon';
import { useAppCrosshairsActive } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useMapPointerPosition, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';

type CrosshairProps = {
  mapTargetElement: HTMLElement;
};

/**
 * Create a Crosshair when map is focus with the keyboard so user can click on the map
 * @param {CrosshairProps} - Crossahir props who caintain the mapTargetELement
 * @returns {JSX.Element} the crosshair component
 */
// Memoizes entire component, preventing re-renders if props haven't changed
export const Crosshair = memo(function Crosshair({ mapTargetElement }: CrosshairProps): JSX.Element {
  logger.logTraceRender('components/crosshair/crosshair');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // State (no useState for item used inside function only without rendering... use useRef)
  const panelButtonId = useRef('');
  const panDelta = useRef(128);

  //  Store
  const isCrosshairsActive = useAppCrosshairsActive();
  const pointerPosition = useMapPointerPosition();
  const { setClickCoordinates, setMapKeyboardPanInteractions } = useMapStoreActions();

  // Callbacks
  /**
   * Simulate map mouse click to trigger details panel
   * @function simulateClick
   * @param {KeyboardEvent} event the keyboard event
   */
  const simulateClick = useCallback(
    (event: KeyboardEvent) => {
      logger.logTraceUseCallback('CROSSHAIR - simulateClick', pointerPosition);
      if (event.key === 'Enter' && pointerPosition) {
        // Update the store
        setClickCoordinates(pointerPosition).catch((error) => {
          // Log
          logger.logPromiseFailed('Failed to setClickCoordinates in crosshair.simulateClick', error);
        });
      }
    },
    [pointerPosition, setClickCoordinates]
  );

  /**
   * Modify the pixelDelta value for the keyboard pan on Shift arrow up or down
   *
   * @param {KeyboardEvent} event the keyboard event to trap
   */
  const managePanDelta = useCallback(
    (event: KeyboardEvent) => {
      logger.logTraceUseCallback('CROSSHAIR - managePanDelta', event.key);
      if ((event.key === 'ArrowDown' && event.shiftKey) || (event.key === 'ArrowUp' && event.shiftKey)) {
        panDelta.current = event.key === 'ArrowDown' ? (panDelta.current -= 10) : (panDelta.current += 10);
        panDelta.current = panDelta.current < 10 ? 10 : panDelta.current; // minus panDelta reset the value so we need to trap

        setMapKeyboardPanInteractions(panDelta.current);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // State setters are stable, no need for dependencies
  );

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('CROSSHAIR - isCrosshairsActive', isCrosshairsActive);

    if (isCrosshairsActive) {
      panelButtonId.current = 'detailsPanel';
      mapTargetElement.addEventListener('keydown', simulateClick);
      mapTargetElement.addEventListener('keydown', managePanDelta);
    } else if (mapTargetElement) {
      mapTargetElement.removeEventListener('keydown', simulateClick);
      mapTargetElement.removeEventListener('keydown', managePanDelta);
    }

    return () => {
      // need to check cause it may be undefined when we remove/delete the map
      if (mapTargetElement) {
        mapTargetElement.removeEventListener('keydown', simulateClick);
        mapTargetElement.removeEventListener('keydown', managePanDelta);
      }
    };
  }, [isCrosshairsActive, mapTargetElement, simulateClick, managePanDelta]);

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
