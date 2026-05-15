import { useCallback } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import { IconButton, ZoomOutIcon } from '@/ui';
import { getSxClasses } from '@/core/components/nav-bar/nav-bar-style';
import { useStoreMapZoom } from '@/core/stores/states/map-state';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import { useMapController } from '@/core/controllers/use-controllers';

/**
 * Creates a zoom out button.
 *
 * @returns The zoom out button
 */
export default function ZoomOut(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/zoom-out');

  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get store values
  const zoom = useStoreMapZoom();
  const mapController = useMapController();
  const mapId = useStoreGeoViewMapId();

  // #region Handlers

  /**
   * Handles when the user clicks to zoom out.
   */
  const handleZoomOut = useCallback((): void => {
    mapController.zoomMapAndForget(zoom - 0.5);
  }, [mapController, zoom]);

  // #endregion Handlers

  return (
    <IconButton
      id={`${mapId}-button-zoom-out`}
      aria-label={t('mapnav.zoomOut')}
      tooltipPlacement="left"
      onClick={handleZoomOut}
      sx={sxClasses.navButton}
    >
      <ZoomOutIcon />
    </IconButton>
  );
}
