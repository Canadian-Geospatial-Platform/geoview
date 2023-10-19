import { useContext, useEffect, useState } from 'react';

import { ScaleLine } from 'ol/control';
import { useTranslation } from 'react-i18next';

import makeStyles from '@mui/styles/makeStyles';

import { useStore } from 'zustand';
import { getGeoViewStore } from '@/core/stores/stores-managers';

import { MapContext } from '@/core/app-start';
import { CheckIcon, Tooltip, Box } from '@/ui';

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
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const { t } = useTranslation<string>();

  // internal component state
  const [scaleMode, setScaleMode] = useState<number>(0);
  const [lineWidth, setLineWidth] = useState<string>('');
  const [scaleGraphic, setScaleGraphic] = useState<string>('');
  const [scaleNumeric, setScaleNumeric] = useState<string>('');

  // get the values from store
  const expanded = useStore(getGeoViewStore(mapId), (state) => state.footerBarState.expanded);
  const mapElement = useStore(getGeoViewStore(mapId), (state) => state.mapState.mapElement);

  // TODO: remove make style
  const classes = useStyles();

  /**
   * Switch the scale mode
   */
  const switchScale = () => {
    setScaleMode((scaleMode + 1) % 2);
  };

  // set the active (visible) or not active (hidden) from geolocator button click
  const scaleValues: TypeScale[] = [
    {
      scaleId: '0',
      label: scaleGraphic,
      borderBottom: true,
    },
    {
      scaleId: '1',
      label: scaleNumeric,
      borderBottom: false,
    },
  ];

  useEffect(() => {
    let scaleBar: ScaleLine;
    let scaleLine: ScaleLine;
    // eslint-disable-next-line @typescript-eslint/ban-types
    let unsubMapCenterCoord: Function;

    if (mapElement !== undefined) {
      scaleBar = new ScaleLine({
        units: 'metric',
        target: document.getElementById(`${mapId}-scaleControlBar`) as HTMLElement,
        bar: true,
        text: true,
      });

      scaleLine = new ScaleLine({
        units: 'metric',
        target: document.getElementById(`${mapId}-scaleControlLine`) as HTMLElement,
      });

      mapElement.addControl(scaleLine);
      mapElement.addControl(scaleBar);

      // if mapCenterCoordinates changed, map move end event has been triggered
      unsubMapCenterCoord = getGeoViewStore(mapId).subscribe(
        (state) => state.mapState.mapCenterCoordinates,
        (curCoords, prevCoords) => {
          if (curCoords !== prevCoords) {
            setLineWidth(
              (document.getElementById(`${mapId}-scaleControlLine`)?.querySelector('.ol-scale-line-inner') as HTMLElement)?.style
                .width as string
            );
            setScaleGraphic(
              document.getElementById(`${mapId}-scaleControlLine`)?.querySelector('.ol-scale-line-inner')?.innerHTML as string
            );
            setScaleNumeric(document.getElementById(`${mapId}-scaleControlBar`)?.querySelector('.ol-scale-text')?.innerHTML as string);
          }
        },
        {
          fireImmediately: true,
        }
      );
    }

    return () => {
      if (mapElement !== undefined) {
        mapElement.removeControl(scaleLine);
        mapElement.removeControl(scaleBar);
        unsubMapCenterCoord();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapElement]);

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
                width: !scaleValues[scaleMode].borderBottom ? 'inherit' : lineWidth,
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
