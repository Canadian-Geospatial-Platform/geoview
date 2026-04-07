import type { TypeWindow } from 'geoview-core';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { useStoreAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';

import { IconButton, UploadIcon } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useDrawerController } from 'geoview-core/core/controllers/drawer-controller';

/**
 * Creates an upload button to upload drawings to the viewer.
 *
 * @returns The upload button element
 */
export default function Upload(): JSX.Element {
  // Log
  logger.logTraceRender('geoview-drawer/src/buttons/upload');

  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { useMemo, useCallback } = cgpv.reactUtilities.react;

  // Get store values
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const displayLanguage = useStoreAppDisplayLanguage();
  const drawerController = useDrawerController();

  /**
   * Handles a click on the upload button
   * Creates an invisible file input and clicks it to make the file dialog appear
   */
  const handleUpload = useCallback((): void => {
    const input = document.createElement('input');
    input.type = 'file';
    input.setAttribute('accept', 'geojson/*');
    input.onchange = (event: Event): void => {
      const file = (event.target as HTMLInputElement).files![0];
      if (file) {
        drawerController.uploadDrawings(file);
      }
    };
    input.click();
  }, [drawerController]);

  return (
    <IconButton
      id="upload"
      aria-label={getLocalizedMessage(displayLanguage, 'drawer.uploadTooltip')}
      tooltipPlacement="left"
      onClick={handleUpload}
      sx={sxClasses.navButton}
    >
      <UploadIcon />
    </IconButton>
  );
}
