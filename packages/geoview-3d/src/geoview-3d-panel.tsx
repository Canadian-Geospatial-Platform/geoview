import { useCallback, useMemo, useState } from 'react';
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

  const isPanelOpen = activeAppBarTab.isOpen && activeAppBarTab.tabId === tabId;
  const isUrlValid = TilesetRenderer.isValidTilesetUrl(config.tilesetUrl);
  const mapTarget = isPanelOpen && isUrlValid ? getElementById(GV_DOM_SUFFIX.mapTarget) : undefined;

  // #region Handlers

  /**
   * Handles a tileset status change reported by the overlay.
   */
  const handleStatusChange = useCallback((newStatus: TypeTilesetStatus, message?: string): void => {
    setStatus(newStatus);
    setErrorMessage(message ?? '');
  }, []);

  // #endregion

  const displayedStatus: TypeTilesetStatus = isUrlValid ? status : 'invalidUrl';

  return (
    <Box sx={memoSxClasses.container}>
      <Typography variant="body2">{t('GeoView3D.overlayHint')}</Typography>
      <Box sx={memoSxClasses.status} role="status" aria-live="polite">
        <Typography variant="body2">{t(`GeoView3D.status.${displayedStatus}`, { message: errorMessage })}</Typography>
      </Box>
      {mapTarget && createPortal(<GeoView3DOverlay tilesetUrl={config.tilesetUrl} onStatusChange={handleStatusChange} />, mapTarget)}
    </Box>
  );
}
