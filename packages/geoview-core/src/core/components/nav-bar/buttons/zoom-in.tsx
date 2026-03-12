import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { IconButton, ZoomInIcon } from '@/ui';
import { getSxClasses } from '@/core/components/nav-bar/nav-bar-style';
import { useMapZoom } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { useMapController } from '@/core/controllers/map-controller';

/**
 * Creates a zoom in button.
 *
 * @returns The zoom in button
 */
export default function ZoomIn(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/zoom-in');

  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get store values
  const zoom = useMapZoom();
  const mapController = useMapController();

  return (
    <IconButton
      id="zoomIn"
      aria-label={t('mapnav.zoomIn')}
      tooltipPlacement="left"
      onClick={() => mapController.zoomMapAndForget(zoom + 0.5)}
      sx={sxClasses.navButton}
    >
      <ZoomInIcon />
    </IconButton>
  );
}
