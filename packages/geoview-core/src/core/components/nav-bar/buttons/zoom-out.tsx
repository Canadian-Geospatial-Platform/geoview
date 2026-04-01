import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { IconButton, ZoomOutIcon } from '@/ui';
import { getSxClasses } from '@/core/components/nav-bar/nav-bar-style';
import { useStoreMapZoom } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { useMapController } from '@/core/controllers/map-controller';

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

  return (
    <IconButton
      id="zoomOut"
      aria-label={t('mapnav.zoomOut')}
      tooltipPlacement="left"
      onClick={() => mapController.zoomMapAndForget(zoom - 0.5)}
      sx={sxClasses.navButton}
    >
      <ZoomOutIcon />
    </IconButton>
  );
}
