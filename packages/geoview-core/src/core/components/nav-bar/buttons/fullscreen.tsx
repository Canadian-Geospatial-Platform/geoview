import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import { IconButton, FullscreenIcon, FullscreenExitIcon } from '@/ui';
import type { TypeHTMLElement } from '@/core/types/global-types';
import { getSxClasses } from '@/core/components/nav-bar/nav-bar-style';
import { useStoreAppIsFullscreenActive } from '@/core/stores/states/app-state';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import { getGVShellElement } from '@/core/utils/dom-helper';
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

  // #region Handlers

  /**
   * Toggles between fullscreen and window mode.
   * Exiting (button, `Esc` key or API) is finalized by the UI controller when the browser leaves fullscreen.
   */
  function handleSetFullscreen(): void {
    const element = getGVShellElement(mapId);
    if (element) {
      uiController.setFullScreen(!isFullScreen, element as TypeHTMLElement);
    }
  }

  // #endregion Handlers

  return (
    <IconButton
      id={`${mapId}-button-fullscreen`}
      aria-label={t('mapnav.fullscreen')}
      aria-pressed={isFullScreen}
      tooltipPlacement="left"
      onClick={handleSetFullscreen}
      sx={sxClasses.navButton}
    >
      {!isFullScreen ? <FullscreenIcon /> : <FullscreenExitIcon />}
    </IconButton>
  );
}
