import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { IconButton, FullscreenIcon, FullscreenExitIcon } from '@/ui';
import type { TypeHTMLElement } from '@/core/types/global-types';
import { getSxClasses } from '@/core/components/nav-bar/nav-bar-style';
import { useStoreAppIsFullscreenActive } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import { useUIController } from '@/core/controllers/use-controllers';

/**
 * Creates a toggle button to toggle between fullscreen.
 *
 * @returns The fullscreen toggle button
 */
export default function Fullscreen(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/fullscreen');

  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get the values from store
  const mapId = useStoreGeoViewMapId();
  const isFullScreen = useStoreAppIsFullscreenActive();
  const uiController = useUIController();

  /**
   * Toggles between fullscreen and window mode.
   */
  function setFullscreen(): void {
    const element = document.getElementById(`shell-${mapId}`);
    if (element) {
      uiController.setFullScreen(!isFullScreen, element as TypeHTMLElement);
    }
  }

  /**
   * Registers fullscreen change listeners to detect ESC key exit.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FULLSCREEN - mount');

    /**
     * Exits fullscreen when the browser fullscreen state changes.
     */
    function handleExit(): void {
      if (!document.fullscreenElement) {
        uiController.setFullScreen(false);
      }
    }
    document.addEventListener('fullscreenchange', handleExit);
    document.addEventListener('webkitfullscreenchange', handleExit);
    document.addEventListener('mozfullscreenchange', handleExit);
    document.addEventListener('MSFullscreenChange', handleExit);
    return () => {
      document.removeEventListener('fullscreenchange', handleExit);
      document.removeEventListener('webkitfullscreenchange', handleExit);
      document.removeEventListener('mozfullscreenchange', handleExit);
      document.removeEventListener('MSFullscreenChange', handleExit);
    };
  }, [uiController]);

  return (
    <IconButton
      id="fullscreen"
      aria-label={t('mapnav.fullscreen')}
      tooltipPlacement="left"
      onClick={() => setFullscreen()}
      sx={sxClasses.navButton}
    >
      {!isFullScreen ? <FullscreenIcon /> : <FullscreenExitIcon />}
    </IconButton>
  );
}
