import { getLocalizedMessage } from 'geoview-core/src/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/src/core/stores/store-interface-and-intial-values/app-state';
import { useDrawerActions, useDrawerIsDrawing } from 'geoview-core/src/core/stores/store-interface-and-intial-values/drawer-state';

import { IconButton, DrawIcon } from 'geoview-core/src/ui';
import { logger } from 'geoview-core/src/core/utils/logger';

/**
 * Create a draw button to return the user to toggle drawing capabilities
 *
 * @returns {JSX.Element} the created draw button
 */
export default function Draw(): JSX.Element {
  // Log
  logger.logTraceRender('geoview-drawer/src/buttons/draw');

  // Get store values
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
      sx={isDrawing ? { border: '2px solid #1976d2' } : undefined}
      onClick={handleDraw}
    >
      <DrawIcon />
    </IconButton>
  );
}
