import { useContext, useEffect, useRef } from 'react';

import { View } from 'ol';

import { useTranslation } from 'react-i18next';

import makeStyles from '@mui/styles/makeStyles';

import { ArrowUpIcon, IconButton } from '../../../ui';

import { MapContext } from '../../app-start';
import { api } from '../../../app';

import { EVENT_NAMES } from '../../../api/events/event-types';
import { payloadIsAMapViewProjection } from '../../../api/events/payloads/map-view-projection-payload';

const useStyles = makeStyles((theme) => ({
  rotationIcon: {
    fontSize: `${theme.typography.fontSize}px !important`,
    color: `${theme.palette.primary.light}`,
  },
}));

/**
 * Footerbar Rotation Button component
 *
 * @returns {JSX.Element} the rotation buttons
 */
export function FooterbarRotationButton(): JSX.Element {
  const classes = useStyles();

  const mapConfig = useContext(MapContext);
  const mapId = mapConfig.id;

  const { t } = useTranslation<string>();

  const iconRef = useRef(null);

  /**
   * Reset the map rotation
   */
  const resetRotation = () => {
    const { map } = api.map(mapId);

    map.getView().animate({
      rotation: 0,
    });
  };

  /**
   * Set the rotation icon on masp view rotation change
   */
  const setViewRotationEvent = () => {
    const { map } = api.map(mapId);

    map.getView().on('change:rotation', (e) => {
      const rotation = (e.target as View).getRotation();

      if (iconRef && iconRef.current) {
        const icon = iconRef.current as HTMLElement;

        icon.style.transform = `rotate(${rotation}rad)`;
      }
    });
  };

  useEffect(() => {
    // set rotation change event
    setViewRotationEvent();

    // listen to geoview-basemap-panel package change projection event to reset icon rotation
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE,
      (payload) => {
        if (payload.handlerName === mapId && payloadIsAMapViewProjection(payload)) {
          // reset icon rotation to 0 because the new view rotation is 0
          // will be set again by proper function if needed (i.e. if fix north switch is checked)
          if (iconRef && iconRef.current) {
            const icon = iconRef.current as HTMLElement;
            icon.style.transform = `rotate(${0}rad)`;
          }

          // recreate the event on projection change because there is a new view
          setViewRotationEvent();
        }
      },
      mapId
    );

    return () => {
      api.event.off(EVENT_NAMES.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE, mapId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <IconButton
      tooltipPlacement="bottom"
      tooltip={t('mapctrl.rotation.resetRotation')}
      title={t('mapctrl.rotation.resetRotation')}
      onClick={() => resetRotation()}
    >
      <ArrowUpIcon ref={iconRef} className={`${classes.rotationIcon}`} />
    </IconButton>
  );
}
