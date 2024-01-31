import { useRef } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material';
import { ArrowUpIcon, IconButton } from '@/ui';
import { getSxClasses } from './footer-bar-style';
import { useMapRotation, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';

/**
 * Footerbar Rotation Button component
 *
 * @returns {JSX.Element} the rotation buttons
 */
export function FooterbarRotationButton(): JSX.Element {
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state
  const iconRef = useRef(null);

  // get the values from store
  const mapRotation = useMapRotation();
  const { setRotation } = useMapStoreActions();

  return (
    <IconButton
      sx={sxClasses.sxClassesRotationButton.rotationButton}
      tooltipPlacement="top"
      tooltip={t('mapctrl.rotation.resetRotation')!}
      title={t('mapctrl.rotation.resetRotation')!}
      onClick={() => setRotation(0)}
    >
      <ArrowUpIcon ref={iconRef} sx={sxClasses.sxClassesRotationButton.rotationIcon} style={{ transform: `rotate(${mapRotation}rad)` }} />
    </IconButton>
  );
}
