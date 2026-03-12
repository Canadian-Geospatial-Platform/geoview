import { useGeoViewMapId, type TypeWindow } from 'geoview-core';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { useDrawerIsEditing } from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';

import { IconButton, EditIcon, EditOffIcon } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { DrawerEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/drawer-event-processor';

/**
 * Creates an edit button to toggle editing capabilities.
 *
 * @returns The edit button element
 */
export default function Edit(): JSX.Element {
  // Log
  logger.logTraceRender('geoview-drawer/src/buttons/edit');

  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { useMemo } = cgpv.reactUtilities.react;

  // Get store values
  const mapId = useGeoViewMapId();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const displayLanguage = useAppDisplayLanguage();
  const isEditing = useDrawerIsEditing();

  /**
   * Handles a click on the edit button
   */
  const handleToggleEditing = (): void => {
    DrawerEventProcessor.toggleEditing(mapId);
  };

  return (
    <IconButton
      id="clear"
      aria-label={getLocalizedMessage(displayLanguage, 'drawer.edit')}
      tooltipPlacement="left"
      className={isEditing ? 'highlighted active' : ''}
      onClick={handleToggleEditing}
      sx={sxClasses.navButton}
    >
      {isEditing ? <EditOffIcon /> : <EditIcon />}
    </IconButton>
  );
}
