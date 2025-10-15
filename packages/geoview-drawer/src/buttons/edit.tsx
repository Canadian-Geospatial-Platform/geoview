import type { TypeWindow } from 'geoview-core';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { useDrawerActions, useDrawerIsEditing } from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';

import { IconButton, EditIcon, EditOffIcon } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';

/**
 * Create an edit button to toggle editing capabilities
 *
 * @returns {JSX.Element} the created edit button
 */
export default function Edit(): JSX.Element {
  // Log
  logger.logTraceRender('geoview-drawer/src/buttons/edit');

  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { useMemo } = cgpv.reactUtilities.react;

  // Get store values
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
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
      className={isEditing ? 'highlighted active' : ''}
      onClick={handleToggleEditing}
      sx={sxClasses.navButton}
    >
      {isEditing ? <EditOffIcon /> : <EditIcon />}
    </IconButton>
  );
}
