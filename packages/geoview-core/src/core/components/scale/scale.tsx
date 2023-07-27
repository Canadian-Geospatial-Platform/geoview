import { useContext, useEffect, useState } from 'react';

import { ScaleLine } from 'ol/control';
import { MapEvent } from 'ol';
import { useTranslation } from 'react-i18next';

import makeStyles from '@mui/styles/makeStyles';

import { api } from '@/app';

import { MapContext } from '../../app-start';
import { EVENT_NAMES } from '@/api/events/event-types';

import { CheckIcon, Tooltip, Box } from '@/ui';
import { payloadIsABoolean } from '@/api/events/payloads';

const useStyles = makeStyles((theme) => ({
  scaleControl: {
    display: 'none',
  },
  scaleContainer: {
    display: 'flex',
    backgroundColor: 'transparent',
    border: 'none',
    height: '100%',
  },
  scaleExpandedContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
    gap: theme.spacing(5),
  },
  scaleExpandedCheckmarkText: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '18px',
    maxHeight: '18px',
  },
  scaleText: {
    fontSize: theme.typography.fontSize,
    color: theme.palette.primary.light,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    border: '1px solid',
    borderColor: theme.palette.primary.light,
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
  },
  scaleCheckmark: {
    paddingRight: 5,
    color: theme.palette.primary.light,
  },
}));

interface TypeScale {
  scaleId: string;
  label: string;
  borderBottom: boolean;
}

/**
 * Create an element that displays the scale
 *
 * @returns {JSX.Element} created scale element
 */
export function Scale(): JSX.Element {
  const { t } = useTranslation<string>();
  const [scaleMode, setScaleMode] = useState<number>(0);
  const [scaleValues, setScaleValues] = useState<TypeScale[]>([
    {
      scaleId: '0',
      label: '',
      borderBottom: false,
    },
    {
      scaleId: '1',
      label: '',
      borderBottom: false,
    },
  ]);
  const [expanded, setExpanded] = useState<boolean>(false);

  const mapConfig = useContext(MapContext);

  const { mapId } = mapConfig;

  const classes = useStyles();

  /**
   * Switch the scale mode
   */
  const switchScale = () => {
    setScaleMode((scaleMode + 1) % 2);
  };

  const onMoveEnd = (e: MapEvent) => {
    const { map } = e;

    const eventMapId = map.get('mapId');

    const scaleLineText = document.getElementById(`${eventMapId}-scaleControlLine`)?.querySelector('.ol-scale-line-inner')
      ?.innerHTML as string;
    const scaleBarText = document.getElementById(`${eventMapId}-scaleControlBar`)?.querySelector('.ol-scale-text')?.innerHTML as string;

    setScaleValues([
      { scaleId: '0', label: scaleLineText, borderBottom: true },
      { scaleId: '1', label: scaleBarText, borderBottom: false },
    ]);
  };

  useEffect(() => {
    const { map } = api.map(mapId);

    const scaleBar = new ScaleLine({
      units: 'metric',
      target: document.getElementById(`${mapId}-scaleControlBar`) as HTMLElement,
      bar: true,
      text: true,
    });

    const scaleLine = new ScaleLine({
      units: 'metric',
      target: document.getElementById(`${mapId}-scaleControlLine`) as HTMLElement,
    });

    map.addControl(scaleLine);
    map.addControl(scaleBar);

    map.on('moveend', onMoveEnd);

    api.event.on(
      EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_EXPAND_COLLAPSE,
      (payload) => {
        if (payloadIsABoolean(payload)) {
          setExpanded(payload.status);
        }
      },
      mapId
    );

    return () => {
      map.removeControl(scaleLine);
      map.removeControl(scaleBar);
      map.un('moveend', onMoveEnd);
      api.event.off(EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_EXPAND_COLLAPSE, mapId);
    };
  }, [mapId]);

  return (
    <Tooltip title={t('mapnav.scale')!} placement="top">
      <Box sx={{ minWidth: 120 }}>
        <div id={`${mapId}-scaleControlBar`} className={classes.scaleControl} />
        <div id={`${mapId}-scaleControlLine`} className={classes.scaleControl} />
        <button type="button" onClick={() => switchScale()} className={classes.scaleContainer}>
          {expanded ? (
            <div className={classes.scaleExpandedContainer}>
              {scaleValues.map((value, index) => {
                return (
                  <div className={classes.scaleExpandedCheckmarkText} key={value.scaleId}>
                    <CheckIcon sx={{ fontSize: 25, opacity: scaleMode === index ? 1 : 0 }} className={classes.scaleCheckmark} />
                    <span
                      className={classes.scaleText}
                      style={{
                        borderBottom: !value.borderBottom ? 'none' : '1px solid',
                      }}
                    >
                      {value.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <span
              className={classes.scaleText}
              style={{
                borderBottom: !scaleValues[scaleMode].borderBottom ? 'none' : '1px solid',
              }}
            >
              {scaleValues[scaleMode].label}
            </span>
          )}
        </button>
      </Box>
    </Tooltip>
  );
}
