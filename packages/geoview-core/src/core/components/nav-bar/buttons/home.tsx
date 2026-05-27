import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import { IconButton, HomeIcon } from '@/ui';
import { getSxClasses } from '@/core/components/nav-bar/nav-bar-style';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import { useMapController } from '@/core/controllers/use-controllers';

/**
 * Creates a home button to return the user to the map center.
 *
 * @returns The home button
 */
export default function Home(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/home');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Store
  const mapController = useMapController();
  const mapId = useStoreGeoViewMapId();

  // #region Handlers

  /**
   * Handles when the user clicks the home button.
   */
  const handleZoom = (): void => {
    mapController.zoomToInitialExtent().catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('Failed to zoomToInitialExtent in home.handleZoom', error);
    });
  };

  // #endregion Handlers

  return (
    <IconButton
      id={`${mapId}-button-home`}
      aria-label={t('mapnav.home')}
      tooltipPlacement="left"
      onClick={handleZoom}
      sx={sxClasses.navButton}
    >
      <HomeIcon />
    </IconButton>
  );
}
