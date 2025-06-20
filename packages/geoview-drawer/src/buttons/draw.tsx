import { TypeWindow } from 'geoview-core';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { useDrawerActions, useDrawerIsDrawing } from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';

import { IconButton, DrawIcon } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';

/**
 * Create a draw button to return the user to toggle drawing capabilities
 *
 * @returns {JSX.Element} the created draw button
 */
export default function Draw(): JSX.Element {
  // Log
  logger.logTraceRender('geoview-drawer/src/buttons/draw');

  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { useMemo } = cgpv.reactUtilities.react;

  // Get store values
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const displayLanguage = useAppDisplayLanguage();
  const isDrawing = useDrawerIsDrawing();

  // Store actions
  const { toggleDrawing } = useDrawerActions();

  /**
   * Handles a click on the draw button
   */
  const handleDraw = (): void => {
    toggleDrawing();
  };

  return (
    <IconButton
      id="draw"
      tooltip={getLocalizedMessage(displayLanguage, 'drawer.toggleDrawing')}
      tooltipPlacement="left"
      className={isDrawing ? 'highlighted active' : ''}
      onClick={handleDraw}
      sx={sxClasses.navButton}
    >
      <DrawIcon />
    </IconButton>
  );
}
