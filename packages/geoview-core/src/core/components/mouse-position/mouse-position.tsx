import { useState, useEffect } from 'react';

import { Coordinate } from 'ol/coordinate';

import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import { Box, Button, CheckIcon } from '@/ui';
import { getSxClasses } from './mouse-position-style';
import { useUIFooterBarExpanded } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useMapPointerPosition } from '@/core/stores/store-interface-and-intial-values/map-state';
import { api } from '@/app';
import { logger } from '@/core/utils/logger';

/**
 * Create the mouse position
 * @returns {JSX.Element} the mouse position component
 */
export function MousePosition(): JSX.Element {
  // Log
  logger.logTraceRender('components/mouse-position/mouse-position');

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal component state
  const [positions, setPositions] = useState<string[]>(['', '', '']);
  const [positionMode, setPositionMode] = useState<number>(0);

  // get store values
  const expanded = useUIFooterBarExpanded();
  const pointerPosition = useMapPointerPosition();

  /**
   * Switch position mode
   */
  const switchPositionMode = () => {
    setPositionMode((positionMode + 1) % 3);
  };

  useEffect(() => {
    // Log too annoying
    // logger.logTraceUseEffect('MOUSE-POSITION - pointerPosition', pointerPosition);

    /**
     * Format the coordinates output in lat long
     * @param {Coordinate} lnglat the Lng and Lat value to format
     * @param {boolean} DMS true if need to be formatted as Degree Minute Second, false otherwise
     * @returns {Object} an object containing formatted Longitude and Latitude values
     */
    function formatCoordinates(lnglat: Coordinate, DMS: boolean): { lng: string; lat: string } {
      const labelX = lnglat[0] < 0 ? t('mapctrl.mouseposition.west') : t('mapctrl.mouseposition.east');
      const labelY = lnglat[1] < 0 ? t('mapctrl.mouseposition.south') : t('mapctrl.mouseposition.north');

      const lng = `${DMS ? api.geoUtilities.coordFormnatDMS(lnglat[0]) : Math.abs(lnglat[0]).toFixed(4)} ${labelX}`;
      const lat = `${DMS ? api.geoUtilities.coordFormnatDMS(lnglat[1]) : Math.abs(lnglat[1]).toFixed(4)} ${labelY}`;

      return { lng, lat };
    }

    if (pointerPosition !== undefined) {
      const { lnglat, projected } = pointerPosition;
      const DMS = formatCoordinates(lnglat, true);
      const DD = formatCoordinates(lnglat, false);

      setPositions([`${DMS.lng} | ${DMS.lat}`, `${DD.lng} | ${DD.lat}`, `${projected[0].toFixed(4)}m E | ${projected[1].toFixed(4)}m N`]);
    }
  }, [pointerPosition, t]);

  return (
    <Button
      type="text"
      onClick={() => switchPositionMode()}
      sx={sxClasses.mousePosition}
      tooltip="mapnav.coordinates"
      tooltipPlacement="top"
      disableRipple
    >
      <Box sx={sxClasses.mousePositionTextContainer}>
        <Box id="mousePositionWrapper" sx={{ display: !expanded ? 'none' : 'block', transition: 'display 1ms ease-in 300ms' }}>
          {positions.map((position, index) => {
            return (
              // eslint-disable-next-line react/no-array-index-key
              <Box sx={sxClasses.mousePositionTextCheckmarkContainer} key={index}>
                <CheckIcon sx={{ fontSize: 25, opacity: index === positionMode ? 1 : 0, ...sxClasses.mousePositionCheckmark }} />
                <span>{position}</span>
              </Box>
            );
          })}
        </Box>
        <Box component="span" sx={{ display: expanded ? 'none' : 'block', ...sxClasses.mousePositionText }}>
          {positions[positionMode]}
        </Box>
      </Box>
    </Button>
  );
}
