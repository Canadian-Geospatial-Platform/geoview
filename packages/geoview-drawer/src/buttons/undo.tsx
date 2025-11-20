import type { TypeWindow } from 'geoview-core';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { useDrawerActions, useDrawerUndoDisabled } from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';

import { IconButton, UndoIcon } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';

/**
 * Create an undo button to undo the last drawing action
 *
 * @returns {JSX.Element} the created undo button
 */
export default function Redo(): JSX.Element {
  // Log
  logger.logTraceRender('geoview-drawer/src/buttons/undo');

  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { useMemo } = cgpv.reactUtilities.react;
  // Get store values
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const displayLanguage = useAppDisplayLanguage();

  // Store actions
  const { undoDrawing } = useDrawerActions();
  const undoDisabled = useDrawerUndoDisabled();

  /**
   * Handles a click on the undo button
   */
  const handleUndo = (): void => {
    undoDrawing();
  };

  return (
    <IconButton
      id="undo"
      aria-label={getLocalizedMessage(displayLanguage, 'drawer.undoTooltip')}
      tooltipPlacement="left"
      onClick={handleUndo}
      sx={sxClasses.navButton}
      disabled={undoDisabled}
    >
      <UndoIcon />
    </IconButton>
  );
}
