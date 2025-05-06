import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import { IconButton, HomeIcon } from '@/ui';
import { getSxClasses } from '@/core/components/nav-bar/nav-bar-style';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { useCesiumStoreActions } from '@/core/stores/store-interface-and-intial-values/cesium-state';
import { useAppShow3dMap } from '@/app';

/**
 * Create a home button to return the user to the map center
 *
 * @returns {JSX.Element} the created home button
 */
export default function Home(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/home');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Store actions
  const { zoomToInitialExtent } = useMapStoreActions();
  const { zoomToHome } = useCesiumStoreActions();
  const show3dMap = useAppShow3dMap();

  /**
   * Handles a click on the home button
   */
  const handleZoom = (): void => {
    if (show3dMap) {
      zoomToHome();
    } else {
      zoomToInitialExtent().catch((error) => {
        // Log
        logger.logPromiseFailed('Failed to zoomToInitialExtent in home.handleZoom', error);
      });
    }
  };

  return (
    <IconButton id="home" tooltip={t('mapnav.home') as string} tooltipPlacement="left" onClick={handleZoom} sx={sxClasses.navButton}>
      <HomeIcon />
    </IconButton>
  );
}
