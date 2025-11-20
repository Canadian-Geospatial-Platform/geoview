import type { TypeWindow } from 'geoview-core';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { useDrawerActions } from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';

import { IconButton, UploadIcon } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';

/**
 * Create a upload button to upload all drawings from the viewer
 *
 * @returns {JSX.Element} the created upload button
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
  const displayLanguage = useAppDisplayLanguage();
  const { uploadDrawings } = useDrawerActions();

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
        uploadDrawings(file);
      }
    };
    input.click();
  }, [uploadDrawings]);

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
