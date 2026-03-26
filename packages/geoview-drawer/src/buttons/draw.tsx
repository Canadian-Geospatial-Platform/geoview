import { type TypeWindow } from 'geoview-core';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { useDrawerIsDrawing } from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';

import { IconButton, DrawIcon } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useDrawerController } from 'geoview-core/core/controllers/drawer-controller';

/**
 * Creates a draw button to toggle drawing capabilities.
 *
 * @returns The draw button element
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
  const drawerController = useDrawerController();

  /**
   * Handles a click on the draw button
   */
  const handleDraw = (): void => {
    drawerController.toggleDrawing();
  };

  return (
    <IconButton
      id="draw"
      aria-label={getLocalizedMessage(displayLanguage, 'drawer.toggleDrawing')}
      tooltipPlacement="left"
      className={isDrawing ? 'highlighted active' : ''}
      onClick={handleDraw}
      sx={sxClasses.navButton}
    >
      <DrawIcon />
    </IconButton>
  );
}
