import { useState, useEffect, useContext } from 'react';

import { Coordinate } from 'ol/coordinate';
import { toLonLat } from 'ol/proj';

import makeStyles from '@mui/styles/makeStyles';

import { useTranslation } from 'react-i18next';

import { useStore } from 'zustand';
import { getGeoViewStore } from '@/core/stores/stores-managers';

import { Box, CheckIcon, Tooltip } from '@/ui';
import { MapContext } from '@/core/app-start';

const useStyles = makeStyles((theme) => ({
  mousePositionContainer: {
    display: 'flex',
    padding: theme.spacing(0, 4),
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    alignItems: 'center',
    border: 'none',
    backgroundColor: 'transparent',
  },
  mousePositionTextContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  mousePositionTextCheckmarkContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mousePositionCheckmark: {
    paddingRight: 5,
    color: theme.palette.primary.light,
  },
  mousePositionText: {
    fontSize: theme.typography.fontSize,
    color: theme.palette.primary.light,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
}));

// degree char
const deg = String.fromCharCode(176);

/**
 * Format the coordinates for degrees - minutes - seconds (lat, long)
 * @param {number} value the value to format
 * @returns {string} the formatted value
 */
function coordFormnatDMS(value: number): string {
  const d = Math.floor(Math.abs(value)) * (value < 0 ? -1 : 1);
  const m = Math.floor(Math.abs((value - d) * 60));
  const s = Math.round((Math.abs(value) - Math.abs(d) - m / 60) * 3600);
  return `${Math.abs(d)}${deg} ${m >= 10 ? `${m}` : `0${m}`}' ${s >= 10 ? `${s}` : `0${s}`}"`;
}

/**
 * Create the mouse position
 * @returns {JSX.Element} the mouse position component
 */
export function MousePosition(): JSX.Element {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const { t } = useTranslation<string>();

  // TODO: remove use style
  const classes = useStyles();

  // internal component state
  const [positions, setPositions] = useState<string[]>(['', '', '']);
  const [positionMode, setPositionMode] = useState<number>(0);

  // get the expand or collapse from store
  const expanded = useStore(getGeoViewStore(mapId), (state) => state.footerBarState.expanded);

  /**
   * Format the coordinates output in lat long
   * @param {Coordinate} lnglat the Lng and Lat value to format
   * @param {boolean} DMS true if need to be formatted as Degree Minute Second, false otherwise
   * @returns {Object} an object containing formatted Longitude and Latitude values
   */
  function formatCoordinates(lnglat: Coordinate, DMS: boolean): { lng: string; lat: string } {
    const labelX = lnglat[0] < 0 ? t('mapctrl.mouseposition.west') : t('mapctrl.mouseposition.east');
    const labelY = lnglat[1] < 0 ? t('mapctrl.mouseposition.south') : t('mapctrl.mouseposition.north');

    const lng = `${DMS ? coordFormnatDMS(lnglat[0]) : Math.abs(lnglat[0]).toFixed(4)} ${labelX}`;
    const lat = `${DMS ? coordFormnatDMS(lnglat[1]) : Math.abs(lnglat[1]).toFixed(4)} ${labelY}`;

    return { lng, lat };
  }

  /**
   * Switch position mode
   */
  const switchPositionMode = () => {
    setPositionMode((positionMode + 1) % 3);
  };

  useEffect(() => {
    const unsubA = getGeoViewStore(mapId).subscribe(
      (state) => state.mapState.pointerPosition,
      (curPos, prevPos) => {
        // if pointerPosition changed, pointer move event has been triggered
        if (curPos !== prevPos) {
          const { lnglat, projected } = curPos!;
          const DMS = formatCoordinates(lnglat, true);
          const DD = formatCoordinates(lnglat, false);

          setPositions([
            `${DMS.lng} | ${DMS.lat}`,
            `${DD.lng} | ${DD.lat}`,
            `${projected[0].toFixed(4)}m E | ${projected[1].toFixed(4)}m N`,
          ]);
        }
      }
    );

    const unsubB = getGeoViewStore(mapId).subscribe((curState, prevState) => {
      // if mapCenterCoordinates changed, map move end event has been triggered
      // if the crosshair is active from the store, keyboard is used
      if (curState.isCrosshairsActive && curState.mapState.mapCenterCoordinates !== prevState.mapState.mapCenterCoordinates) {
        const projected = curState.mapState.mapCenterCoordinates;
        const DMS = formatCoordinates(toLonLat(projected, `EPSG:${curState.mapState.currentProjection}`), true);
        const DD = formatCoordinates(toLonLat(projected, `EPSG:${curState.mapState.currentProjection}`), false);
        setPositions([`${DMS.lng} | ${DMS.lat}`, `${DD.lng} | ${DD.lat}`, `${projected[0].toFixed(4)}m E | ${projected[1].toFixed(4)}m N`]);
      }
    });

    return () => {
      unsubA();
      unsubB();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Tooltip title={t('mapnav.coordinates')!} placement="top">
      <button type="button" onClick={() => switchPositionMode()} className={classes.mousePositionContainer}>
        <Box className={classes.mousePositionTextContainer}>
          <Box id="mousePositionWrapper" sx={{ display: !expanded ? 'none' : 'block', transition: 'display 1ms ease-in 300ms' }}>
            {positions.map((position, index) => {
              return (
                // eslint-disable-next-line react/no-array-index-key
                <Box className={classes.mousePositionTextCheckmarkContainer} key={index}>
                  <CheckIcon sx={{ fontSize: 25, opacity: index === positionMode ? 1 : 0 }} className={classes.mousePositionCheckmark} />
                  <span className={classes.mousePositionText}>{position}</span>
                </Box>
              );
            })}
          </Box>
          <Box component="span" className={classes.mousePositionText} sx={{ display: expanded ? 'none' : 'block' }}>
            {positions[positionMode]}
          </Box>
        </Box>
      </button>
    </Tooltip>
  );
}
