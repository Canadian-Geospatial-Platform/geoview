import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { IconButton, EmojiPeopleIcon } from '@/ui';
import { getSxClasses } from '@/core/components/nav-bar/nav-bar-style';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useAppStoreActions } from '@/core/stores/store-interface-and-intial-values/app-state';
import { logger } from '@/core/utils/logger';

/**
 * Create a location button to zoom to user location
 *
 * @returns {JSX.Element} the created location button
 */
export default function Location(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/location');

  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get store actions
  const { zoomToMyLocation } = useMapStoreActions();
  const { addNotification } = useAppStoreActions();

  const successCallback = (position: GeolocationPosition): void => {
    // Zoom to my location
    zoomToMyLocation(position).catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('Failed to zoomToMyLocation in location.successCallback', error);
    });
  };

  const errorCallback = (err: GeolocationPositionError): void => {
    addNotification({
      key: 'location',
      message: `ERROR(${err.code}): ${err.message}`,
      notificationType: 'warning',
      count: 0,
    });
  };

  /**
   * Handles a click to zoom to the user location when the user location can be retrieved
   */
  const handleZoomToMe = (): void => {
    // Try to get current position and callback
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
  };

  return (
    <IconButton id="location" aria-label={t('mapnav.location')} tooltipPlacement="left" onClick={handleZoomToMe} sx={sxClasses.navButton}>
      <EmojiPeopleIcon />
    </IconButton>
  );
}
