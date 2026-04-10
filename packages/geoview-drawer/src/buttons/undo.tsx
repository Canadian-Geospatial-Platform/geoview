import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { useStoreAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { useStoreDrawerUndoDisabled } from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';

import { IconButton, UndoIcon } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useDrawerController } from 'geoview-core/core/controllers/use-controllers';

/**
 * Creates an undo button to undo the last drawing action.
 *
 * @returns The undo button element
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
  const displayLanguage = useStoreAppDisplayLanguage();
  const drawerController = useDrawerController();

  // Store
  const undoDisabled = useStoreDrawerUndoDisabled();

  /**
   * Handles a click on the undo button
   */
  const handleUndo = (): void => {
    drawerController.undo();
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
