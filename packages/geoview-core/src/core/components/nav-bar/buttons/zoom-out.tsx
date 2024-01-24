import { useTheme } from '@mui/material/styles';

import { IconButton, ZoomOutIcon } from '@/ui';
import { getSxClasses } from '../nav-bar-style';
import { useMapStoreActions, useMapZoom } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';

/**
 * Create a zoom out button
 *
 * @returns {JSX.Element} return the new created zoom out button
 */
export default function ZoomOut(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/zoom-out');

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get store values
  const zoom = useMapZoom();
  const { setZoom } = useMapStoreActions();

  return (
    <IconButton id="zoomOut" tooltip="mapnav.zoomOut" tooltipPlacement="left" onClick={() => setZoom(zoom - 0.5)} sx={sxClasses.navButton}>
      <ZoomOutIcon />
    </IconButton>
  );
}
