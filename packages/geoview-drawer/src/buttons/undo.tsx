import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import { useTranslation } from 'geoview-core/core/translation/i18n';
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
  const memoSxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const { t } = useTranslation<string>();
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
      aria-label={t('drawer.undoTooltip')}
      tooltipPlacement="left"
      onClick={handleUndo}
      sx={memoSxClasses.navButton}
      disabled={undoDisabled}
    >
      <UndoIcon />
    </IconButton>
  );
}
