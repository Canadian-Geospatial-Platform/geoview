/* eslint-disable react/no-this-in-sfc */
/* eslint-disable no-underscore-dangle */
import { useContext, useEffect, useState } from 'react';

import makeStyles from '@mui/styles/makeStyles';

import { api } from '../../../app';

import { MapContext } from '../../app-start';

const useStyles = makeStyles((theme) => ({
  scaleContainer: {
    display: 'flex',
    padding: theme.spacing(0, 4),
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    alignItems: 'center',
  },
  scaleText: {
    fontSize: theme.typography.subtitle2.fontSize,
    color: theme.palette.primary.light,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    border: '1px solid',
    borderColor: theme.palette.primary.light,
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    lineHeight: 1,
    padding: '2px 5px 0px',
  },
}));

/**
 * Update scale event properties
 */
type UpdateScaleEvent = {
  pixels: number;
  distance: string;
};

/**
 * Create an element that displays the scale
 *
 * @returns {JSX.Element} created scale element
 */
export function Scale(): JSX.Element {
  const [scaleText, setScaleText] = useState('');

  const mapConfig = useContext(MapContext);

  const mapId = mapConfig.id;

  const { map } = api.map(mapId);

  const classes = useStyles();

  useEffect(() => {
    L.Control.Scale.include({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      _originalUpdateScale: (L.Control.Scale.prototype as any)._updateScale,
      _updateScale(scale: { style: { width: number } }, text: string, ratio: number) {
        this._originalUpdateScale.call(this, scale, text, ratio);
        this._map.fire('scaleupdate', {
          pixels: scale.style.width,
          distance: text,
        } as UpdateScaleEvent);
      },
    });

    const scaleControl = L.control.scale({
      position: 'bottomleft',
      imperial: false,
    });

    map.on('scaleupdate', (event) => {
      setScaleText((event as unknown as UpdateScaleEvent).distance);
    });

    scaleControl.addTo(map);

    return () => {
      map.off('scaleupdate');
    };
  }, [map]);

  return (
    <div className={classes.scaleContainer}>
      <span className={classes.scaleText}>{scaleText}</span>
    </div>
  );
}
