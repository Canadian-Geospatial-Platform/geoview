import { useContext, useRef } from 'react';

import { useTranslation } from 'react-i18next';

import { useStore } from 'zustand';
import { getGeoViewStore } from '@/core/stores/stores-managers';

import { ArrowUpIcon, IconButton } from '@/ui';
import { MapContext } from '@/core/app-start';
import { sxClassesRotationButton } from './footer-bar-style';

/**
 * Footerbar Rotation Button component
 *
 * @returns {JSX.Element} the rotation buttons
 */
export function FooterbarRotationButton(): JSX.Element {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const { t } = useTranslation<string>();

  const iconRef = useRef(null);

  // get the values from store
  const mapRotation = useStore(getGeoViewStore(mapId), (state) => state.mapState.mapRotation);
  const mapElement = useStore(getGeoViewStore(mapId), (state) => state.mapState.mapElement);

  return (
    <IconButton
      sx={sxClassesRotationButton.rotationButton}
      tooltipPlacement="top"
      tooltip={t('mapctrl.rotation.resetRotation')!}
      title={t('mapctrl.rotation.resetRotation')!}
      onClick={() => mapElement.getView().animate({ rotation: 0 })}
    >
      <ArrowUpIcon ref={iconRef} sx={sxClassesRotationButton.rotationIcon} style={{ transform: `rotate(${mapRotation}rad)` }} />
    </IconButton>
  );
}
