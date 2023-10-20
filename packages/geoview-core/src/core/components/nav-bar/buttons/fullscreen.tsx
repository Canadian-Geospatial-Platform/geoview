import { useContext } from 'react';

import { useTheme } from '@mui/material/styles';

import { useStore } from 'zustand';
import { getGeoViewStore } from '@/core/stores/stores-managers';

import { MapContext } from '@/core/app-start';
import { api } from '@/app';
import { IconButton, FullscreenIcon, FullscreenExitIcon } from '@/ui';
import { TypeHTMLElement } from '@/core/types/global-types';
import { getSxClasses } from '../nav-bar-style';

/**
 * Create a toggle button to toggle between fullscreen
 *
 * @returns {JSX.Element} the fullscreen toggle button
 */
export default function Fullscreen(): JSX.Element {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get the values from store
  const isFullScreen = useStore(getGeoViewStore(mapId), (state) => state.isFullScreen);

  /**
   * Exit fullscreen with ESC key
   */
  function handleExit() {
    const mapIdFS =
      document.activeElement !== undefined && document.activeElement?.closest('.geoview-shell') !== null
        ? document.activeElement?.closest('.geoview-shell')!.getAttribute('id')?.split('-')[1]
        : undefined;

    if (mapIdFS !== undefined) {
      getGeoViewStore(mapIdFS).setState({ isFullScreen: false });
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
    const fsState = getGeoViewStore(mapId).getState().isFullScreen;

    if (element) {
      getGeoViewStore(mapId).setState({ isFullScreen: !fsState });
      api.maps[mapId].toggleFullscreen(!fsState, element as TypeHTMLElement);

      // if state will become fullscreen, add event listerner to trap exit by ESC key
      // put a timeout for the toggle to fullscreen to happen
      if (!fsState) {
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
