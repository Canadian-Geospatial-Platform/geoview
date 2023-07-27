import { useCallback, useState, useEffect, useRef, useContext } from 'react';

import { Coordinate } from 'ol/coordinate';
import { fromLonLat, toLonLat } from 'ol/proj';

import makeStyles from '@mui/styles/makeStyles';

import { useTranslation } from 'react-i18next';

import debounce from 'lodash/debounce';

import { api } from '@/app';
import { MapContext } from '../../app-start';

import { EVENT_NAMES } from '@/api/events/event-types';
import { payloadIsABoolean } from '@/api/events/payloads/boolean-payload';

import { Box, CheckIcon, Tooltip } from '@/ui';

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
 * Mouse position properties interface
 */
interface MousePositionProps {
  mousePositionMapId: string;
}

/**
 * Create the mouse position
 * @param {MousePositionProps} props the mouse position properties
 * @returns {JSX.Element} the mouse position component
 */
export function MousePosition(props: MousePositionProps): JSX.Element {
  const { mousePositionMapId } = props;

  const [expanded, setExpanded] = useState(false);
  const [mousePositionText, setMousePositionText] = useState<boolean>(false);

  const { t } = useTranslation<string>();

  const classes = useStyles();

  const [positions, setPositions] = useState<string[]>(['', '', '']);

  // const [position, setPosition] = useState({ lng: '--', lat: '--' });

  const [positionMode, setPositionMode] = useState<number>(0);

  // keep track of crosshair status to know when update coord from keyboard navigation
  const isCrosshairsActive = useRef(false);

  const mapConfig = useContext(MapContext);

  const { mapId } = mapConfig;

  /**
   * Format the coordinates output in lat long
   * @param {Coordinate} lnglat the Lng and Lat value to format
   * @param {boolean} DMS true if need to be formatted as Degree Minute Second, false otherwise
   * @returns {Object} an object containing formatted Longitude and Latitude values
   */
  function formatCoordinates(lnglat: Coordinate, DMS: boolean) {
    const labelX = lnglat[0] < 0 ? t('mapctrl.mouseposition.west') : t('mapctrl.mouseposition.east');
    const labelY = lnglat[1] < 0 ? t('mapctrl.mouseposition.south') : t('mapctrl.mouseposition.north');

    const lng = `${DMS ? coordFormnatDMS(lnglat[0]) : Math.abs(lnglat[0]).toFixed(4)} ${labelX}`;
    const lat = `${DMS ? coordFormnatDMS(lnglat[1]) : Math.abs(lnglat[1]).toFixed(4)} ${labelY}`;

    return { lng, lat };
  }

  /**
   * Get the formatted coordinate for Degree Minute Second, Decimal degree and projected values
   * @param {Coordinate} coord coordinates array to process
   * @returns {Object} the coordinates
   */
  function getCoordinates(coord: Coordinate) {
    // TODO: when map is loaded from function call, there is a first init with the empty config then an overwrite by the the function call.
    // !Some of the reference are not set properly, so we have this work around. EWven with this is it not 100% perfect. This needs to be refactor
    // !so we do not have access before the api map is set
    const projection = api.projection.projections[api.map(mapId) !== undefined ? api.map(mapId).currentProjection : 3978];
    const coordinate = toLonLat(coord, projection);

    const DMS = formatCoordinates(coordinate, true);
    const DD = formatCoordinates(coordinate, false);
    const projected = fromLonLat([coordinate[0], coordinate[1]], projection);

    return { DMS, DD, projected };
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onMouseMove = useCallback(
    debounce((e) => {
      const coord = getCoordinates(e.coordinate);

      setPositions([
        `${coord.DMS.lng} | ${coord.DMS.lat}`,
        `${coord.DD.lng} | ${coord.DD.lat}`,
        `${coord.projected[0].toFixed(4)}m E | ${coord.projected[1].toFixed(4)}m N`,
      ]);
    }, 10),
    [t, positionMode]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onMoveEnd = useCallback(
    debounce((e) => {
      const coord = getCoordinates(e.map.getView().getCenter());

      setPositions([
        `${coord.DMS.lng} | ${coord.DMS.lat}`,
        `${coord.DD.lng} | ${coord.DD.lat}`,
        `${coord.projected[0].toFixed(4)}m E | ${coord.projected[1].toFixed(4)}m N`,
      ]);
    }, 10),
    [t, positionMode]
  );

  /**
   * Switch position mode
   */
  const switchPositionMode = () => {
    const { map } = api.map(mapId);
    const coord = getCoordinates(map.getView().getCenter()!);

    setPositions([
      `${coord.DMS.lng} | ${coord.DMS.lat}`,
      `${coord.DD.lng} | ${coord.DD.lat}`,
      `${coord.projected[0].toFixed(4)}m E | ${coord.projected[1].toFixed(4)}m N`,
    ]);

    setPositionMode((positionMode + 1) % 3);
  };

  useEffect(() => {
    const { map } = api.map(mapId);

    map.on('pointermove', onMouseMove);
    map.on('moveend', onMoveEnd);

    return () => {
      map.un('pointermove', onMouseMove);
      map.un('moveend', onMoveEnd);
    };
  }, [mapId, onMouseMove, onMoveEnd, positionMode]);

  useEffect(() => {
    let opacityTimeout: string | number | NodeJS.Timeout | undefined;
    // on map crosshair enable\disable, set variable for WCAG mouse position
    // TODO: On crosshaih, add crosshair center information to screen reader / mouse position component
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_CROSSHAIR_ENABLE_DISABLE,
      (payload) => {
        if (payloadIsABoolean(payload)) {
          if (payload.handlerName!.includes(mousePositionMapId)) {
            isCrosshairsActive.current = payload.status;
          }
        }
      },
      mapId
    );

    api.event.on(
      EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_EXPAND_COLLAPSE,
      (payload) => {
        if (payloadIsABoolean(payload)) {
          if (payload.handlerName!.includes(mousePositionMapId)) {
            if (payload.status) {
              opacityTimeout = setTimeout(() => setExpanded(payload.status), 300);
            } else {
              setExpanded(payload.status);
            }
            setMousePositionText(payload.status);
          }
        }
      },
      mapId
    );

    return () => {
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_CROSSHAIR_ENABLE_DISABLE, mapId);
      api.event.off(EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_EXPAND_COLLAPSE, mapId);
      clearTimeout(opacityTimeout);
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
          <Box component="span" className={classes.mousePositionText} sx={{ display: mousePositionText ? 'none' : 'block' }}>
            {positions[positionMode]}
          </Box>
        </Box>
      </button>
    </Tooltip>
  );
}
