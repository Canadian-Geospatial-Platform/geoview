/* eslint-disable react/no-this-in-sfc */
/* eslint-disable no-underscore-dangle */
import { useContext, useEffect, useState } from 'react';

import makeStyles from '@mui/styles/makeStyles';

import { api } from '../../../app';

import { MapContext } from '../../app-start';

import { TypeUpdateScaleEvent } from '../../types/cgpv-types';

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
    const scaleControl = L.control.scale({
      position: 'bottomleft',
      imperial: false,
    });

    map.on('scaleupdate', (event) => {
      setScaleText((event as unknown as TypeUpdateScaleEvent).distance);
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
