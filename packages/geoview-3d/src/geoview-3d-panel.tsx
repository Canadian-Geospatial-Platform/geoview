import { useCallback, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { Box, Typography } from 'geoview-core/ui';
import type { SxStyles } from 'geoview-core/ui/style/types';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { logger } from 'geoview-core/core/utils/logger';
import { GV_DOM_SUFFIX } from 'geoview-core/core/utils/dom-helper';
import { useGVElementById } from 'geoview-core/core/stores/states/app-state';
import { useStoreUIActiveAppBarTab } from 'geoview-core/core/stores/states/ui-state';

import { getSxClasses } from './geoview-3d-panel-style';
import { GeoView3DOverlay } from './geoview-3d-overlay';
import type { TypeTilesetStatus } from './geoview-3d-overlay';
import type { TypeGeoView3DConfig } from './geoview-3d-types';
import { TilesetRenderer } from './tileset-renderer';

/** Props for the GeoView3DPanel component. */
interface GeoView3DPanelProps {
  /** The plugin configuration. */
  config: TypeGeoView3DConfig;
  /** The app-bar tab id of this plugin, used to know when its panel is open. */
  tabId: string;
}

/**
 * Creates the 3D panel component, which shows the 3D overlay on the map while the panel is open.
 *
 * The overlay (and its WebGL context) is only mounted while this plugin's app-bar panel is open: the app bar keeps
 * closed panels mounted, so an always-mounted canvas would keep rendering in the background.
 *
 * @param props - Properties defined in GeoView3DPanelProps interface
 * @returns The 3D panel component
 */
export function GeoView3DPanel(props: GeoView3DPanelProps): JSX.Element {
  logger.logTraceRender('geoview-3d/geoview-3d-panel > GeoView3DPanel');

  const { config, tabId } = props;
  const { t } = useTranslation<string>();
  const theme = (window as TypeWindow).cgpv.ui.useTheme();

  const memoSxClasses = useMemo((): SxStyles => {
    return getSxClasses(theme);
  }, [theme]);

  const activeAppBarTab = useStoreUIActiveAppBarTab();
  const getElementById = useGVElementById();
  const [status, setStatus] = useState<TypeTilesetStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  // Survives overlay remounts: the panel stays mounted while closed.
  const framedTilesetUrlsRef = useRef<Set<string>>(new Set());
  // Probed once, on first opening, so a page that never opens the panel never creates a WebGL context.
  const webgl2AvailableRef = useRef<boolean | undefined>(undefined);

  const isPanelOpen = activeAppBarTab.isOpen && activeAppBarTab.tabId === tabId;
  const isUrlValid = TilesetRenderer.isValidTilesetUrl(config.tilesetUrl);
  if (isPanelOpen && isUrlValid && webgl2AvailableRef.current === undefined) {
    webgl2AvailableRef.current = TilesetRenderer.isWebGL2Available();
  }
  const isWebGL2Missing = webgl2AvailableRef.current === false;
  const mapTarget = isPanelOpen && isUrlValid && !isWebGL2Missing ? getElementById(GV_DOM_SUFFIX.mapTarget) : undefined;

  // #region Handlers

  /**
   * Handles a tileset status change reported by the overlay.
   */
  const handleStatusChange = useCallback((newStatus: TypeTilesetStatus, message?: string): void => {
    setStatus(newStatus);
    setErrorMessage(message ?? '');
  }, []);

  /**
   * Allows framing the camera on a tileset only the first time it is shown; later openings keep the synced 2D view.
   *
   * @param tilesetUrl - The URL of the loaded tileset
   * @returns Whether the overlay should frame the camera on the tileset
   */
  const shouldFrameTileset = useCallback((tilesetUrl: string): boolean => {
    if (framedTilesetUrlsRef.current.has(tilesetUrl)) return false;
    framedTilesetUrlsRef.current.add(tilesetUrl);
    return true;
  }, []);

  // #endregion

  let displayedStatus: TypeTilesetStatus = status;
  if (!isUrlValid) displayedStatus = 'invalidUrl';
  else if (isWebGL2Missing) displayedStatus = 'webglUnavailable';

  return (
    <Box sx={memoSxClasses.container}>
      <Typography variant="body2">{t('GeoView3D.overlayHint')}</Typography>
      <Box sx={memoSxClasses.status} role="status" aria-live="polite">
        <Typography variant="body2">{t(`GeoView3D.status.${displayedStatus}`, { message: errorMessage })}</Typography>
      </Box>
      {mapTarget &&
        createPortal(
          <GeoView3DOverlay tilesetUrl={config.tilesetUrl} onStatusChange={handleStatusChange} shouldFrameTileset={shouldFrameTileset} />,
          mapTarget
        )}
    </Box>
  );
}
