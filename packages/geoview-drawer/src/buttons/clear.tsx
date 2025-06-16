import { getLocalizedMessage } from 'geoview-core/src/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/src/core/stores/store-interface-and-intial-values/app-state';
import { useDrawerActions } from 'geoview-core/src/core/stores/store-interface-and-intial-values/drawer-state';

import { IconButton, DeleteIcon } from 'geoview-core/src/ui';
import { logger } from 'geoview-core/src/core/utils/logger';

/**
 * Create a clear button to clear all drawings from the viewer
 *
 * @returns {JSX.Element} the created clearbutton
 */
export default function Clear(): JSX.Element {
  // Log
  logger.logTraceRender('geoview-drawer/src/buttons/clear');

  // Get store values
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
      tooltip={getLocalizedMessage(displayLanguage, 'drawer.clearTooltip')}
      tooltipPlacement="left"
      onClick={handleClear}
    >
      <DeleteIcon />
    </IconButton>
  );
}
