import { useTheme } from '@mui/material/styles';

import { IconButton, ZoomInIcon } from '@/ui';
import { getSxClasses } from '../nav-bar-style';
import { useMapStoreActions, useMapZoom } from '@/core/stores/store-interface-and-intial-values/map-state';

/**
 * Create a zoom in button
 *
 * @returns {JSX.Element} return the created zoom in button
 */
export default function ZoomIn(): JSX.Element {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get store values
  const zoom = useMapZoom();
  const { setZoom } = useMapStoreActions();

  return (
    <IconButton id="zoomIn" tooltip="mapnav.zoomIn" tooltipPlacement="left" onClick={() => setZoom(zoom + 0.5)} sx={sxClasses.navButton}>
      <ZoomInIcon />
    </IconButton>
  );
}
