import type { TypeWindow } from 'geoview-core';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { useStoreDrawerRedoDisabled } from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';

import { IconButton, RedoIcon } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useDrawerController } from 'geoview-core/core/controllers/use-controllers';

/**
 * Creates a redo button to redo the last drawing action.
 *
 * @returns The redo button element
 */
export default function Redo(): JSX.Element {
  // Log
  logger.logTraceRender('geoview-drawer/src/buttons/redo');

  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { useMemo } = cgpv.reactUtilities.react;

  // Get store values
  const theme = useTheme();
  const memoSxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const { t } = useTranslation<string>();

  // Store
  const redoDisabled = useStoreDrawerRedoDisabled();
  const drawerController = useDrawerController();

  /**
   * Handles a click on the redo button
   */
  const handleRedo = (): void => {
    drawerController.redo();
  };

  return (
    <IconButton
      id="redo"
      aria-label={t('drawer.redoTooltip')}
      tooltipPlacement="left"
      onClick={handleRedo}
      sx={memoSxClasses.navButton}
      disabled={redoDisabled}
    >
      <RedoIcon />
    </IconButton>
  );
}
