import { useDrawerActions } from 'geoview-core/src/core/stores/store-interface-and-intial-values/drawer-state';

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

  // Store actions
  const { toggleDrawing } = useDrawerActions();

  /**
   * Handles a click on the draw button
   */
  const handleDraw = (): void => {
    toggleDrawing();
  };

  return (
    <IconButton id="draw" onClick={handleDraw}>
      <DrawIcon />
    </IconButton>
  );
}
