import { TypeWindow } from 'geoview-core';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { useDrawerActions, useDrawerHideMeasurements } from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';

import { IconButton, StraightenIcon } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';

/**
 * Create a measure button to toggle measurement overlays on drawings
 *
 * @returns {JSX.Element} the created measurement button
 */
export default function Measurements(): JSX.Element {
  // Log
  logger.logTraceRender('geoview-drawer/src/buttons/clear');

  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { useMemo } = cgpv.reactUtilities.react;

  // Get store values
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const displayLanguage = useAppDisplayLanguage();
  const hideMeasurements = useDrawerHideMeasurements();

  // Store actions
  const { toggleHideMeasurements } = useDrawerActions();

  /**
   * Handles a click on the clear button
   */
  const handleToggleMeasurements = (): void => {
    toggleHideMeasurements();
  };

  return (
    <IconButton
      id="measure"
      tooltip={getLocalizedMessage(displayLanguage, 'drawer.toggleMeasurements')}
      tooltipPlacement="left"
      onClick={handleToggleMeasurements}
      className={!hideMeasurements ? 'highlighted active' : ''}
      sx={sxClasses.navButton}
    >
      <StraightenIcon />
    </IconButton>
  );
}
