import type { TypeWindow } from 'geoview-core';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import { useTranslation } from 'geoview-core/core/translation/i18n';
import { useStoreDrawerIsDrawing } from 'geoview-core/core/stores/states/drawer-state';

import { IconButton, DrawIcon } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';
import { useDrawerController } from 'geoview-core/core/controllers/use-controllers';

/** Properties for the Draw button. */
interface DrawProps {
  /** The map-scoped id of the button, so keyboard drawing can return focus to it. */
  id: string;
}

/**
 * Creates a draw button to toggle drawing capabilities.
 *
 * @param props - Properties defined in DrawProps interface
 * @returns The draw button element
 */
export default function Draw({ id }: DrawProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-drawer/src/buttons/draw');

  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { useEffect, useMemo } = cgpv.reactUtilities.react;

  // Get store values
  const theme = useTheme();
  const memoSxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const { t } = useTranslation<string>();
  const isDrawing = useStoreDrawerIsDrawing();
  const drawerController = useDrawerController();
  const measurementFontSize = theme.typography.caption.fontSize;
  const measurementFontWeight = theme.typography.fontWeightBold;

  /** Synchronizes measurement typography with this map's theme even when its style panel is closed. */
  useEffect(() => {
    logger.logTraceUseEffect('DRAW - Measurement typography', measurementFontSize, measurementFontWeight);
    drawerController.setMeasurementTypography(measurementFontSize, measurementFontWeight);
  }, [drawerController, measurementFontSize, measurementFontWeight]);

  /**
   * Handles a click on the draw button
   */
  const handleDraw = (): void => {
    drawerController.toggleDrawing();
  };

  return (
    <IconButton
      id={id}
      aria-label={t('drawer.toggleDrawing')}
      tooltipPlacement="left"
      className={isDrawing ? 'highlighted active' : ''}
      onClick={handleDraw}
      sx={memoSxClasses.navButton}
    >
      <DrawIcon />
    </IconButton>
  );
}
