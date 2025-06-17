import { getLocalizedMessage } from 'geoview-core/src/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/src/core/stores/store-interface-and-intial-values/app-state';
import { useDrawerActions, useDrawerHideMeasurements } from 'geoview-core/src/core/stores/store-interface-and-intial-values/drawer-state';

import { IconButton, StraightenIcon } from 'geoview-core/src/ui';
import { logger } from 'geoview-core/src/core/utils/logger';

/**
 * Create a measure button to toggle measurement overlays on drawings
 *
 * @returns {JSX.Element} the created measurement button
 */
export default function Measurements(): JSX.Element {
  // Log
  logger.logTraceRender('geoview-drawer/src/buttons/clear');

  // Get store values
  const displayLanguage = useAppDisplayLanguage();
  const hideMeasurements = useDrawerHideMeasurements();

  // Store actions
  const { toggleHideMeasurements } = useDrawerActions();

  /**
   * Handles a click on the clear button
   */
  const handleToggleMeasurements = (): void => {
    toggleHideMeasurements();
  };

  return (
    <IconButton
      id="clear"
      tooltip={getLocalizedMessage(displayLanguage, 'drawer.toggleMeasurements')}
      tooltipPlacement="left"
      onClick={handleToggleMeasurements}
      sx={hideMeasurements ? undefined : { border: '1px solid #1976d2' }}
    >
      <StraightenIcon />
    </IconButton>
  );
}
