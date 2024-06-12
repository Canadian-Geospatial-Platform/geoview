import { useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { IconButton, FullscreenIcon, FullscreenExitIcon } from '@/ui';
import { TypeHTMLElement } from '@/core/types/global-types';
import { getSxClasses } from '@/core/components/nav-bar/nav-bar-style';
import { useAppStoreActions, useAppFullscreenActive } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';

/**
 * Create a toggle button to toggle between fullscreen
 *
 * @returns {JSX.Element} the fullscreen toggle button
 */
export default function Fullscreen(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/fullscreen');

  const mapId = useGeoViewMapId();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get the values from store
  const isFullScreen = useAppFullscreenActive();
  const { setFullScreenActive } = useAppStoreActions();
  const { setFooterBarIsCollapsed } = useUIStoreActions();
  /**
   * Toggle between fullscreen and window mode
   */
  function setFullscreen(): void {
    const element = document.getElementById(`shell-${mapId}`);
    if (element) {
      setFullScreenActive(!isFullScreen, element as TypeHTMLElement);
      setFooterBarIsCollapsed(true);
    }
  }

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FULLSCREEN - mount');

    /**
     * Exit fullscreen with ESC key
     */
    function handleExit(): void {
      if (!document.fullscreenElement) {
        setFullScreenActive(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <IconButton
      id="fullscreen"
      tooltip="mapnav.fullscreen"
      tooltipPlacement="left"
      onClick={() => setFullscreen()}
      sx={sxClasses.navButton}
    >
      {!isFullScreen ? <FullscreenIcon /> : <FullscreenExitIcon />}
    </IconButton>
  );
}
