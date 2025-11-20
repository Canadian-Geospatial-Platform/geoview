import type { TypeWindow } from 'geoview-core';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { useDrawerActions } from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';

import { IconButton, DeleteIcon } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';

/**
 * Create a clear button to clear all drawings from the viewer
 *
 * @returns {JSX.Element} the created clearbutton
 */
export default function Clear(): JSX.Element {
  // Log
  logger.logTraceRender('geoview-drawer/src/buttons/clear');

  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { useMemo } = cgpv.reactUtilities.react;
  // Get store values
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const displayLanguage = useAppDisplayLanguage();

  // Store actions
  const { clearDrawings } = useDrawerActions();

  /**
   * Handles a click on the clear button
   */
  const handleClear = (): void => {
    clearDrawings();
  };

  return (
    <IconButton
      id="clear"
      aria-label={getLocalizedMessage(displayLanguage, 'drawer.clearTooltip')}
      tooltipPlacement="left"
      onClick={handleClear}
      sx={sxClasses.navButton}
    >
      <DeleteIcon />
    </IconButton>
  );
}
