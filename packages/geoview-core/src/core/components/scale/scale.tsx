import { useContext, useEffect, useState } from 'react';

import { ScaleLine } from 'ol/control';

import makeStyles from '@mui/styles/makeStyles';

import { api } from '../../../app';

import { MapContext } from '../../app-start';

const useStyles = makeStyles((theme) => ({
  scaleContainer: {
    backgroundColor: 'transparent',
    border: 'none',
    '& .ol-scale-line, .ol-scale-bar': {
      display: 'flex',
      padding: theme.spacing(0, 4),
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      alignItems: 'center',
      position: 'relative',
      left: 'auto',
      bottom: 'auto',
    },
    '& .ol-scale-bar-inner': {
      width: '100% !important',
    },
    '& .ol-scale-line-inner, .ol-scale-text': {
      display: 'block',
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
      width: '100% !important',
      position: 'initial',
      textShadow: 'initial',
    },
    '& .ol-scale-step-marker, .ol-scale-singlebar, .ol-scale-step-text': {
      display: 'none',
    },
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
  const [scaleMode, setScaleMode] = useState<'line' | 'bar'>('line');
  const [scaleControl, setScaleControl] = useState<ScaleLine>();

  const mapConfig = useContext(MapContext);

  const mapId = mapConfig.id;

  const classes = useStyles();

  /**
   * Switch the scale mode
   */
  const switchScale = () => {
    const { map } = api.map(mapId);

    map.removeControl(scaleControl!);

    let selectScale = null;

    if (scaleMode === 'bar') {
      setScaleMode('line');
      selectScale = new ScaleLine({ units: 'metric', target: document.getElementById(`${mapId}-scaleControl`) as HTMLElement });
    } else {
      setScaleMode('bar');
      selectScale = new ScaleLine({
        units: 'metric',
        target: document.getElementById(`${mapId}-scaleControl`) as HTMLElement,
        bar: true,
        text: true,
      });
    }

    map.addControl(selectScale!);
    setScaleControl(selectScale!);
  };

  useEffect(() => {
    const { map } = api.map(mapId);

    const selectScale = new ScaleLine({ units: 'metric', target: document.getElementById(`${mapId}-scaleControl`) as HTMLElement });

    map.addControl(selectScale);

    setScaleControl(selectScale);
  }, [mapId]);

  return <button type="button" id={`${mapId}-scaleControl`} onClick={() => switchScale()} className={classes.scaleContainer} />;
}
