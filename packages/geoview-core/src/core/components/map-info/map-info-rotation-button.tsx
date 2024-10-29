import { useTheme } from '@mui/material/styles';
import { useRef } from 'react';
import { ArrowUpIcon, IconButton } from '@/ui';
import { useMapRotation, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';

/**
 * Map Information Rotation Button component
 *
 * @returns {JSX.Element} the rotation buttons
 */
export function MapInfoRotationButton(): JSX.Element {
  const theme = useTheme();
  // internal state
  const iconRef = useRef(null);

  // get the values from store
  const mapRotation = useMapRotation();
  const { setRotation } = useMapStoreActions();

  return (
    <IconButton
      tooltipPlacement="top"
      tooltip="mapctrl.rotation.resetRotation"
      aria-label="mapctrl.rotation.resetRotation"
      onClick={() => setRotation(0)}
      sx={{ color: theme.palette.geoViewColor.bgColor.light[800] }}
    >
      <ArrowUpIcon ref={iconRef} style={{ transform: `rotate(${mapRotation}rad)` }} />
    </IconButton>
  );
}
