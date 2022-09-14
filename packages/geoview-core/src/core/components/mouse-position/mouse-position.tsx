import { useCallback, useState, useEffect, useRef, useContext } from 'react';

import { Coordinate } from 'ol/coordinate';
import { fromLonLat, toLonLat } from 'ol/proj';

import makeStyles from '@mui/styles/makeStyles';

import { useTranslation } from 'react-i18next';

import { debounce } from 'lodash';

import { api } from '../../../app';
import { MapContext } from '../../app-start';

import { EVENT_NAMES } from '../../../api/events/event-types';
import { payloadIsABoolean } from '../../../api/events/payloads/boolean-payload';

import { CheckIcon } from '../../../ui';

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
    maxHeight: '15px',
    height: '15px',
  },
  mousePositionCheckmark: {
    paddingRight: 5,
    fontSize: `20px !important`,
    color: theme.palette.primary.light,
  },
  mousePositionText: {
    fontSize: theme.typography.subtitle2.fontSize,
    color: theme.palette.primary.light,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
}));

// degree char
const deg = String.fromCharCode(176);

/**
 * Format the coordinates for degrees - minutes - seconds
 * @param {number} value the value to format
 * @param {string} card the cardinality north/south or east/west
 * @returns {string} the formatted value
 */
function coordFormnat(value: number, card: string): string {
  const d = Math.floor(Math.abs(value)) * (value < 0 ? -1 : 1);
  const m = Math.floor(Math.abs((value - d) * 60));
  const s = Math.round((Math.abs(value) - Math.abs(d) - m / 60) * 3600);
  return `${Math.abs(d)}${deg} ${m >= 10 ? `${m}` : `0${m}`}' ${s >= 10 ? `${s}` : `0${s}`}" ${card}`;
}

/**
 * Mouse position properties interface
 */
interface MousePositionProps {
  id: string;
}

/**
 * Create the mouse position
 * @param {MousePositionProps} props the mouse position properties
 * @returns {JSX.Element} the mouse position component
 */
export function MousePosition(props: MousePositionProps): JSX.Element {
  const { id } = props;

  const [expanded, setExpanded] = useState(false);

  const { t } = useTranslation<string>();

  const classes = useStyles();

  const [positions, setPositions] = useState<string[]>(['', '', '']);

  // const [position, setPosition] = useState({ lng: '--', lat: '--' });

  const [positionMode, setPositionMode] = useState<number>(0);

  // keep track of crosshair status to know when update coord from keyboard navigation
  const isCrosshairsActive = useRef(false);

  const mapConfig = useContext(MapContext);

  const mapId = mapConfig.id;

  /**
   * Format the coordinates output
   * @param {Coordinate} lnglat the Lng and Lat value to format
   */
  function formatCoord(lnglat: Coordinate) {
    const lng = coordFormnat(lnglat[0], lnglat[0] < 0 ? t('mapctrl.mouseposition.west') : t('mapctrl.mouseposition.east'));
    const lat = coordFormnat(lnglat[1], lnglat[1] > 0 ? t('mapctrl.mouseposition.north') : t('mapctrl.mouseposition.south'));

    return { lng, lat };
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onMouseMove = useCallback(
    debounce((e) => {
      const projection = api.projection.projections[api.map(mapId).currentProjection];

      const coordinate = toLonLat(e.coordinate, projection);

      const formatedCoorinate = formatCoord(coordinate);

      const projectedCoordinate = fromLonLat([coordinate[0], coordinate[1]], projection);

      setPositions([
        `${formatedCoorinate.lng} | ${formatedCoorinate.lat}`,
        `${coordinate[0].toFixed(4)} W | ${coordinate[1].toFixed(4)} N`,
        `${projectedCoordinate[0].toFixed(4)}m W | ${projectedCoordinate[1].toFixed(4)}m N`,
      ]);
    }, 10),
    [t, positionMode]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onMoveEnd = useCallback(
    debounce((e) => {
      const projection = api.projection.projections[api.map(mapId).currentProjection];

      const coordinate = toLonLat(e.map.getView().getCenter(), api.projection.projections[api.map(mapId).currentProjection]);

      const projectedCoordinate = fromLonLat([coordinate[0], coordinate[1]], projection);

      // if (isCrosshairsActive.current) {
      const formatedCoorinate = formatCoord(coordinate);

      setPositions([
        `${formatedCoorinate.lng} | ${formatedCoorinate.lat}`,
        `${coordinate[0].toFixed(4)} W | ${coordinate[1].toFixed(4)} N`,
        `${projectedCoordinate[0].toFixed(4)}m W | ${projectedCoordinate[1].toFixed(4)}m N`,
      ]);

      // }
    }, 10),
    [t, positionMode]
  );

  /**
   * Switch position mode
   */
  const switchPositionMode = () => {
    const { map } = api.map(mapId);

    const projection = api.projection.projections[api.map(mapId).currentProjection];

    const coordinate = toLonLat(map.getView().getCenter()!, api.projection.projections[api.map(mapId).currentProjection]);

    const formatedCoorinate = formatCoord(coordinate);

    const projectedCoordinate = fromLonLat([coordinate[0], coordinate[1]], projection);

    setPositions([
      `${formatedCoorinate.lng} | ${formatedCoorinate.lat}`,
      `${coordinate[0].toFixed(4)} W | ${coordinate[1].toFixed(4)} N`,
      `${projectedCoordinate[0].toFixed(4)}m W | ${projectedCoordinate[1].toFixed(4)}m N`,
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
    // on map crosshair enable\disable, set variable for WCAG mouse position
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_CROSSHAIR_ENABLE_DISABLE,
      (payload) => {
        if (payloadIsABoolean(payload)) {
          if (payload.handlerName!.includes(id)) {
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
          if (payload.handlerName!.includes(id)) {
            setExpanded(payload.status);
          }
        }
      },
      mapId
    );

    return () => {
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_CROSSHAIR_ENABLE_DISABLE, mapId);
      api.event.off(EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_EXPAND_COLLAPSE, mapId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button type="button" onClick={() => switchPositionMode()} className={classes.mousePositionContainer}>
      <div className={classes.mousePositionTextContainer}>
        {expanded ? (
          positions.map((position, index) => {
            return (
              // eslint-disable-next-line react/no-array-index-key
              <div className={classes.mousePositionTextCheckmarkContainer} key={index}>
                {index === positionMode && <CheckIcon className={classes.mousePositionCheckmark} />}
                <span className={classes.mousePositionText}>{position}</span>
              </div>
            );
          })
        ) : (
          <span className={classes.mousePositionText}>{positions[positionMode]}</span>
        )}
      </div>
    </button>
  );
}
