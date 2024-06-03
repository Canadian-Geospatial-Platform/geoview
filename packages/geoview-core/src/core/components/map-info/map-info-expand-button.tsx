import { useEffect } from 'react';

import { useTheme } from '@mui/material';
import { ExpandMoreIcon, ExpandLessIcon, IconButton, Box } from '@/ui';
import { getSxClasses } from './map-info-style';
import { useUIStoreActions, useUIMapInfoExpanded } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { logger } from '@/core/utils/logger';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

/**
 * Map Information Expand Button component
 *
 * @returns {JSX.Element} the expand buttons
 */
export function MapInfoExpandButton(): JSX.Element {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get the expand or collapse from expand button click
  const mapId = useGeoViewMapId();
  const expanded = useUIMapInfoExpanded();
  const { setMapInfoExpanded } = useUIStoreActions();

  const tooltipAndAria = 'layers.toggleCollapse';

  const handleTransitionEnd = (): void => {
    setMapInfoExpanded(true);
  };

  /**
   * Expand the map information bar
   */
  const expandMapInfo = (): void => {
    const mapInfo = document.getElementById(`${mapId}-mapInfo`);
    if (mapInfo) {
      mapInfo.style.transition = 'max-height 300ms ease-in 0s';
      mapInfo.style.maxHeight = '80px';
      mapInfo.style.height = '80px';

      const ulElement = mapInfo.querySelector('.ol-attribution ul') as HTMLElement;

      if (ulElement) {
        ulElement.style.width = '100%';
      }

      // event listener for transitionend
      mapInfo.addEventListener('transitionend', handleTransitionEnd, { once: true });
    }
  };

  /**
   * Collapse map information
   */
  const collapseMapInfo = (): void => {
    const mapInfo = document.getElementById(`${mapId}-mapInfo`);

    if (mapInfo) {
      const ulElement = mapInfo.querySelector('.ol-attribution ul') as HTMLElement;

      if (ulElement) {
        ulElement.style.width = '0px';
      }

      mapInfo.style.transition = 'max-height 300ms ease-out';
      mapInfo.style.maxHeight = '25px';
    }

    // set map info collapsed
    setMapInfoExpanded(false);
  };

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('MAP-INFO-EXPAND-BUTTON - mount');

    return () => {
      const mapInfo = document.getElementById(`${mapId}-mapInfo`);
      if (mapInfo) {
        mapInfo.removeEventListener('transitionend', handleTransitionEnd);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <IconButton
        aria-label={tooltipAndAria}
        tooltip={tooltipAndAria}
        sx={sxClasses.expandButton}
        onClick={() => (expanded ? collapseMapInfo() : expandMapInfo())}
      >
        {expanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
      </IconButton>
    </Box>
  );
}
