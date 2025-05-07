import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { IconButton, ZoomOutIcon } from '@/ui';
import { getSxClasses } from '@/core/components/nav-bar/nav-bar-style';
import { useMapStoreActions, useMapZoom } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { useCesiumStoreActions } from '@/core/stores/store-interface-and-intial-values/cesium-state';
import { useAppShow3dMap } from '@/app';

/**
 * Create a zoom out button
 *
 * @returns {JSX.Element} return the new created zoom out button
 */
export default function ZoomOut(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/zoom-out');

  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get store values
  const zoom = useMapZoom();
  const { setZoom } = useMapStoreActions();

  const { zoomOut } = useCesiumStoreActions();
  const show3dMap = useAppShow3dMap();

  /**
   * Handles a click on one of the zoom buttons
   */
  const handleZoom = (): void => {
    if (show3dMap) {
      zoomOut();
    } else {
      setZoom(zoom - 0.5);
    }
  };

  return (
    <IconButton id="zoomOut" tooltip={t('mapnav.zoomOut') as string} tooltipPlacement="left" onClick={handleZoom} sx={sxClasses.navButton}>
      <ZoomOutIcon />
    </IconButton>
  );
}
