import { useEffect, useRef } from 'react';

import { useTheme } from '@mui/material/styles';

import { useTranslation } from 'react-i18next';

import { Box, Fade, Typography } from '@/ui';
import { getSxClasses } from './crosshair-style';
import { CrosshairIcon } from './crosshair-icon';
import { useAppCrosshairsActive } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useMapElement, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';

/**
 * Create a Crosshair when map is focus with the keyboard so user can click on the map
 * @returns {JSX.Element} the crosshair component
 */
export function Crosshair(): JSX.Element {
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get store values
  const isCrosshairsActive = useAppCrosshairsActive();
  const mapElement = useMapElement();
  const { setClickCoordinates, setMapKeyboardPanInteractions } = useMapStoreActions();

  // do not use useState for item used inside function only without rendering... use useRef
  const panelButtonId = useRef('');
  let panDelta = 128;

  /**
   * Simulate map mouse click to trigger details panel
   * @function simulateClick
   * @param {KeyboardEvent} evt the keyboard event
   */
  function simulateClick(evt: KeyboardEvent): void {
    if (evt.key === 'Enter') {
      setClickCoordinates();
    }
  }

  /**
   * Modify the pixelDelta value for the keyboard pan on Shift arrow up or down
   *
   * @param {KeyboardEvent} evt the keyboard event to trap
   */
  function managePanDelta(evt: KeyboardEvent): void {
    if ((evt.key === 'ArrowDown' && evt.shiftKey) || (evt.key === 'ArrowUp' && evt.shiftKey)) {
      panDelta = evt.key === 'ArrowDown' ? (panDelta -= 10) : (panDelta += 10);
      panDelta = panDelta < 10 ? 10 : panDelta; // minus panDelta reset the value so we need to trap

      setMapKeyboardPanInteractions(panDelta);
    }
  }

  useEffect(() => {
    const mapHTMLElement = mapElement.getTargetElement();
    if (isCrosshairsActive) {
      panelButtonId.current = 'detailsPanel';
      mapHTMLElement.addEventListener('keydown', simulateClick);
      mapHTMLElement.addEventListener('keydown', managePanDelta);
    } else {
      mapHTMLElement.removeEventListener('keydown', simulateClick);
      mapHTMLElement.removeEventListener('keydown', managePanDelta);
    }

    return () => {
      mapHTMLElement.removeEventListener('keydown', simulateClick);
      mapHTMLElement.removeEventListener('keydown', managePanDelta);
    };
  }, [isCrosshairsActive, mapElement, simulateClick, managePanDelta]);

  return (
    <Box
      sx={[
        sxClasses.crosshairContainer,
        {
          visibility: isCrosshairsActive ? 'visible' : 'hidden',
        },
      ]}
    >
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
}
