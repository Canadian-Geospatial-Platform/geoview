import { createSvgIcon } from '@mui/material/utils';
import { TypeWindow } from 'geoview-core';
import { getSxClasses } from 'geoview-core/core/components/nav-bar/nav-bar-style';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { useAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { useDrawerActions, useDrawerHideMeasurements } from 'geoview-core/core/stores/store-interface-and-intial-values/drawer-state';

import { IconButton, StraightenIcon } from 'geoview-core/ui';
import { logger } from 'geoview-core/core/utils/logger';

const hideMeasurementIconPath =
  'M 7.9779029,9.08233 8.9558058,10.16466 9,12 10.779029,11.95581 14.628272,16 H 3 V 8 h 2 v 4 H 7 V 8 Z M 3,6 C 1.9000257,6.0075208 1,6.9 1,8 v 8 c 0,1.1 0.9,2 2,2 h 13.617009 l 2.615584,2.74 1.27,-1.27 -15.7299998,-16.23 -1.27,1.27 1.5351131,1.4760677 z M 13,8 V 9.6785241 L 15,12 V 8 h 2 v 4 h 2 V 8 h 2 v 8 H 19.136077 L 21,18 c 1.1,0 2,-0.9 2,-2 V 8 C 23,6.9 22.1,6 21,6 L 9.5901357,6.0441942 11.490485,8 Z';

const HideMeasurementIcon = createSvgIcon(
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/200/svg">
    <path d={hideMeasurementIconPath} />
  </svg>,
  'HideMeasurementIcon'
);

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
      sx={sxClasses.navButton}
    >
      {!hideMeasurements ? <StraightenIcon /> : <HideMeasurementIcon />}
    </IconButton>
  );
}
