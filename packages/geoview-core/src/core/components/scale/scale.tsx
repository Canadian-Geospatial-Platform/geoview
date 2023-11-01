import { useContext, useEffect, useState } from 'react';

import { ScaleLine } from 'ol/control';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material';
import { getGeoViewStore } from '@/core/stores/stores-managers';

import { MapContext } from '@/core/app-start';
import { CheckIcon, Tooltip, Box, Button } from '@/ui';
import { getSxClasses } from './scale-style';
import { useMapElement, useMapStoreActions } from '@/core/stores/map-state';
import { useUIFooterBarExpanded } from '@/core/stores/ui-state';

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
  const expanded = useUIFooterBarExpanded(mapId);

  const mapElement = useMapElement(mapId); // useStore(getGeoViewStore(mapId), (state) => state.mapState.mapElement);
  const { setMessage } = useMapStoreActions(mapId);
  setMessage();

  const theme = useTheme();

  const sxClasses = getSxClasses(theme);

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
        <Box id={`${mapId}-scaleControlBar`} sx={sxClasses.scaleControl} />
        <Box id={`${mapId}-scaleControlLine`} sx={sxClasses.scaleControl} />
        <Button onClick={() => switchScale()} type="text" sx={sxClasses.scaleContainer} disableRipple>
          {expanded ? (
            <Box sx={sxClasses.scaleExpandedContainer}>
              {scaleValues.map((value, index) => {
                return (
                  <Box sx={sxClasses.scaleExpandedCheckmarkText} key={value.scaleId}>
                    <CheckIcon sx={{ ...sxClasses.scaleCheckmark, fontSize: 25, opacity: scaleMode === index ? 1 : 0 }} />
                    <Box component="span" sx={{ ...sxClasses.scaleText, borderBottom: !value.borderBottom ? 'none' : '1px solid' }}>
                      {value.label}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Box
              component="span"
              sx={{
                ...sxClasses.scaleText,
                borderBottom: !scaleValues[scaleMode].borderBottom ? 'none' : '1px solid',
                width: !scaleValues[scaleMode].borderBottom ? 'inherit' : lineWidth,
              }}
            >
              {scaleValues[scaleMode].label}
            </Box>
          )}
        </Button>
      </Box>
    </Tooltip>
  );
}
