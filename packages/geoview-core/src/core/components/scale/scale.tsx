/* eslint-disable react/no-this-in-sfc */
/* eslint-disable no-underscore-dangle */
import { useContext, useEffect, useState } from 'react';

import { ScaleLine } from 'ol/control';

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
 * Create an element that displays the scale
 *
 * @returns {JSX.Element} created scale element
 */
export function Scale(): JSX.Element {
  const [scaleText, setScaleText] = useState('1');

  const mapConfig = useContext(MapContext);

  const mapId = mapConfig.id;

  const classes = useStyles();

  useEffect(() => {
    const { map } = api.map(mapId);

    const selectScale = new ScaleLine({ units: 'metric', target: undefined });

    map.addControl(selectScale);

    map.on('moveend', () => {
      const scale = map.getTargetElement().querySelector('.ol-scale-line-inner')?.innerHTML;

      setScaleText(scale!);
    });
  }, [mapId]);

  return (
    <div className={classes.scaleContainer}>
      <span id="scaleText" className={classes.scaleText}>
        {scaleText}
      </span>
    </div>
  );
}
