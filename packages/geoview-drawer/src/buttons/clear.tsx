import { useGeoViewMapId, type TypeWindow } from 'geoview-core';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';

import { IconButton, DeleteIcon } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { DrawerEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/drawer-event-processor';

/**
 * Creates a clear button to clear all drawings from the viewer.
 *
 * @returns The clear button element
 */
export default function Clear(): JSX.Element {
  // Log
  logger.logTraceRender('geoview-drawer/src/buttons/clear');

  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { useMemo } = cgpv.reactUtilities.react;

  // Get store values
  const mapId = useGeoViewMapId();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const displayLanguage = useAppDisplayLanguage();

  /**
   * Handles a click on the clear button
   */
  const handleClear = (): void => {
    DrawerEventProcessor.clearDrawings(mapId);
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
