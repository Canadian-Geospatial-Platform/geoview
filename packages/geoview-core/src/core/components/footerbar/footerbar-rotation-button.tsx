import { useContext, useEffect, useRef } from 'react';

import { View } from 'ol';

import { useTranslation } from 'react-i18next';

import makeStyles from '@mui/styles/makeStyles';

import { ArrowUpIcon, IconButton } from '../../../ui';

import { MapContext } from '../../app-start';
import { api } from '../../../app';

export const useStyles = makeStyles((theme) => ({
  roationIcon: {
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

  useEffect(() => {
    const { map } = api.map(mapId);

    map.getView().on('change:rotation', (e) => {
      const rotation = (e.target as View).getRotation();

      if (iconRef && iconRef.current) {
        const icon = iconRef.current as HTMLElement;

        icon.style.transform = `rotate(${rotation}rad)`;
      }
    });
  }, [mapId]);

  return (
    <IconButton
      tooltipPlacement="bottom"
      tooltip={t('mapctrl.rotation.resetRotation')}
      title={t('mapctrl.rotation.resetRotation')}
      onClick={() => resetRotation()}
    >
      <ArrowUpIcon ref={iconRef} className={`${classes.roationIcon}`} />
    </IconButton>
  );
}
