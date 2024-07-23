import { useRef } from 'react';

import { useTheme } from '@mui/material';
import { ArrowUpIcon, IconButton } from '@/ui';
import { getSxClasses } from './map-info-style';
import { useMapRotation, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';

/**
 * Map Information Rotation Button component
 *
 * @returns {JSX.Element} the rotation buttons
 */
export function MapInfoRotationButton(): JSX.Element {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const tooltipAndAria = 'mapctrl.rotation.resetRotation';

  // internal state
  const iconRef = useRef(null);

  // get the values from store
  const mapRotation = useMapRotation();
  const { setRotation } = useMapStoreActions();

  return (
    <IconButton
      sx={sxClasses.rotationButton.rotationButton}
      tooltipPlacement="top"
      tooltip={tooltipAndAria}
      aria-label={tooltipAndAria}
      onClick={() => setRotation(0)}
    >
      <ArrowUpIcon ref={iconRef} sx={sxClasses.rotationButton.rotationIcon} style={{ transform: `rotate(${mapRotation}rad)` }} />
    </IconButton>
  );
}
