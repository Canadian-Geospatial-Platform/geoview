import { useTheme } from '@mui/material/styles';

import { IconButton, FullscreenIcon, FullscreenExitIcon } from '@/ui';
import { TypeHTMLElement } from '@/core/types/global-types';
import { getSxClasses } from '../nav-bar-style';
import { useAppStoreActions, useAppFullscreenActive } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useGeoViewMapId } from '@/app';

/**
 * Create a toggle button to toggle between fullscreen
 *
 * @returns {JSX.Element} the fullscreen toggle button
 */
export default function Fullscreen(): JSX.Element {
  const mapId = useGeoViewMapId();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get the values from store
  const isFullScreen = useAppFullscreenActive();
  const { setFullScreenActive } = useAppStoreActions();

  /**
   * Exit fullscreen with ESC key
   */
  function handleExit() {
    const mapIdFS =
      document.activeElement !== undefined && document.activeElement?.closest('.geoview-shell') !== null
        ? document.activeElement?.closest('.geoview-shell')!.getAttribute('id')?.split('-')[1]
        : undefined;

    if (mapIdFS !== undefined) {
      setFullScreenActive(false);
      document.removeEventListener('fullscreenchange', handleExit);
      document.removeEventListener('webkitfullscreenchange', handleExit);
      document.removeEventListener('mozfullscreenchange', handleExit);
      document.removeEventListener('MSFullscreenChange', handleExit);
    }
  }

  /**
   * Toggle between fullscreen and window mode
   */
  function setFullscreen() {
    const element = document.getElementById(`shell-${mapId}`);

    if (element) {
      setFullScreenActive(!isFullScreen, element as TypeHTMLElement);

      // if state will become fullscreen, add event listerner to trap exit by ESC key
      // put a timeout for the toggle to fullscreen to happen
      if (!isFullScreen) {
        setTimeout(() => {
          document.addEventListener('fullscreenchange', handleExit);
          document.addEventListener('webkitfullscreenchange', handleExit);
          document.addEventListener('mozfullscreenchange', handleExit);
          document.addEventListener('MSFullscreenChange', handleExit);
        }, 100);
      }
    }
  }

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
