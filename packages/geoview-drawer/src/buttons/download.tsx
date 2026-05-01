import type { TypeWindow } from 'geoview-core';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import { useTranslation } from 'geoview-core/core/translation/i18n';

import { IconButton, DownloadIcon } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useDrawerController } from 'geoview-core/core/controllers/use-controllers';

/**
 * Creates a download button to download all drawings from the viewer.
 *
 * @returns The download button element
 */
export default function Download(): JSX.Element {
  // Log
  logger.logTraceRender('geoview-drawer/src/buttons/download');

  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { useMemo } = cgpv.reactUtilities.react;

  // Get store values
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const { t } = useTranslation<string>();
  const drawerController = useDrawerController();

  /**
   * Handles a click on the download button
   */
  const handleDownload = (): void => {
    drawerController.downloadDrawings();
  };

  return (
    <IconButton
      id="download"
      aria-label={t('drawer.downloadTooltip')}
      tooltipPlacement="left"
      onClick={handleDownload}
      sx={sxClasses.navButton}
    >
      <DownloadIcon />
    </IconButton>
  );
}
