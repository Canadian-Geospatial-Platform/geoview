import type { TypeWindow } from 'geoview-core';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import { useTranslation } from 'geoview-core/core/translation/i18n';

import { IconButton, DeleteIcon } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useDrawerController } from 'geoview-core/core/controllers/use-controllers';

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
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const { t } = useTranslation<string>();
  const drawerController = useDrawerController();

  /**
   * Handles a click on the clear button
   */
  const handleClear = (): void => {
    drawerController.clearDrawings();
  };

  return (
    <IconButton id="clear" aria-label={t('drawer.clearTooltip')} tooltipPlacement="left" onClick={handleClear} sx={sxClasses.navButton}>
      <DeleteIcon />
    </IconButton>
  );
}
