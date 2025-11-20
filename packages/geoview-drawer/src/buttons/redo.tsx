import type { TypeWindow } from 'geoview-core';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { useDrawerActions, useDrawerRedoDisabled } from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';

import { IconButton, RedoIcon } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';

/**
 * Create an redo button to redo the last drawing action
 *
 * @returns {JSX.Element} the created redo button
 */
export default function Redo(): JSX.Element {
  // Log
  logger.logTraceRender('geoview-drawer/src/buttons/redo');

  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { useMemo } = cgpv.reactUtilities.react;
  // Get store values
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const displayLanguage = useAppDisplayLanguage();

  // Store actions
  const { redoDrawing } = useDrawerActions();
  const redoDisabled = useDrawerRedoDisabled();

  /**
   * Handles a click on the redo button
   */
  const handleRedo = (): void => {
    redoDrawing();
  };

  return (
    <IconButton
      id="redo"
      aria-label={getLocalizedMessage(displayLanguage, 'drawer.redoTooltip')}
      tooltipPlacement="left"
      onClick={handleRedo}
      sx={sxClasses.navButton}
      disabled={redoDisabled}
    >
      <RedoIcon />
    </IconButton>
  );
}
