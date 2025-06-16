import { getLocalizedMessage } from 'geoview-core/src/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/src/core/stores/store-interface-and-intial-values/app-state';
import { useDrawerActions, useDrawerIsEditing } from 'geoview-core/src/core/stores/store-interface-and-intial-values/drawer-state';

import { IconButton, EditIcon, EditOffIcon } from 'geoview-core/src/ui';
import { logger } from 'geoview-core/src/core/utils/logger';

/**
 * Create an edit button to toggle editing capabilities
 *
 * @returns {JSX.Element} the created edit button
 */
export default function Edit(): JSX.Element {
  // Log
  logger.logTraceRender('geoview-drawer/src/buttons/edit');

  // Get store values
  const displayLanguage = useAppDisplayLanguage();
  const isEditing = useDrawerIsEditing();

  // Store actions
  const { toggleEditing } = useDrawerActions();

  /**
   * Handles a click on the edit button
   */
  const handleToggleEditing = (): void => {
    toggleEditing();
  };

  return (
    <IconButton
      id="clear"
      tooltip={getLocalizedMessage(displayLanguage, 'drawer.edit')}
      tooltipPlacement="left"
      onClick={handleToggleEditing}
    >
      {isEditing ? <EditOffIcon /> : <EditIcon />}
    </IconButton>
  );
}
