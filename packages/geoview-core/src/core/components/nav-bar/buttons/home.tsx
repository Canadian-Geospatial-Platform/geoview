import { useTheme } from '@mui/material/styles';

import { IconButton, HomeIcon } from '@/ui';
import { getSxClasses } from '@/core/components/nav-bar/nav-bar-style';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';

/**
 * Create a home button to return the user to the map center
 *
 * @returns {JSX.Element} the created home button
 */
export default function Home(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/home');

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get store actions
  const { zoomToInitialExtent } = useMapStoreActions();

  /**
   * Handles a click on the home button
   */
  const handleZoom = (): void => {
    zoomToInitialExtent().catch((error) => {
      // Log
      logger.logPromiseFailed('Failed to zoomToInitialExtent in home.handleZoom', error);
    });
  };

  return (
    <IconButton id="home" tooltip="mapnav.home" tooltipPlacement="left" onClick={handleZoom} sx={sxClasses.navButton}>
      <HomeIcon />
    </IconButton>
  );
}
