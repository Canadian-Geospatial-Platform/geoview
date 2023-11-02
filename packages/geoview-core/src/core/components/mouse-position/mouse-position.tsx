import { useState, useEffect, useContext } from 'react';

import { Coordinate } from 'ol/coordinate';

import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import { Box, Button, CheckIcon } from '@/ui';
import { MapContext } from '@/core/app-start';
import { getSxClasses } from './mouse-position-style';
import { useUIFooterBarExpanded } from '@/core/stores/ui-state';
import { useMapPointerPosition } from '@/core/stores/map-state';
import { api } from '@/app';

/**
 * Create the mouse position
 * @returns {JSX.Element} the mouse position component
 */
export function MousePosition(): JSX.Element {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal component state
  const [positions, setPositions] = useState<string[]>(['', '', '']);
  const [positionMode, setPositionMode] = useState<number>(0);

  // get store values
  const expanded = useUIFooterBarExpanded(mapId);
  const pointerPosition = useMapPointerPosition(mapId);

  /**
   * Switch position mode
   */
  const switchPositionMode = () => {
    setPositionMode((positionMode + 1) % 3);
  };

  useEffect(() => {
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

  // useEffect(() => {
  //   // if pointerPosition changed, map pointer event has been triggered
  //   const unsubMapPointer = getGeoViewStore(mapId).subscribe(
  //     (state) => state.mapState.pointerPosition,
  //     (curPos, prevPos) => {
  //       if (curPos !== prevPos) {
  //         const { lnglat, projected } = curPos!;
  //         const DMS = formatCoordinates(lnglat, true);
  //         const DD = formatCoordinates(lnglat, false);

  //         setPositions([
  //           `${DMS.lng} | ${DMS.lat}`,
  //           `${DD.lng} | ${DD.lat}`,
  //           `${projected[0].toFixed(4)}m E | ${projected[1].toFixed(4)}m N`,
  //         ]);
  //       }
  //     }
  //   );

  //   // if mapCenterCoordinates changed, map move end event has been triggered
  //   // if the crosshair is active from the store, keyboard is used
  //   const unsubMapCenterCoord = getGeoViewStore(mapId).subscribe(
  //     (state) => state.mapState.mapCenterCoordinates,
  //     (curCenterCoord, prevCenterCoord) => {
  //       if (curCenterCoord !== prevCenterCoord && getGeoViewStore(mapId).getState().isCrosshairsActive) {
  //         const projected = curCenterCoord;
  //         const projection = getGeoViewStore(mapId).getState().mapState.currentProjection;
  //         const DMS = formatCoordinates(toLonLat(projected, `EPSG:${projection}`), true);
  //         const DD = formatCoordinates(toLonLat(projected, `EPSG:${projection}`), false);
  //         setPositions([
  //           `${DMS.lng} | ${DMS.lat}`,
  //           `${DD.lng} | ${DD.lat}`,
  //           `${projected[0].toFixed(4)}m E | ${projected[1].toFixed(4)}m N`,
  //         ]);
  //       }
  //     }
  //   );

  //   return () => {
  //     unsubMapPointer();
  //     unsubMapCenterCoord();
  //   };
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

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
