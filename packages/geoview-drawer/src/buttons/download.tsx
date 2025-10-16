import type { TypeWindow } from 'geoview-core';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { useDrawerActions } from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';

import { IconButton, DownloadIcon } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';

/**
 * Create a download button to download all drawings from the viewer
 *
 * @returns {JSX.Element} the created download button
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
  const displayLanguage = useAppDisplayLanguage();

  // Store actions
  const { downloadDrawings } = useDrawerActions();

  /**
   * Handles a click on the download button
   */
  const handleDownload = (): void => {
    downloadDrawings();
  };

  return (
    <IconButton
      id="download"
      tooltip={getLocalizedMessage(displayLanguage, 'drawer.downloadTooltip')}
      tooltipPlacement="left"
      onClick={handleDownload}
      sx={sxClasses.navButton}
    >
      <DownloadIcon />
    </IconButton>
  );
}
