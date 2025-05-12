import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { IconButton, ZoomInIcon } from '@/ui';
import { getSxClasses } from '@/core/components/nav-bar/nav-bar-style';
import { useMapStoreActions, useMapZoom } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { useCesiumStoreActions } from '@/core/stores/store-interface-and-intial-values/cesium-state';
import { useAppShow3dMap } from '@/app';

/**
 * Create a zoom in button
 *
 * @returns {JSX.Element} return the created zoom in button
 */
export default function ZoomIn(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/zoom-in');

  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get store values
  const zoom = useMapZoom();
  const { setZoom } = useMapStoreActions();
  const { zoomIn } = useCesiumStoreActions();
  const show3dMap = useAppShow3dMap();

  /**
   * Handles a click on one of the zoom buttons
   */
  const handleZoom = (): void => {
    if (show3dMap) {
      zoomIn();
    } else {
      setZoom(zoom + 0.5);
    }
  };

  return (
    <IconButton id="zoomIn" tooltip={t('mapnav.zoomIn') as string} tooltipPlacement="left" onClick={handleZoom} sx={sxClasses.navButton}>
      <ZoomInIcon />
    </IconButton>
  );
}
