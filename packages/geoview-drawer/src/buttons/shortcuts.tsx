import type { TypeWindow } from 'geoview-core';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { useStoreDrawerShortcutsEnabled } from 'geoview-core/core/stores/states/drawer-state';
import { useDrawerController } from 'geoview-core/core/controllers/use-controllers';

import { IconButton, KeyboardIcon } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';

/**
 * Creates a shortcuts button to toggle if shortcuts are active.
 *
 * @returns The shortcuts button element
 */
export default function Shortcuts(): JSX.Element {
  // Log
  logger.logTraceRender('geoview-drawer/src/buttons/shortcuts');

  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { useMemo } = cgpv.reactUtilities.react;

  // Get store values
  const theme = useTheme();
  const memoSxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const { t } = useTranslation<string>();
  const areShortcutsEnabled = useStoreDrawerShortcutsEnabled();
  const drawerController = useDrawerController();

  /**
   * Handles a click on the shortcuts button
   */
  const handleShortcuts = (): void => {
    drawerController.setShortcutsEnabled(!areShortcutsEnabled);
  };

  return (
    <IconButton
      id="shortcuts"
      aria-label={t('drawer.toggleShortcuts')}
      tooltipPlacement="left"
      className={areShortcutsEnabled ? 'highlighted active' : ''}
      onClick={handleShortcuts}
      sx={memoSxClasses.navButton}
    >
      <KeyboardIcon />
    </IconButton>
  );
}
