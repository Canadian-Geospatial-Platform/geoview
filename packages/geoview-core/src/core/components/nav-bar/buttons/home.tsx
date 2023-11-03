import { useTheme } from '@mui/material/styles';

import { IconButton, HomeIcon } from '@/ui';
import { getSxClasses } from '../nav-bar-style';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';

/**
 * Create a home button to return the user to the map center
 *
 * @returns {JSX.Element} the created home button
 */
export default function Home(): JSX.Element {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get store actions
  const { zoomToInitialExtent } = useMapStoreActions();

  return (
    <IconButton id="home" tooltip="mapnav.home" tooltipPlacement="left" onClick={() => zoomToInitialExtent()} sx={sxClasses.navButton}>
      <HomeIcon />
    </IconButton>
  );
}
