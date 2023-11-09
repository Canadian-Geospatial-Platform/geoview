import { useRef } from 'react';

import { useTranslation } from 'react-i18next';

import { ArrowUpIcon, IconButton } from '@/ui';
import { sxClassesRotationButton } from './footer-bar-style';
import { useMapRotation, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';

/**
 * Footerbar Rotation Button component
 *
 * @returns {JSX.Element} the rotation buttons
 */
export function FooterbarRotationButton(): JSX.Element {
  const { t } = useTranslation<string>();

  // internal state
  const iconRef = useRef(null);

  // get the values from store
  const mapRotation = useMapRotation();
  const { setRotation } = useMapStoreActions();

  return (
    <IconButton
      sx={sxClassesRotationButton.rotationButton}
      tooltipPlacement="top"
      tooltip={t('mapctrl.rotation.resetRotation')!}
      title={t('mapctrl.rotation.resetRotation')!}
      onClick={() => setRotation(0)}
    >
      <ArrowUpIcon ref={iconRef} sx={sxClassesRotationButton.rotationIcon} style={{ transform: `rotate(${mapRotation}rad)` }} />
    </IconButton>
  );
}
