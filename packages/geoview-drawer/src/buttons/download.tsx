import { useGeoViewMapId, type TypeWindow } from 'geoview-core';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';

import { IconButton, DownloadIcon } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { DrawerEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/drawer-event-processor';

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
  const mapId = useGeoViewMapId();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const displayLanguage = useAppDisplayLanguage();

  /**
   * Handles a click on the download button
   */
  const handleDownload = (): void => {
    DrawerEventProcessor.downloadDrawings(mapId);
  };

  return (
    <IconButton
      id="download"
      aria-label={getLocalizedMessage(displayLanguage, 'drawer.downloadTooltip')}
      tooltipPlacement="left"
      onClick={handleDownload}
      sx={sxClasses.navButton}
    >
      <DownloadIcon />
    </IconButton>
  );
}
